import {
    CloseOutlined,
    CloudSyncOutlined,
    DeleteOutlined,
    FolderAddOutlined,
    NodeExpandOutlined,
    QuestionCircleOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import { Button, Flex, Input, Table, theme, Tooltip } from "antd";
import { Key } from "antd/es/table/interface";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { TeddyCloudApi } from "../../../api";
import { defaultAPIConfig } from "../../../config/defaultApiConfig";

import TonieAudioPlaylistEditor from "../TonieAudioPlaylistEditor";
import TonieInformationModal from "../common/modals/TonieInformationModal";

import { ffmpegSupportedExtensions } from "../../../utils/files/ffmpegSupportedExtensions";

import { FileObject, Record, RecordTafHeader } from "../../../types/fileBrowserTypes";

import { LoadingSpinnerAsOverlay } from "../../common/elements/LoadingSpinner";
import HelpModal from "./modals/FileBrowserHelpModal";

import { useFileBrowserCore } from "./hooks/useFileBrowserCore";
import { useFileDownload } from "./hooks/useFileDownload";
import { useMigrateContent2Lib } from "./hooks/useMigrateContent2Lib";
import DeleteFilesModal from "./modals/DeleteFilesModal";
import EncodeFilesModal from "./modals/EncodeFilesModal";
import JsonViewerModal from "./modals/JsonViewerModal";
import MoveFilesModal from "./modals/MoveFilesModal";
import RenameFileModal from "./modals/RenameFilesModal";
import TafHeaderModal from "./modals/TafHeaderModal";
import UploadFilesModal from "./modals/UploadFilesModal";
import CreateDirectoryModal from "../common/modals/CreateDirectoryModal";
import { MAX_FILES } from "../../../constants/numbers";
import { createColumns } from "./helper/Columns";
import { generateUUID } from "../../../utils/ids/generateUUID";
import { useAudioContext } from "../../../contexts/AudioContext";
import { useDirectoryTree } from "../common/hooks/useDirectoryTree";
import { useDirectoryCreate } from "../common/hooks/useCreateDirectory";

const api = new TeddyCloudApi(defaultAPIConfig());

const { useToken } = theme;

export const FileBrowser: React.FC<{
    special: string;
    filetypeFilter?: string[];
    isTapList?: boolean;
    overlay?: string;
    trackUrl?: boolean;
    showDirOnly?: boolean;
    showColumns?: string[];
}> = ({
    special,
    filetypeFilter = [],
    isTapList = false,
    overlay = "",
    trackUrl = true,
    showDirOnly = false,
    showColumns = undefined,
}) => {
    const { t } = useTranslation();
    const { playAudio } = useAudioContext();
    const { token } = useToken();

    const navigate = useNavigate();

    const [currentFile, setCurrentFile] = useState<string>("");
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const [isInformationModalOpen, setIsInformationModalOpen] = useState<boolean>(false);
    const [currentRecord, setCurrentRecord] = useState<Record>();
    const [currentAudioUrl, setCurrentAudioUrl] = useState<string>("");

    const [jsonData, setJsonData] = useState<string>("");
    const [isJsonViewerModalOpen, setIsJsonViewerModalOpen] = useState<boolean>(false);
    const [jsonViewerFile, setJsonViewerFile] = useState<string | null>(null);

    const [isTapEditorModalOpen, setIsTapEditorModalOpen] = useState<boolean>(false);
    const [tapEditorKey, setTapEditorKey] = useState<number>(0);

    const [isTafMetaEditorModalOpen, setIsTafMetaEditorModalOpen] = useState<boolean>(false);
    const [tafMetaEditorKey, setTafMetaEditorKey] = useState<number>(0);

    const [isTafHeaderModalOpen, setIsTafHeaderModalOpen] = useState<boolean>(false);
    const [tafHeaderRecord, setTafHeaderRecord] = useState<RecordTafHeader | null>(null);

    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
    const [isConfirmMultipleDeleteModalOpen, setIsConfirmMultipleDeleteModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);
    const [deletePath, setDeletePath] = useState<string>("");
    const [deleteApiCall, setDeleteApiCall] = useState<string>("");

    const [isMoveFileModalOpen, setIsMoveFileModalOpen] = useState<boolean>(false);
    const [isRenameFileModalOpen, setIsRenameFileModalOpen] = useState<boolean>(false);

    const [isOpenUploadDragAndDropModal, setIsOpenUploadDragAndDropModal] = useState<boolean>(false);
    const [uploadFileList, setUploadFileList] = useState<any[]>([]);

    const [isEncodeFilesModalOpen, setIsEncodeFilesModalOpen] = useState<boolean>(false);
    const [encodeFileList, setEncodeFileList] = useState<FileObject[]>([]);

    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    const [downloading, setDownloading] = useState<{ [key: string]: boolean }>({});

    const directoryTree = useDirectoryTree();

    const { setTreeNodeId, rootTreeNode } = directoryTree;

    const {
        path,
        setPath,
        files,
        setRebuildList,
        loading,
        filterText,
        filterFieldAutoFocus,
        setFilterFieldAutoFocus,
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
        mode: "fileBrowser",
        special,
        overlay,
        showDirOnly,
        filetypeFilter,
        trackUrl,
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
        setRebuildList,
    });

    // other helper functions
    const fetchJsonData = async (path: string) => {
        try {
            const response = await api.apiGetTeddyCloudApiRaw(path);
            const data = await response.json();
            setJsonData(data);
        } catch (error) {
            console.error("Error fetching JSON data:", error);
        }
    };

    // information modal
    const showInformationModal = (record: any) => {
        if (!record.isDir && record.tonieInfo?.tracks) {
            setCurrentRecord(record);
            setCurrentAudioUrl(buildContentUrl(record.name, { ogg: true }));
            setIsInformationModalOpen(true);
        }
    };

    // json viewer
    const showJsonViewer = (file: string) => {
        setJsonViewerFile(file);
        setIsJsonViewerModalOpen(true);
    };

    // taf header
    const showTafHeader = (file: string, recordTafHeader: RecordTafHeader) => {
        setCurrentFile(file);
        setTafHeaderRecord(recordTafHeader);
        setIsTafHeaderModalOpen(true);
    };

    const closeTafHeader = () => {
        setIsTafHeaderModalOpen(false);
        setTafHeaderRecord(null);
    };

    // tap functions
    const handleEditTapClick = (file: string) => {
        if (file.includes(".tap")) {
            const folder = special === "library" ? "/library" : "/content";
            fetchJsonData(folder + file);
            setCurrentFile(file);
            setTapEditorKey((prevKey) => prevKey + 1);
            setIsTapEditorModalOpen(true);
        }
    };

    const onTAPCreate = (values: any) => {
        console.log("Received values of form: ", values);
        setIsTapEditorModalOpen(false);
    };

    // taf meta placeholder
    const handleEditTafMetaDataClick = (path: string, record: Record) => {
        // ToDo
    };

    // delete functions
    const showDeleteConfirmDialog = (fileName: string, pathWithFile: string, apiCall: string) => {
        setFileToDelete(fileName);
        setDeletePath(decodeURIComponent(pathWithFile));
        setDeleteApiCall(apiCall);
        setIsConfirmDeleteModalOpen(true);
    };

    const handleMultipleDelete = () => {
        setIsConfirmMultipleDeleteModalOpen(true);
    };

    const closeSingleDeleteModal = () => {
        setIsConfirmDeleteModalOpen(false);
    };

    const closeMultipleDeleteModal = () => {
        setIsConfirmMultipleDeleteModalOpen(false);
    };

    // move file
    const showMoveDialog = (fileName: string) => {
        setTreeNodeId(rootTreeNode.id);
        setCurrentFile(fileName || "");
        setIsMoveFileModalOpen(true);
    };

    const closeMoveFileModal = () => {
        setIsMoveFileModalOpen(false);
        setTreeNodeId(rootTreeNode.id);
    };

    // rename file
    const showRenameDialog = (fileName: string) => {
        setCurrentFile(fileName);
        setIsRenameFileModalOpen(true);
    };

    const closeRenameFileModal = () => {
        setIsRenameFileModalOpen(false);
    };

    // encode files
    const showFileEncodeModal = () => {
        setTreeNodeId(rootTreeNode.id);
        const newEncodedFiles: FileObject[] = [];

        const decodedPath =
            path
                ?.split("/")
                .filter(Boolean)
                .map((segment) => decodeURIComponent(segment))
                .join("/") ?? "";

        for (const rowName of selectedRowKeys) {
            const file = files.find(
                (file) =>
                    file.name === rowName &&
                    ffmpegSupportedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
            );

            if (file) {
                newEncodedFiles.push({
                    uid: generateUUID(),
                    name: file.name,
                    path: decodedPath,
                });
            }
        }

        setEncodeFileList(newEncodedFiles);
        setIsEncodeFilesModalOpen(true);
    };

    const closeEncodeFilesModal = () => {
        setIsEncodeFilesModalOpen(false);
        setEncodeFileList([]);
    };

    // upload files
    const showUploadFilesDragAndDropModal = () => {
        setIsOpenUploadDragAndDropModal(true);
    };

    const closeUploadDragAndDropModal = () => {
        setUploadFileList([]);
        setIsOpenUploadDragAndDropModal(false);
    };

    // hooks for actions
    const { migrateContent2Lib } = useMigrateContent2Lib({
        setRebuildList,
    });

    const { handleFileDownload } = useFileDownload({
        setDownloading,
    });

    // table selection / classes
    const rowClassName = (record: any) => {
        return selectedRowKeys.includes(record.key) ? "highlight-row" : "";
    };

    const onSelectChange = (newSelectedRowKeys: Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    // dir navigation
    const handleDirClick = (dirPath: string) => {
        const newPath = buildDirPath(dirPath);
        if (trackUrl) {
            navigate(`?path=${newPath}`);
        }
        handleFilterFieldInputBlur();
        setSelectedRowKeys([]);
        setPath(newPath);
    };

    // sorting helpers
    const withinTafBoundaries = (numberOfFiles: number) => {
        return numberOfFiles > 0 && numberOfFiles <= MAX_FILES;
    };

    // columns

    const columns = createColumns({
        mode: "full",
        path,
        special,
        overlay,
        filterText,
        showDirOnly,
        showColumns,
        isTapList,
        downloading,
        defaultSorter,
        dirNameSorter,
        withinTafBoundaries,
        handleDirClick,
        showInformationModal,
        playAudio,
        handleFileDownload,
        migrateContent2Lib,
        handleEditTapClick,
        handleEditTafMetaDataClick,
        showRenameDialog,
        showMoveDialog,
        showDeleteConfirmDialog,
    });

    return (
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
                onCloseSingle={closeSingleDeleteModal}
                multipleOpen={isConfirmMultipleDeleteModalOpen}
                onCloseMultiple={closeMultipleDeleteModal}
            />
            {isJsonViewerModalOpen && (
                <JsonViewerModal
                    open={isJsonViewerModalOpen}
                    onClose={() => setIsJsonViewerModalOpen(false)}
                    special={special}
                    file={jsonViewerFile}
                />
            )}
            {isTafHeaderModalOpen && (
                <TafHeaderModal
                    open={isTafHeaderModalOpen}
                    onClose={closeTafHeader}
                    fileName={currentFile}
                    recordTafHeader={tafHeaderRecord}
                />
            )}
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
            {isOpenUploadDragAndDropModal && (
                <UploadFilesModal
                    open={isOpenUploadDragAndDropModal}
                    onClose={closeUploadDragAndDropModal}
                    path={path}
                    special={special}
                    uploadFileList={uploadFileList as any}
                    setUploadFileList={setUploadFileList as any}
                    setRebuildList={setRebuildList}
                />
            )}
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
                    setFilterFieldAutoFocus={setFilterFieldAutoFocus}
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
            {isEncodeFilesModalOpen && (
                <EncodeFilesModal
                    open={isEncodeFilesModalOpen}
                    onClose={closeEncodeFilesModal}
                    special={special}
                    encodeFileList={encodeFileList}
                    setEncodeFileList={setEncodeFileList}
                    directoryTree={directoryTree}
                    setFilterFieldAutoFocus={setFilterFieldAutoFocus}
                    setRebuildList={setRebuildList}
                    setSelectedRowKeys={setSelectedRowKeys}
                />
            )}
            {isTapEditorModalOpen && (
                <TonieAudioPlaylistEditor
                    open={isTapEditorModalOpen}
                    key={tapEditorKey}
                    initialValuesJson={jsonData ? JSON.stringify(jsonData, null, 2) : undefined}
                    onCreate={onTAPCreate}
                    onCancel={() => {
                        setIsTapEditorModalOpen(false);
                    }}
                />
            )}
            {isHelpModalOpen && <HelpModal open={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />}
            {currentRecord ? (
                <TonieInformationModal
                    open={isInformationModalOpen}
                    tonieCardOrTAFRecord={{ ...currentRecord, audioUrl: currentAudioUrl }}
                    onClose={() => setIsInformationModalOpen(false)}
                    overlay={overlay}
                />
            ) : (
                ""
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        marginBottom: 8,
                        width: "100%",
                        justifyContent: "space-between",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <div style={{ lineHeight: 1.5, marginRight: 16 }}>{t("tonies.currentPath")}</div>
                        {generateBreadcrumbs(path)}
                    </div>
                    <div style={{ alignSelf: "flex-end" }}>({files.filter((x) => x.name != "..").length})</div>
                </div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        marginBottom: 8,
                        minHeight: 32,
                    }}
                >
                    {special === "library" ? (
                        <div style={{ width: "100%" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 32 }}>
                                {selectedRowKeys.length > 0 ? (
                                    <>
                                        {special === "library" &&
                                        files.filter((item) => selectedRowKeys.includes(item.name) && !item.isDir)
                                            .length > 0 ? (
                                            <Tooltip
                                                key="moveMultiple"
                                                title={t("fileBrowser.moveMultiple", {
                                                    selectedRowCount: selectedRowKeys.length,
                                                })}
                                            >
                                                <Button
                                                    size="small"
                                                    icon={<NodeExpandOutlined />}
                                                    onClick={() => showMoveDialog("")}
                                                    disabled={selectedRowKeys.length === 0}
                                                >
                                                    <div className="showBigDevicesOnly showMediumDevicesOnly">
                                                        {t("fileBrowser.move")}
                                                    </div>
                                                </Button>
                                            </Tooltip>
                                        ) : (
                                            ""
                                        )}
                                        <Tooltip
                                            key="deleteMultiple"
                                            title={t("fileBrowser.deleteMultiple", {
                                                selectedRowCount: selectedRowKeys.length,
                                            })}
                                        >
                                            <Button
                                                size="small"
                                                icon={<DeleteOutlined />}
                                                onClick={handleMultipleDelete}
                                                disabled={selectedRowKeys.length === 0}
                                            >
                                                <div className="showBigDevicesOnly showMediumDevicesOnly">
                                                    {t("fileBrowser.delete")}
                                                </div>
                                            </Button>
                                        </Tooltip>
                                        {withinTafBoundaries(
                                            files.filter(
                                                (item) =>
                                                    selectedRowKeys.includes(item.name) &&
                                                    ffmpegSupportedExtensions.some((ext) =>
                                                        item.name.toLowerCase().endsWith(ext)
                                                    )
                                            ).length
                                        ) && special === "library" ? (
                                            <Tooltip
                                                key="encodeFiles"
                                                title={
                                                    t("fileBrowser.encodeFiles.encodeFiles", {
                                                        selectedRowCount: selectedRowKeys.length,
                                                    }) + ffmpegSupportedExtensions.join(", ")
                                                }
                                            >
                                                <Button
                                                    size="small"
                                                    icon={<CloudSyncOutlined />}
                                                    onClick={showFileEncodeModal}
                                                    disabled={selectedRowKeys.length === 0}
                                                >
                                                    <div className="showBigDevicesOnly showMediumDevicesOnly">
                                                        {t("fileBrowser.encodeFiles.encode")}
                                                    </div>
                                                </Button>
                                            </Tooltip>
                                        ) : (
                                            ""
                                        )}
                                    </>
                                ) : (
                                    <></>
                                )}
                                <Button
                                    icon={<FolderAddOutlined />}
                                    size="small"
                                    onClick={() => openCreateDirectoryModal(path)}
                                >
                                    <div className="showBigDevicesOnly showMediumDevicesOnly">
                                        {t("fileBrowser.createDirectory.createDirectory")}
                                    </div>
                                </Button>
                                <Button
                                    icon={<UploadOutlined />}
                                    size="small"
                                    onClick={showUploadFilesDragAndDropModal}
                                >
                                    <div className="showBigDevicesOnly showMediumDevicesOnly">
                                        {t("fileBrowser.upload.showUploadFilesDragNDrop")}
                                    </div>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div></div>
                    )}
                    <div>
                        <Button
                            size="small"
                            icon={<QuestionCircleOutlined />}
                            onClick={() => setIsHelpModalOpen(true)}
                            style={{ marginLeft: 8 }}
                        >
                            {t("fileBrowser.help.showHelp")}
                        </Button>
                    </div>
                </div>
            </div>
            <div className="test" style={{ position: "relative" }} ref={parentRef}>
                {loading ? <LoadingSpinnerAsOverlay parentRef={parentRef} /> : ""}
                <Table
                    dataSource={files}
                    columns={columns}
                    rowKey={(record) => record.name}
                    pagination={false}
                    onRow={(record) => ({
                        onDoubleClick: () => {
                            if (record.isDir) {
                                handleDirClick(record.name);
                            } else if (record.name.includes(".json") || record.name.includes(".tap")) {
                                showJsonViewer(path + "/" + record.name);
                            } else if (record.tafHeader) {
                                showTafHeader(record.name, record.tafHeader);
                            }
                        },
                        style: { cursor: record.isDir ? "context-menu" : "unset" },
                    })}
                    rowClassName={rowClassName}
                    rowSelection={{
                        columnTitle: (checkbox) => (
                            <Flex gap="small">
                                {checkbox}
                                {selectedRowKeys.length > 0 && <>({selectedRowKeys.length})</>}
                            </Flex>
                        ),
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
                    }}
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
