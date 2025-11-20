import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Table, Tooltip, Button, Input, theme, TreeSelectProps, TreeSelect, Empty, Tag, Flex, Spin } from "antd";
import {
    CloseOutlined,
    CloudServerOutlined,
    CloudSyncOutlined,
    CopyOutlined,
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    FolderAddOutlined,
    FolderOutlined,
    FormOutlined,
    LoadingOutlined,
    NodeExpandOutlined,
    PlayCircleOutlined,
    QuestionCircleOutlined,
    TruckOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import { Key, SortOrder } from "antd/es/table/interface";
import { DefaultOptionType } from "antd/es/select";

import { TeddyCloudApi } from "../../../api";
import { defaultAPIConfig } from "../../../config/defaultApiConfig";

import { useTeddyCloud } from "../../../TeddyCloudContext";
import { useAudioContext } from "../../audio/AudioContext";
import { humanFileSize } from "../../../utils/humanFileSize";
import TonieAudioPlaylistEditor from "../TonieAudioPlaylistEditor";
import TonieInformationModal from "../common/TonieInformationModal";

import { supportedAudioExtensionsFFMPG } from "../../../utils/supportedAudioExtensionsFFMPG";

import { LoadingSpinnerAsOverlay } from "../../common/LoadingSpinner";
import { FileObject, Record, RecordTafHeader } from "../../../types/fileBrowserTypes";
import HelpModal from "./modals/FileBrowserHelpModal";
import { generateUUID } from "../../../utils/helpers";

import CreateDirectoryModal from "./modals/CreateDirectoryModal";
import EncodeFilesModal from "./modals/EncodeFilesModal";
import UploadFilesModal from "./modals/UploadFilesModal";
import DeleteFilesModal from "./modals/DeleteFilesModal";
import JsonViewerModal from "./modals/JsonViewerModal";
import TafHeaderModal from "./modals/TafHeaderModal";
import RenameFileModal from "./modals/RenameFilesModal";
import MoveFilesModal from "./modals/MoveFilesModal";
import SelectFilesForEncodingModal from "./modals/SelectFilesForEncodingModal";
import { useMigrateContent2Lib } from "./hooks/useMigrateContent2Lib";
import { useFileDownload } from "./hooks/useFileDownload";
import { useFileBrowserCore } from "./hooks/useFileBrowserCore";

const api = new TeddyCloudApi(defaultAPIConfig());

const { useToken } = theme;

const MAX_FILES = 99;

const supportedAudioExtensionsForEncoding = supportedAudioExtensionsFFMPG;

const rootTreeNode = { id: "1", pId: "-1", value: "1", title: "/", fullPath: "/" };

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
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();

    const navigate = useNavigate();

    const [currentFile, setCurrentFile] = useState<string>("");
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const [treeNodeId, setTreeNodeId] = useState<string>(rootTreeNode.id);
    const [treeData, setTreeData] = useState<Omit<DefaultOptionType, "label">[]>([rootTreeNode]);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

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

    const [isCreateDirectoryModalOpen, setIsCreateDirectoryModalOpen] = useState<boolean>(false);
    const [createDirectoryPath, setCreateDirectoryPath] = useState<string>("");

    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
    const [isConfirmMultipleDeleteModalOpen, setIsConfirmMultipleDeleteModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);
    const [deletePath, setDeletePath] = useState<string>("");
    const [deleteApiCall, setDeleteApiCall] = useState<string>("");

    const [isMoveFileModalOpen, setIsMoveFileModalOpen] = useState<boolean>(false);
    const [isRenameFileModalOpen, setIsRenameFileModalOpen] = useState<boolean>(false);

    const [isOpenUploadDragAndDropModal, setIsOpenUploadDragAndDropModal] = useState<boolean>(false);
    const [uploadFileList, setUploadFileList] = useState<any[]>([]);
    const [uploading, setUploading] = useState<boolean>(false);

    const [isEncodeFilesModalOpen, setIsEncodeFilesModalOpen] = useState<boolean>(false);
    const [encodeFilesModalKey, setEncodeFilesModalKey] = useState<number>(0);
    const [encodeFileList, setEncodeFileList] = useState<FileObject[]>([]);
    const [processing, setProcessing] = useState<boolean>(false);

    const [isSelectFileModalOpen, setIsSelectFileModalOpen] = useState<boolean>(false);
    const [selectFileFileBrowserKey, setSelectFileFileBrowserKey] = useState<number>(0);

    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    const [downloading, setDownloading] = useState<{ [key: string]: boolean }>({});

    const {
        path,
        setPath,
        files,
        setFiles,
        rebuildList,
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
        handleBreadcrumbClick,
        getFieldValue,
        defaultSorter,
        dirNameSorter,
        noData,
        parentRef,
    } = useFileBrowserCore({
        mode: "fileBrowser",
        special,
        api,
        overlay,
        showDirOnly,
        filetypeFilter,
        trackUrl,
    });

    useEffect(() => {
        const preLoadTreeData = async () => {
            const newPath = getPathFromNodeId(rootTreeNode.id);

            api.apiGetTeddyCloudApiRaw(`/api/fileIndexV2?path=${encodeURIComponent(newPath)}&special=library`)
                .then((response) => response.json())
                .then((data) => {
                    let list: any[] = data.files;
                    list = list
                        .filter((entry) => entry.isDir && entry.name !== "..")
                        .sort((a, b) => {
                            return a.name === b.name ? 0 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
                        })
                        .map((entry) => {
                            return {
                                id: rootTreeNode.id + "." + list.indexOf(entry),
                                pId: rootTreeNode.id,
                                value: rootTreeNode.id + "." + list.indexOf(entry),
                                title: entry.name,
                                fullPath: `${newPath}/${entry.name}/`,
                            };
                        });
                    setTreeData(treeData.concat(list));
                });
        };
        preLoadTreeData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setCreateDirectoryPath(getPathFromNodeId(treeNodeId));
    }, [treeNodeId]);

    useEffect(() => {
        setCreateDirectoryPath(path);
    }, [path]);

    // directory tree helpers
    const onLoadTreeData: TreeSelectProps["loadData"] = ({ id }) =>
        new Promise((resolve, reject) => {
            const newPath = getPathFromNodeId(id);
            api.apiGetTeddyCloudApiRaw(`/api/fileIndexV2?path=${encodeURIComponent(newPath)}&special=library`)
                .then((response) => response.json())
                .then((data) => {
                    let list: any[] = data.files;
                    list = list
                        .filter((entry) => entry.isDir && entry.name !== "..")
                        .sort((a, b) => {
                            return a.name === b.name ? 0 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
                        })
                        .map((entry, index) => {
                            const stringId = String(id);
                            const value = `${stringId}.${index}`;
                            return {
                                id: value,
                                pId: stringId,
                                value,
                                title: entry.name,
                                fullPath: `${newPath}/${entry.name}/`,
                            };
                        });
                    setTreeData((prev) => prev.concat(list));
                    resolve(true);
                })
                .catch(reject);
        });

    const getPathFromNodeId = (nodeId: string): string => {
        const node = treeData.filter((entry) => entry.value === nodeId)[0];
        if (node.pId === "-1") return "";
        return getPathFromNodeId(treeData.filter((entry) => entry.id === node.pId)[0].id) + "/" + node.title;
    };

    const findNodeIdByFullPath = (fullPath: string, nodes: any[]): string | null => {
        for (const node of nodes) {
            if (node.fullPath === fullPath) {
                return node.id;
            }
        }
        return null;
    };

    const findNodesByParentId = (parentId: string, nodes: any[]): string[] => {
        const childNodes: string[] = [];
        for (const node of nodes) {
            if (node.pId === parentId) {
                childNodes.push(node);
            }
        }
        return childNodes;
    };

    const isNodeExpanded = (nodeId: string) => {
        return expandedKeys.includes(nodeId);
    };

    const folderTreeElement = (
        <TreeSelect
            className="move-file"
            treeLine
            treeDataSimpleMode
            value={treeNodeId}
            styles={{
                popup: {
                    root: {
                        maxHeight: 400,
                        overflow: "auto",
                    },
                },
            }}
            onChange={setTreeNodeId}
            loadData={onLoadTreeData}
            treeData={treeData}
            treeNodeLabelProp="fullPath"
            placeholder={t("fileBrowser.moveFile.destinationPlaceholder")}
            treeExpandedKeys={expandedKeys}
            onTreeExpand={(keys) => setExpandedKeys(keys.map(String))}
            disabled={processing || uploading}
        />
    );

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
            setCurrentAudioUrl(
                encodeURI("/content" + path + "/" + record.name) +
                    "?ogg=true&special=" +
                    special +
                    (overlay ? `&overlay=${overlay}` : "")
            );
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
        setCreateDirectoryPath(path);
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

    // select files for encoding
    const showSelectFileModal = () => {
        setSelectFileFileBrowserKey((prevKey) => prevKey + 1);
        setIsSelectFileModalOpen(true);
    };

    const handleCancelSelectFile = () => {
        setIsSelectFileModalOpen(false);
    };

    const handleFilesSelectedForEncoding = (newFiles: FileObject[]) => {
        setEncodeFileList((prevList) => [...prevList, ...newFiles]);
    };

    const selectFileModal = (
        <SelectFilesForEncodingModal
            open={isSelectFileModalOpen}
            onClose={handleCancelSelectFile}
            onConfirm={handleFilesSelectedForEncoding}
            maxSelectable={MAX_FILES - encodeFileList.length - 1}
            browserKey={selectFileFileBrowserKey}
        />
    );

    // encode files
    const showFileEncodeModal = () => {
        setEncodeFilesModalKey((prevKey) => prevKey + 1);
        setTreeNodeId(rootTreeNode.id);
        const newEncodedFiles: FileObject[] = [];

        for (const rowName of selectedRowKeys) {
            const file = files.find(
                (file) =>
                    file.name === rowName &&
                    supportedAudioExtensionsForEncoding.some((ext) => file.name.toLowerCase().endsWith(ext))
            );

            if (file) {
                newEncodedFiles.push({
                    uid: generateUUID(),
                    name: file.name,
                    path: path,
                });
            }
        }
        setEncodeFileList(newEncodedFiles);
        setIsEncodeFilesModalOpen(true);
    };

    const closeEncodeFilesModal = () => {
        setIsEncodeFilesModalOpen(false);
        setCreateDirectoryPath(path);
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
        t,
        api,
        addNotification,
        addLoadingNotification,
        closeLoadingNotification,
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
        const newPath =
            dirPath === ".."
                ? path.split("/").map(decodeURIComponent).slice(0, -1).map(encodeURIComponent).join("/")
                : [...path.split("/").map(decodeURIComponent), dirPath].map(encodeURIComponent).join("/");
        if (trackUrl) {
            navigate(`?path=${newPath}`);
        }
        handleFilterFieldInputBlur;
        setSelectedRowKeys([]);
        setPath(newPath);
    };

    // sorting helpers
    const withinTafBoundaries = (numberOfFiles: number) => {
        return numberOfFiles > 0 && numberOfFiles <= MAX_FILES;
    };

    // columns
    let columns: any[] = [
        {
            title: <div style={{ minHeight: 32 }}></div>,
            dataIndex: ["tonieInfo", "picture"],
            key: "picture",
            sorter: undefined,
            width: 10,
            render: (picture: string, record: any) => (
                <>
                    {record && record.tonieInfo?.picture ? (
                        <>
                            <img
                                key={`picture-${record.name}`}
                                src={record.tonieInfo.picture}
                                alt={t("tonies.content.toniePicture")}
                                onClick={() => showInformationModal(record)}
                                style={{
                                    width: 100,
                                    cursor: !record.isDir && record?.tonieInfo?.tracks ? "help" : "default",
                                }}
                            />
                        </>
                    ) : (
                        <></>
                    )}
                    {record.hide ? (
                        <div style={{ textAlign: "center" }}>
                            <Tag bordered={false} color="warning">
                                {t("fileBrowser.hidden")}
                            </Tag>
                        </div>
                    ) : (
                        ""
                    )}
                </>
            ),
            showOnDirOnly: false,
        },
        {
            title: t("fileBrowser.name"),
            dataIndex: "name",
            key: "name",
            sorter: dirNameSorter,
            defaultSortOrder: "ascend" as SortOrder,
            render: (picture: string, record: any) =>
                record && (
                    <div key={`name-${record.name}`}>
                        <div className="showSmallDevicesOnly">
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex" }}>
                                    {record.isDir ? <FolderOutlined style={{ marginRight: 8 }} /> : ""}
                                    <div style={{ wordBreak: record.isDir ? "normal" : "break-word" }}>
                                        {record.isDir ? <>{record.name}</> : record.name}
                                    </div>
                                </div>
                                {!record.isDir && record.size ? " (" + humanFileSize(record.size) + ")" : ""}
                            </div>
                            <div>{record.tonieInfo?.model}</div>
                            <div style={{ wordBreak: record.isDir ? "normal" : "break-word" }}>
                                {(record.tonieInfo?.series ? record.tonieInfo?.series : "") +
                                    (record.tonieInfo?.episode ? " - " + record.tonieInfo?.episode : "")}
                            </div>
                            <div>{!record.isDir && new Date(record.date * 1000).toLocaleString()}</div>
                        </div>
                        <div className="showMediumDevicesOnly">
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex" }}>
                                    {record.isDir ? <FolderOutlined style={{ marginRight: 8 }} /> : ""}
                                    <div style={{ wordBreak: record.isDir ? "normal" : "break-word" }}>
                                        {record.isDir ? <>{record.name}</> : record.name}
                                    </div>
                                </div>
                                {!record.isDir && record.size ? " (" + humanFileSize(record.size) + ")" : ""}
                            </div>
                            <div>{!record.isDir && new Date(record.date * 1000).toLocaleString()}</div>
                        </div>
                        <div className="showBigDevicesOnly">
                            <div style={{ display: "flex" }}>
                                {record.isDir ? <FolderOutlined style={{ marginRight: 8 }} /> : ""}
                                <div style={{ wordBreak: record.isDir ? "normal" : "break-word" }}>
                                    {record.isDir ? <>{record.name}</> : record.name}
                                </div>
                            </div>
                        </div>
                    </div>
                ),
            filteredValue: [filterText],
            onFilter: (value: string, record: Record) => {
                const text = value.toLowerCase();
                return (
                    record.name === ".." ||
                    record.name.toLowerCase().includes(text) ||
                    (!record.isDir &&
                        "tafHeader" in record &&
                        record.tafHeader.size &&
                        humanFileSize(record.tafHeader.size).toString().includes(text)) ||
                    ("tafHeader" in record && record.tafHeader.audioId?.toString().includes(text)) ||
                    ("tonieInfo" in record && record.tonieInfo?.model.toLowerCase().includes(text)) ||
                    ("tonieInfo" in record && record.tonieInfo?.series.toLowerCase().includes(text)) ||
                    ("tonieInfo" in record && record.tonieInfo?.episode.toLowerCase().includes(text))
                );
            },
            showOnDirOnly: true,
        },
        {
            title: t("fileBrowser.size"),
            dataIndex: "size",
            key: "size",
            render: (size: number, record: any) => (
                <div key={`size-${record.name}`}>{record.isDir ? "<DIR>" : humanFileSize(size)}</div>
            ),
            showOnDirOnly: false,
            responsive: ["xl"],
        },
        {
            title: t("fileBrowser.model"),
            dataIndex: ["tonieInfo", "model"],
            key: "model",
            showOnDirOnly: false,
            responsive: ["xl"],
            render: (model: string, record: any) => <div key={`model-${record.name}`}>{record.tonieInfo?.model}</div>,
        },
        {
            title: (
                <>
                    <div className="showMediumDevicesOnly">
                        {t("fileBrowser.model")}/{t("fileBrowser.series")}/{t("fileBrowser.episode")}
                    </div>
                    <div className="showBigDevicesOnly">{t("fileBrowser.series")}</div>
                </>
            ),
            dataIndex: ["tonieInfo", "series"],
            key: "series",
            render: (series: string, record: any) => (
                <div key={`series-${record.name}`}>
                    <div className="showMediumDevicesOnly">
                        <div>{record.tonieInfo?.model}</div>
                        <div style={{ wordBreak: "break-word" }}>
                            {(record.tonieInfo?.series ? record.tonieInfo?.series : "") +
                                (record.tonieInfo?.episode ? " - " + record.tonieInfo?.episode : "")}
                        </div>
                    </div>
                    <div className="showBigDevicesOnly">{record.tonieInfo?.series ? record.tonieInfo?.series : ""}</div>
                </div>
            ),
            showOnDirOnly: false,
            responsive: ["md"],
        },
        {
            title: t("fileBrowser.episode"),
            dataIndex: ["tonieInfo", "episode"],
            key: "episode",
            showOnDirOnly: false,
            responsive: ["xl"],
            render: (episode: string, record: any) => (
                <div key={`episode-${record.name}`}>{record.tonieInfo?.episode}</div>
            ),
        },
        {
            title: t("fileBrowser.date"),
            dataIndex: "date",
            key: "date",
            render: (timestamp: number, record: any) => (
                <div key={`date-${record.name}`}>{new Date(timestamp * 1000).toLocaleString()}</div>
            ),
            showOnDirOnly: true,
            responsive: ["xl"],
        },
        {
            title: <div className="showMediumDevicesOnly showBigDevicesOnly">{t("fileBrowser.actions")}</div>,
            dataIndex: "controls",
            key: "controls",
            sorter: undefined,
            render: (name: string, record: any) => {
                const actions: React.ReactNode[] = [];

                if (record.tafHeader) {
                    actions.push(
                        <Tooltip key={`action-play-${record.name}`} title={t("fileBrowser.playFile")}>
                            <PlayCircleOutlined
                                style={{ margin: "4px 8px 4px 0", padding: 4 }}
                                onClick={() =>
                                    playAudio(
                                        encodeURI(
                                            import.meta.env.VITE_APP_TEDDYCLOUD_API_URL +
                                                "/content" +
                                                decodeURIComponent(path) +
                                                "/" +
                                                record.name
                                        ) +
                                            "?ogg=true&special=" +
                                            special +
                                            (overlay ? `&overlay=${overlay}` : ""),
                                        record.tonieInfo,
                                        {
                                            ...record,
                                            audioUrl:
                                                encodeURI("/content" + decodeURIComponent(path) + "/" + record.name) +
                                                "?ogg=true&special=" +
                                                special +
                                                (overlay ? `&overlay=${overlay}` : ""),
                                        }
                                    )
                                }
                            />
                        </Tooltip>
                    );
                    actions.push(
                        downloading[record.name] ? (
                            <Spin
                                key={`action-download-spinner-${record.name}`}
                                style={{ margin: "0 6px 0 0", padding: 4 }}
                                size="small"
                                indicator={<LoadingOutlined style={{ fontSize: 16, color: token.colorText }} spin />}
                            />
                        ) : (
                            <Tooltip key={`action-download-${record.name}`} title={t("fileBrowser.downloadFile")}>
                                <DownloadOutlined
                                    style={{ margin: "4px 8px 4px 0", padding: 4 }}
                                    onClick={() =>
                                        handleFileDownload(
                                            record,
                                            import.meta.env.VITE_APP_TEDDYCLOUD_API_URL,
                                            path,
                                            special,
                                            overlay
                                        )
                                    }
                                />
                            </Tooltip>
                        )
                    );
                    if (special !== "library") {
                        actions.push(
                            <Tooltip key={`action-migrate-${record.name}`} title={t("fileBrowser.migrateContentToLib")}>
                                <CloudServerOutlined
                                    onClick={() =>
                                        migrateContent2Lib(path.replace("/", "") + record.name, false, overlay)
                                    }
                                    style={{ margin: "4px 8px 4px 0", padding: 4 }}
                                />
                            </Tooltip>
                        );
                        actions.push(
                            <Tooltip
                                key={`action-migrate-root-${record.name}`}
                                title={t("fileBrowser.migrateContentToLibRoot")}
                            >
                                <TruckOutlined
                                    onClick={() =>
                                        migrateContent2Lib(path.replace("/", "") + record.name, true, overlay)
                                    }
                                    style={{ margin: "4px 8px 4px 0", padding: 4 }}
                                />
                            </Tooltip>
                        );
                    }
                } else if (supportedAudioExtensionsForEncoding.some((ending) => record.name.endsWith(ending))) {
                    actions.push(
                        <Tooltip key={`action-play-${record.name}`} title={t("fileBrowser.playFile")}>
                            <PlayCircleOutlined
                                style={{ margin: "4px 8px 4px 0", padding: 4 }}
                                onClick={() =>
                                    playAudio(
                                        import.meta.env.VITE_APP_TEDDYCLOUD_API_URL +
                                            "/content" +
                                            path +
                                            "/" +
                                            record.name +
                                            "?special=" +
                                            special +
                                            (overlay ? `&overlay=${overlay}` : ""),
                                        record.tonieInfo
                                    )
                                }
                            />
                        </Tooltip>
                    );
                }

                if (isTapList && record.name.includes(".tap")) {
                    actions.push(
                        <Tooltip key={`action-edit-tap-${record.name}`} title={t("fileBrowser.tap.edit")}>
                            <EditOutlined
                                style={{ margin: "4px 8px 4px 0", padding: 4 }}
                                onClick={() => handleEditTapClick(path + "/" + record.name)}
                            />
                        </Tooltip>
                    );
                    actions.push(
                        <Tooltip key={`action-copy-tap-${record.name}`} title={t("fileBrowser.tap.copy")}>
                            <CopyOutlined style={{ margin: "4px 8px 4px 0", padding: 4 }} />
                        </Tooltip>
                    );
                }

                if (record.tafHeader) {
                    actions.push(
                        <Tooltip key={`action-edit-tafmeta-${record.name}`} title={t("fileBrowser.tafMeta.edit")}>
                            <EditOutlined
                                style={{ margin: "4px 8px 4px 0", padding: 4 }}
                                onClick={() => handleEditTafMetaDataClick(path, record)}
                            />
                        </Tooltip>
                    );
                }

                if (special === "library") {
                    if (!record.isDir && record.name !== "..") {
                        actions.push(
                            <Tooltip key={`action-rename-${record.name}`} title={t("fileBrowser.rename")}>
                                <FormOutlined
                                    onClick={() => showRenameDialog(record.name)}
                                    style={{ margin: "4px 8px 4px 0", padding: 4 }}
                                />
                            </Tooltip>
                        );
                    }
                    if (!record.isDir && record.name !== "..") {
                        actions.push(
                            <Tooltip key={`action-move-${record.name}`} title={t("fileBrowser.move")}>
                                <NodeExpandOutlined
                                    onClick={() => showMoveDialog(record.name)}
                                    style={{ margin: "4px 8px 4px 0", padding: 4 }}
                                />
                            </Tooltip>
                        );
                    }
                }

                if (record.name !== "..") {
                    actions.push(
                        <Tooltip key={`action-delete-${record.name}`} title={t("fileBrowser.delete")}>
                            <DeleteOutlined
                                onClick={() =>
                                    showDeleteConfirmDialog(
                                        record.name,
                                        path + "/" + record.name,
                                        "?special=" + special + (overlay ? `&overlay=${overlay}` : "")
                                    )
                                }
                                style={{ margin: "4px 8px 4px 0", padding: 4 }}
                            />
                        </Tooltip>
                    );
                }
                return actions;
            },
            showOnDirOnly: false,
        },
    ];

    columns.forEach((column) => {
        if (!column.hasOwnProperty("sorter")) {
            (column as any).sorter = (a: any, b: any) => defaultSorter(a, b, column.dataIndex);
        }
    });

    if (showDirOnly) columns = columns.filter((column) => column.showOnDirOnly);

    if (showColumns) {
        columns = columns.filter((column) => {
            if (typeof column.key === "string") {
                return showColumns.includes(column.key);
            }
            return false;
        });
    }

    return (
        <>
            <DeleteFilesModal
                api={api}
                special={special}
                overlay={overlay}
                files={files as Record[]}
                path={path}
                treeData={treeData}
                setTreeData={setTreeData as any}
                createDirectoryPath={createDirectoryPath}
                setCreateDirectoryPath={setCreateDirectoryPath}
                setRebuildList={setRebuildList}
                addNotification={addNotification}
                addLoadingNotification={addLoadingNotification}
                closeLoadingNotification={closeLoadingNotification}
                findNodeIdByFullPath={findNodeIdByFullPath}
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
            <JsonViewerModal
                open={isJsonViewerModalOpen}
                onClose={() => setIsJsonViewerModalOpen(false)}
                special={special}
                file={jsonViewerFile}
            />
            <TafHeaderModal
                open={isTafHeaderModalOpen}
                onClose={closeTafHeader}
                fileName={currentFile}
                recordTafHeader={tafHeaderRecord}
            />
            <CreateDirectoryModal
                open={isCreateDirectoryModalOpen}
                onClose={() => setIsCreateDirectoryModalOpen(false)}
                createDirectoryPath={createDirectoryPath}
                setCreateDirectoryPath={setCreateDirectoryPath}
                path={path}
                treeData={treeData as any}
                setTreeData={setTreeData as any}
                rootTreeNode={rootTreeNode as any}
                isNodeExpanded={isNodeExpanded}
                findNodeIdByFullPath={findNodeIdByFullPath}
                findNodesByParentId={findNodesByParentId}
                isMoveFileModalOpen={isMoveFileModalOpen}
                isEncodeFilesModalOpen={isEncodeFilesModalOpen}
                setTreeNodeId={setTreeNodeId}
                setRebuildList={setRebuildList}
            />
            <UploadFilesModal
                open={isOpenUploadDragAndDropModal}
                onClose={closeUploadDragAndDropModal}
                path={path}
                special={special}
                uploadFileList={uploadFileList as any}
                setUploadFileList={setUploadFileList as any}
                rebuildList={rebuildList}
                setRebuildList={setRebuildList}
            />
            <MoveFilesModal
                open={isMoveFileModalOpen}
                onClose={closeMoveFileModal}
                api={api}
                special={special}
                overlay={overlay}
                path={path}
                files={files as Record[]}
                currentFile={currentFile || null}
                selectedRowKeys={selectedRowKeys}
                setSelectedRowKeys={setSelectedRowKeys}
                treeNodeId={treeNodeId}
                setTreeNodeId={setTreeNodeId}
                rootTreeNodeId={rootTreeNode.id}
                getPathFromNodeId={getPathFromNodeId}
                folderTreeElement={folderTreeElement}
                setCreateDirectoryPath={setCreateDirectoryPath}
                setFilterFieldAutoFocus={setFilterFieldAutoFocus}
                setIsCreateDirectoryModalOpen={setIsCreateDirectoryModalOpen}
                setRebuildList={setRebuildList}
                addNotification={addNotification}
                addLoadingNotification={addLoadingNotification}
                closeLoadingNotification={closeLoadingNotification}
            />
            <RenameFileModal
                open={isRenameFileModalOpen}
                onClose={closeRenameFileModal}
                api={api}
                special={special}
                overlay={overlay}
                path={path}
                currentFile={currentFile || null}
                setRebuildList={setRebuildList}
                addNotification={addNotification}
                addLoadingNotification={addLoadingNotification}
                closeLoadingNotification={closeLoadingNotification}
            />
            <EncodeFilesModal
                open={isEncodeFilesModalOpen}
                onClose={closeEncodeFilesModal}
                modalKey={encodeFilesModalKey}
                special={special}
                encodeFileList={encodeFileList}
                setEncodeFileList={setEncodeFileList}
                treeNodeId={treeNodeId}
                setTreeNodeId={setTreeNodeId}
                getPathFromNodeId={getPathFromNodeId}
                folderTreeElement={folderTreeElement}
                selectFileModal={selectFileModal}
                showSelectFileModal={showSelectFileModal}
                setCreateDirectoryPath={setCreateDirectoryPath}
                setFilterFieldAutoFocus={setFilterFieldAutoFocus}
                setIsCreateDirectoryModalOpen={setIsCreateDirectoryModalOpen}
                rebuildList={rebuildList}
                setRebuildList={setRebuildList}
                setSelectedRowKeys={setSelectedRowKeys}
            />
            {isHelpModalOpen && (
                <HelpModal isHelpModalOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
            )}
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
                                                    supportedAudioExtensionsForEncoding.some((ext) =>
                                                        item.name.toLowerCase().endsWith(ext)
                                                    )
                                            ).length
                                        ) && special === "library" ? (
                                            <Tooltip
                                                key="encodeFiles"
                                                title={
                                                    t("fileBrowser.encodeFiles.encodeFiles", {
                                                        selectedRowCount: selectedRowKeys.length,
                                                    }) + supportedAudioExtensionsForEncoding.join(", ")
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
                                    onClick={() => {
                                        setIsCreateDirectoryModalOpen(true);
                                    }}
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
            <TonieAudioPlaylistEditor
                open={isTapEditorModalOpen}
                key={tapEditorKey}
                initialValuesJson={jsonData ? JSON.stringify(jsonData, null, 2) : undefined}
                onCreate={onTAPCreate}
                onCancel={() => {
                    setIsTapEditorModalOpen(false);
                }}
            />
        </>
    );
};
