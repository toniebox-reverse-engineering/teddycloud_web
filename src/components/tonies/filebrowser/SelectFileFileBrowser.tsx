import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Table, Input, theme, Button, Flex, Tooltip, Modal } from "antd";
import { Key } from "antd/es/table/interface";
import { CloseOutlined, DeleteOutlined, FolderAddOutlined, NodeExpandOutlined, UploadOutlined } from "@ant-design/icons";

import { Record } from "../../../types/fileBrowserTypes";

import { LoadingSpinnerAsOverlay } from "../../common/elements/LoadingSpinner";
import TonieInformationModal from "../common/modals/TonieInformationModal";
import { useTeddyCloud } from "../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../types/teddyCloudNotificationTypes";
import { useFileBrowserCore } from "./hooks/useFileBrowserCore";
import { createColumns } from "./helper/Columns";
import { useAudioContext } from "../../../contexts/AudioContext";
import { useDirectoryTree } from "../common/hooks/useDirectoryTree";
import { useDirectoryCreate } from "../common/hooks/useCreateDirectory";
import { useFileDownload } from "./hooks/useFileDownload";
import CreateDirectoryModal from "../common/modals/CreateDirectoryModal";
import DeleteFilesModal from "./modals/DeleteFilesModal";
import MoveFilesModal from "./modals/MoveFilesModal";
import RenameFileModal from "./modals/RenameFilesModal";
import UploadFilesModal from "./modals/UploadFilesModal";
import { canHover } from "../../../utils/browser/browserUtils";

const { useToken } = theme;

export const SelectFileFileBrowser: React.FC<{
    special: string;
    initialPath?: string;
    filetypeFilter?: string[];
    overlay?: string;
    maxSelectedRows?: number;
    trackUrl?: boolean;
    showDirOnly?: boolean;
    showColumns?: string[];
    enableFileManagement?: boolean;
    onFileSelectChange?: (files: any[], path: string, special: string) => void;
    onUploadedFiles?: (files: string[], path: string, special: string) => void;
}> = ({
    special,
    initialPath = "",
    filetypeFilter = [],
    overlay = "",
    maxSelectedRows = 0,
    trackUrl = true,
    showDirOnly = false,
    showColumns = undefined,
    enableFileManagement = false,
    onFileSelectChange,
    onUploadedFiles,
}) => {
    const { t } = useTranslation();
    const { playAudio } = useAudioContext();
    const { token } = useToken();
    const { addNotification } = useTeddyCloud();

    const navigate = useNavigate();

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const [isInformationModalOpen, setIsInformationModalOpen] = useState<boolean>(false);

    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
    const [isConfirmMultipleDeleteModalOpen, setIsConfirmMultipleDeleteModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);
    const [deletePath, setDeletePath] = useState<string>("");
    const [deleteApiCall, setDeleteApiCall] = useState<string>("");
    const [isMoveFileModalOpen, setIsMoveFileModalOpen] = useState<boolean>(false);
    const [isRenameFileModalOpen, setIsRenameFileModalOpen] = useState<boolean>(false);
    const [currentFile, setCurrentFile] = useState<string>("");
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadFileList, setUploadFileList] = useState<any[]>([]);
    const [downloading, setDownloading] = useState<{ [key: string]: boolean }>({});
    const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [imagePreviewUrl, setImagePreviewUrl] = useState("");
    const [currentRecord, setCurrentRecord] = useState<Record>();
    const [currentAudioUrl, setCurrentAudioUrl] = useState<string>("");

    const {
        path,
        setPath,
        files,
        rebuildList,
        setRebuildList,
        loading,
        filterText,
        filterFieldAutoFocus,
        handleFilterChange,
        clearFilterField,
        handleFilterFieldInputFocus,
        handleFilterFieldInputBlur,
        inputFilterRef,
        generateBreadcrumbs,
        buildDirPath,
        buildContentUrl,
        defaultSorter,
        dirNameSorter,
        noData,
        parentRef,
    } = useFileBrowserCore({
        mode: "select",
        special,
        overlay,
        showDirOnly,
        filetypeFilter,
        trackUrl,
        initialPath,
    });

    const directoryTree = useDirectoryTree(special, {
        skipPreload: special === "custom_img",
    });

    const {
        open: isCreateDirectoryModalOpen,
        createDirectoryPath,
        createDirectoryInputKey,
        hasNewDirectoryInvalidChars,
        isCreateDirectoryButtonDisabled,
        inputCreateDirectoryRef,
        openCreateDirectoryModal,
        closeCreateDirectoryModal,
        handleCreateDirectoryInputChange,
        createDirectory,
    } = useDirectoryCreate({
        path,
        directoryTree,
        selectNewNode: true,
        setRebuildList: enableFileManagement ? setRebuildList : undefined,
        special,
    });

    const { handleFileDownload } = useFileDownload({
        setDownloading: enableFileManagement ? setDownloading : () => {},
    });

    useEffect(() => {
        setSelectedRowKeys([]);
    }, [rebuildList]);

    const showInformationModal = (record: any) => {
        if (!record.isDir && record.tonieInfo?.tracks) {
            setCurrentRecord(record);
            setCurrentAudioUrl(buildContentUrl(record.name, { ogg: true }));
            setIsInformationModalOpen(true);
        }
    };

    // table helpers
    const rowClassName = (record: any) => {
        return selectedRowKeys.includes(record.key) ? "highlight-row" : "";
    };

    const onSelectChange = (newSelectedRowKeys: Key[]) => {
        if (maxSelectedRows > 0) {
            if (filetypeFilter) {
                const rowCount = newSelectedRowKeys.length;
                newSelectedRowKeys = newSelectedRowKeys.filter((key) => {
                    const file = files.find((f: any) => f.name === key) as any;
                    return (
                        (file && file.tafHeader !== undefined) ||
                        (file && filetypeFilter.some((ext) => file.name.toLowerCase().endsWith(ext)))
                    );
                });
                if (rowCount !== newSelectedRowKeys.length) {
                    addNotification(
                        NotificationTypeEnum.Warning,
                        t("fileBrowser.fileTypesWarning"),
                        t("fileBrowser.selectAllowedFileTypesOnly", { fileTypes: filetypeFilter.join(", ") }),
                        t("fileBrowser.title")
                    );
                }
            }
            if (newSelectedRowKeys.length > maxSelectedRows) {
                addNotification(
                    NotificationTypeEnum.Warning,
                    t("fileBrowser.maxSelectedRowsWarning"),
                    t("fileBrowser.maxSelectedRows", {
                        maxSelectedRows: maxSelectedRows,
                    }),
                    t("fileBrowser.title")
                );
            } else {
                setSelectedRowKeys(newSelectedRowKeys);
            }
        } else {
            setSelectedRowKeys(newSelectedRowKeys);
        }
        const selectedFiles = files?.filter((file: any) => newSelectedRowKeys.includes(file.name)) || [];
        if (onFileSelectChange !== undefined) onFileSelectChange(selectedFiles, path, special);
    };

    const handleDirClick = (dirPath: string) => {
        const newPath = buildDirPath(dirPath);
        if (trackUrl) {
            navigate(`?path=${newPath}`);
        }
        handleFilterFieldInputBlur();
        setSelectedRowKeys([]);
        setPath(newPath);
    };

    const showDeleteConfirmDialog = (fileName: string, pathWithFile: string, apiCall: string) => {
        setFileToDelete(fileName);
        setDeletePath(decodeURIComponent(pathWithFile));
        setDeleteApiCall(apiCall);
        setIsConfirmDeleteModalOpen(true);
    };

    const showMoveDialog = (fileName: string) => {
        directoryTree.setTreeNodeId(directoryTree.rootTreeNode.id);
        setCurrentFile(fileName || "");
        setIsMoveFileModalOpen(true);
    };

    const showRenameDialog = (fileName: string) => {
        setCurrentFile(fileName);
        setIsRenameFileModalOpen(true);
    };

    const closeMoveFileModal = () => {
        setIsMoveFileModalOpen(false);
        directoryTree.setTreeNodeId(directoryTree.rootTreeNode.id);
    };

    const closeRenameFileModal = () => {
        setIsRenameFileModalOpen(false);
    };

    const handleMultipleDelete = () => {
        setIsConfirmMultipleDeleteModalOpen(true);
    };

    const imageFilesSelected = enableFileManagement
        ? files.filter((item) => selectedRowKeys.includes(item.name) && !item.isDir).length
        : 0;

    // columns
    const columns = createColumns({
        mode: enableFileManagement ? "full" : "select",
        path,
        special,
        overlay,
        filterText,
        showDirOnly,
        showColumns,
        defaultSorter,
        dirNameSorter,
        downloading: enableFileManagement ? downloading : undefined,
        handleDirClick,
        showInformationModal,
        playAudio,
        handleFileDownload: enableFileManagement ? handleFileDownload : undefined,
        showRenameDialog: enableFileManagement ? showRenameDialog : undefined,
        showMoveDialog: enableFileManagement ? showMoveDialog : undefined,
        showDeleteConfirmDialog: enableFileManagement ? showDeleteConfirmDialog : undefined,
        buildContentUrl: special === "custom_img" ? buildContentUrl : undefined,
        onImagePreviewClick:
            special === "custom_img"
                ? (url) => {
                      setImagePreviewUrl(url);
                      setImagePreviewOpen(true);
                  }
                : undefined,
    });

    return (
        <>
            {enableFileManagement && (
                <>
                    <DeleteFilesModal
                        special={special}
                        overlay={overlay}
                        files={files as Record[]}
                        path={path}
                        setRebuildList={setRebuildList}
                        selectedRowKeys={selectedRowKeys}
                        setSelectedRowKeys={setSelectedRowKeys}
                        singleOpen={isConfirmDeleteModalOpen}
                        fileToDelete={fileToDelete}
                        deletePath={deletePath}
                        deleteApiCall={deleteApiCall}
                        onCloseSingle={() => setIsConfirmDeleteModalOpen(false)}
                        multipleOpen={isConfirmMultipleDeleteModalOpen}
                        onCloseMultiple={() => setIsConfirmMultipleDeleteModalOpen(false)}
                    />
                    {isCreateDirectoryModalOpen && (
                        <CreateDirectoryModal
                            open={isCreateDirectoryModalOpen}
                            createDirectoryPath={createDirectoryPath}
                            createDirectoryInputKey={createDirectoryInputKey}
                            hasNewDirectoryInvalidChars={hasNewDirectoryInvalidChars}
                            isCreateDirectoryButtonDisabled={isCreateDirectoryButtonDisabled}
                            inputRef={inputCreateDirectoryRef}
                            onInputChange={handleCreateDirectoryInputChange}
                            onClose={closeCreateDirectoryModal}
                            onCreate={createDirectory}
                        />
                    )}
                    <UploadFilesModal
                        open={isUploadModalOpen}
                        onClose={() => setIsUploadModalOpen(false)}
                        path={path}
                        special={special}
                        uploadFileList={uploadFileList}
                        setUploadFileList={setUploadFileList}
                        setRebuildList={setRebuildList}
                        onUploadedFiles={onUploadedFiles}
                    />
                    {isMoveFileModalOpen && (
                        <MoveFilesModal
                            open={isMoveFileModalOpen}
                            onClose={closeMoveFileModal}
                            special={special}
                            overlay={overlay}
                            path={path}
                            files={files as Record[]}
                            currentFile={currentFile || null}
                            selectedRowKeys={selectedRowKeys}
                            setSelectedRowKeys={setSelectedRowKeys}
                            directoryTree={directoryTree}
                            setFilterFieldAutoFocus={() => {}}
                            setRebuildList={setRebuildList}
                        />
                    )}
                    {isRenameFileModalOpen && (
                        <RenameFileModal
                            open={isRenameFileModalOpen}
                            onClose={closeRenameFileModal}
                            special={special}
                            overlay={overlay}
                            path={path}
                            currentFile={currentFile || null}
                            setRebuildList={setRebuildList}
                        />
                    )}
                </>
            )}
            {special === "custom_img" && (
                <Modal
                    title={t("tonies.customEditor.previewTitle", { defaultValue: "Image preview" })}
                    open={imagePreviewOpen}
                    onCancel={() => setImagePreviewOpen(false)}
                    footer={null}
                >
                    {imagePreviewUrl ? (
                        <img
                            src={imagePreviewUrl}
                            alt="preview"
                            referrerPolicy="no-referrer"
                            style={{ width: "100%" }}
                        />
                    ) : null}
                </Modal>
            )}
            {currentRecord && isInformationModalOpen && (
                <TonieInformationModal
                    open={isInformationModalOpen}
                    tonieCardOrTAFRecord={{ ...currentRecord, audioUrl: currentAudioUrl }}
                    onClose={() => setIsInformationModalOpen(false)}
                    overlay={overlay}
                />
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "row", marginBottom: 8 }}>
                    <div style={{ lineHeight: 1.5, marginRight: 16 }}>{t("tonies.currentPath")}</div>
                    {generateBreadcrumbs(path)}
                </div>
                {enableFileManagement && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8, minHeight: 32 }}>
                        {selectedRowKeys.length > 0 && (
                            <>
                                {imageFilesSelected > 0 && (
                                    <Tooltip
                                        open={!canHover ? false : undefined}
                                        title={t("fileBrowser.moveMultiple", {
                                            selectedRowCount: selectedRowKeys.length,
                                        })}
                                    >
                                        <Button
                                            size="small"
                                            icon={<NodeExpandOutlined />}
                                            onClick={() => showMoveDialog("")}
                                        >
                                            {t("fileBrowser.move")}
                                        </Button>
                                    </Tooltip>
                                )}
                                <Tooltip
                                    open={!canHover ? false : undefined}
                                    title={t("fileBrowser.deleteMultiple", {
                                        selectedRowCount: selectedRowKeys.length,
                                    })}
                                >
                                    <Button
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={handleMultipleDelete}
                                    >
                                        {t("fileBrowser.delete")}
                                    </Button>
                                </Tooltip>
                            </>
                        )}
                        <Button
                            icon={<FolderAddOutlined />}
                            size="small"
                            onClick={() => openCreateDirectoryModal(path)}
                        >
                            {t("fileBrowser.createDirectory.createDirectory")}
                        </Button>
                        <Button
                            icon={<UploadOutlined />}
                            size="small"
                            onClick={() => setIsUploadModalOpen(true)}
                        >
                            {t("fileBrowser.upload.showUploadFilesDragNDrop")}
                        </Button>
                    </div>
                )}
            </div>
            <div className="test" style={{ position: "relative" }} ref={parentRef}>
                {loading ? <LoadingSpinnerAsOverlay parentRef={parentRef} /> : ""}
                <Table
                    dataSource={files}
                    columns={columns}
                    rowKey={(record) => record.name}
                    pagination={false}
                    scroll={enableFileManagement ? { x: "max-content" } : undefined}
                    onRow={(record) => ({
                        onDoubleClick: () => {
                            if (record.isDir) {
                                handleDirClick(record.name);
                            } else {
                                const newSelectedKeys = selectedRowKeys.includes(record.name)
                                    ? selectedRowKeys.filter((key) => key !== record.name)
                                    : [...selectedRowKeys, record.name];

                                onSelectChange(newSelectedKeys);
                            }
                        },
                        style: { cursor: record.isDir ? "context-menu" : "unset" },
                    })}
                    rowClassName={rowClassName}
                    rowSelection={
                        maxSelectedRows > 0
                            ? {
                                  selectedRowKeys,
                                  onChange: onSelectChange,
                              }
                            : {
                                  selectedRowKeys,
                                  onChange: onSelectChange,
                                  getCheckboxProps: (record: Record) => ({
                                      disabled: record.name === "..",
                                  }),
                                  onSelectAll: (selected: boolean, selectedRows: any[]) => {
                                      const selectedKeys = selected
                                          ? selectedRows.filter((row) => row.name !== "..").map((row) => row.name)
                                          : [];
                                      setSelectedRowKeys(selectedKeys);
                                  },
                              }
                    }
                    components={{
                        header: {
                            wrapper: (props: any) => {
                                return <thead {...props} />;
                            },
                            row: (props: any) => {
                                return (
                                    <>
                                        <tr {...props} />
                                        <tr>
                                            <th style={{ padding: "10px 8px" }} colSpan={columns.length + 1}>
                                                <Input
                                                    placeholder={t("fileBrowser.filter")}
                                                    value={filterText}
                                                    onChange={handleFilterChange}
                                                    onFocus={handleFilterFieldInputFocus}
                                                    onBlur={handleFilterFieldInputBlur}
                                                    ref={inputFilterRef}
                                                    style={{ width: "100%" }}
                                                    autoFocus={filterFieldAutoFocus}
                                                    suffix={
                                                        <CloseOutlined
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            onClick={clearFilterField}
                                                            disabled={filterText.length === 0}
                                                            style={{
                                                                color:
                                                                    filterText.length === 0
                                                                        ? token.colorTextDisabled
                                                                        : token.colorText,
                                                                cursor: filterText.length === 0 ? "default" : "pointer",
                                                            }}
                                                        />
                                                    }
                                                />
                                            </th>
                                        </tr>
                                    </>
                                );
                            },
                            cell: (props: any) => {
                                return <th {...props} style={{ position: "sticky", top: 0, zIndex: 8 }} />;
                            },
                        },
                    }}
                    locale={{ emptyText: noData }}
                />
            </div>
        </>
    );
};
