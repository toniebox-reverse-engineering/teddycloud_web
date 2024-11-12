import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Modal,
    Table,
    Tooltip,
    Button,
    Input,
    Breadcrumb,
    InputRef,
    theme,
    TreeSelectProps,
    TreeSelect,
    Typography,
    Alert,
    Upload,
    Space,
    Divider,
    Form,
    Empty,
    Tag,
} from "antd";
import {
    CloseOutlined,
    CloudServerOutlined,
    CloudSyncOutlined,
    CopyOutlined,
    DeleteOutlined,
    EditOutlined,
    FolderAddOutlined,
    FolderOutlined,
    FormOutlined,
    InboxOutlined,
    NodeExpandOutlined,
    PlayCircleOutlined,
    QuestionCircleOutlined,
    TruckOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import { Key, SortOrder } from "antd/es/table/interface";
import { DefaultOptionType } from "antd/es/select";
import { DndContext, DragEndEvent, PointerSensor, useSensor } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

import { useTeddyCloud } from "../../TeddyCloudContext";
import { useAudioContext } from "../audio/AudioContext";
import { humanFileSize } from "../../utils/humanFileSize";
import ConfirmationDialog from "./ConfirmationDialog";
import TonieAudioPlaylistEditor from "../tonies/TonieAudioPlaylistEditor";
import TonieInformationModal from "./TonieInformationModal";

import { DraggableFileObjectListItem } from "./DraggableFileObjectListItem";
import { SelectFileFileBrowser } from "./SelectFileFileBrowser";
import { supportedAudioExtensionsFFMPG } from "../../utils/supportedAudioExtensionsFFMPG";
import { invalidCharactersAsString, isInputValid } from "../../utils/fieldInputValidator";

import { LoadingSpinnerAsOverlay } from "./LoadingSpinner";
import { FileObject, Record, RecordTafHeader } from "../../types/fileBrowserTypes";
import CodeSnippet from "./CodeSnippet";
import HelpModal from "./FileBrowserHelpModal";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";
import { generateUUID } from "../../utils/helpers";

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
    const cursorPositionFilterRef = useRef<number | null>(null);
    const inputCreateDirectoryRef = useRef<InputRef>(null);
    const inputEncodeTafFileNameRef = useRef<InputRef>(null);
    const inputRenameTafFileNameRef = useRef<InputRef>(null);
    const inputFilterRef = useRef<InputRef>(null);

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialPath = queryParams.get("path") || "";
    const [path, setPath] = useState(initialPath);

    const [files, setFiles] = useState<any[]>([]);
    const [rebuildList, setRebuildList] = useState<boolean>(false);
    const [currentFile, setCurrentFile] = useState<string>("");
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const [treeNodeId, setTreeNodeId] = useState<string>(rootTreeNode.id);
    const [treeData, setTreeData] = useState<Omit<DefaultOptionType, "label">[]>([rootTreeNode]);
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

    const [filterText, setFilterText] = useState("");
    const [filterFieldAutoFocus, setFilterFieldAutoFocus] = useState<boolean>(false);

    const [isInformationModalOpen, setIsInformationModalOpen] = useState<boolean>(false);
    const [currentRecord, setCurrentRecord] = useState<Record>();
    const [currentAudioUrl, setCurrentAudioUrl] = useState<string>("");

    const [jsonData, setJsonData] = useState<string>("");
    const [isJsonViewerModalOpen, setIsJsonViewerModalOpen] = useState<boolean>(false);

    const [isTapEditorModalOpen, setIsTapEditorModalOpen] = useState<boolean>(false);
    const [tapEditorKey, setTapEditorKey] = useState<number>(0);

    const [isTafMetaEditorModalOpen, setIsTafMetaEditorModalOpen] = useState<boolean>(false);
    const [tafMetaEditorKey, setTafMetaEditorKey] = useState<number>(0);

    const [currentRecordTafHeader, setCurrentRecordTafHeader] = useState<RecordTafHeader>();
    const [isTafHeaderModalOpen, setIsTafHeaderModalOpen] = useState<boolean>(false);

    const [isUnchangedOrEmpty, setIsUnchangedOrEmpty] = useState<boolean>(true);
    const [hasNewDirectoryInvalidChars, setHasNewDirectoryInvalidChars] = useState<boolean>(false);
    const [hasInvalidChars, setHasInvalidChars] = useState<boolean>(false);
    const [hasError, setHasError] = useState<boolean>(true);

    const [isCreateDirectoryModalOpen, setIsCreateDirectoryModalOpen] = useState<boolean>(false);
    const [createDirectoryInputKey, setcreateDirectoryInputKey] = useState<number>(1);
    const [createDirectoryPath, setCreateDirectoryPath] = useState<string>(initialPath);

    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
    const [isConfirmMultipleDeleteModalOpen, setIsConfirmMultipleDeleteModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);
    const [deletePath, setDeletePath] = useState<string>("");
    const [deleteApiCall, setDeleteApiCall] = useState<string>("");

    const [isMoveFileModalOpen, setIsMoveFileModalOpen] = useState<boolean>(false);
    const [isRenameFileModalOpen, setIsRenameFileModalOpen] = useState<boolean>(false);
    const [renameInputKey, setRenameInputKey] = useState<number>(0);

    const [isOpenUploadDragAndDropModal, setIsOpenUploadDragAndDropModal] = useState<boolean>(false);
    const [uploadFileList, setUploadFileList] = useState<any[]>([]);
    const [uploading, setUploading] = useState<boolean>(false);

    const [isEncodeFilesModalOpen, setIsEncodeFilesModalOpen] = useState<boolean>(false);
    const [encodeFilesModalKey, setEncodeFilesModalKey] = useState<number>(0);
    const [encodeFileList, setEncodeFileList] = useState<FileObject[]>([]);
    const [processing, setProcessing] = useState<boolean>(false);

    const [isSelectFileModalOpen, setIsSelectFileModalOpen] = useState<boolean>(false);
    const [selectFileFileBrowserKey, setSelectFileFileBrowserKey] = useState<number>(0);
    const [selectedNewFilesForEncoding, setSelectedNewFilesForEncoding] = useState<FileObject[]>([]);

    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    const [loading, setLoading] = useState<boolean>(true);
    const parentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const preLoadTreeData = async () => {
            const newPath = getPathFromNodeId(rootTreeNode.id);

            api.apiGetTeddyCloudApiRaw(`/api/fileIndexV2?path=${newPath}&special=library`)
                .then((response) => response.json())
                .then((data) => {
                    var list: any[] = data.files;
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
    }, []);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const initialPath = queryParams.get("path") || "";
        setPath(initialPath);
    }, []);

    useEffect(() => {
        if (overlay) {
            const queryParams = new URLSearchParams(location.search);
            queryParams.set("path", "");
            setPath("");
            const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
            window.history.replaceState(null, "", newUrl);
            setRebuildList((prev) => !prev);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [overlay]);

    useEffect(() => {
        setLoading(true);
        api.apiGetTeddyCloudApiRaw(
            `/api/fileIndexV2?path=${path}&special=${special}` + (overlay ? `&overlay=${overlay}` : "")
        )
            .then((response) => response.json())
            .then((data) => {
                var list: never[] = data.files;
                if (showDirOnly) list = list.filter((file: any) => file.isDir);
                if (filetypeFilter.length > 0)
                    list = list.filter(
                        (file: any) =>
                            file.isDir || filetypeFilter.some((filetypeFilter) => file.name.endsWith(filetypeFilter))
                    );
                setFiles(list);
            })
            .catch((error) =>
                addNotification(
                    NotificationTypeEnum.Error,
                    t("fileBrowser.messages.errorFetchingDirContent"),
                    t("fileBrowser.messages.errorFetchingDirContentDetails", { path: path || "/" }) + error,
                    t("fileBrowser.title")
                )
            )
            .finally(() => {
                setLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, special, showDirOnly, rebuildList]);

    useEffect(() => {
        if (isCreateDirectoryModalOpen) {
            setTimeout(() => {
                if (inputCreateDirectoryRef.current) {
                    inputCreateDirectoryRef.current.focus();
                }
            }, 0);
        }
    }, [isCreateDirectoryModalOpen]);

    useEffect(() => {
        if (cursorPositionFilterRef.current !== null && inputFilterRef.current) {
            inputFilterRef.current.setSelectionRange(cursorPositionFilterRef.current, cursorPositionFilterRef.current);
        }
    }, [filterText]);

    useEffect(() => {
        setCreateDirectoryPath(getPathFromNodeId(treeNodeId));
    }, [treeNodeId]);

    useEffect(() => {
        setCreateDirectoryPath(path);
    }, [path]);

    // breadcrumb functions
    const handleBreadcrumbClick = (dirPath: string) => {
        setLoading(true);
        if (trackUrl) {
            navigate(`?path=${dirPath}`);
        }
        if (path === dirPath) {
            setRebuildList((prev) => !prev);
        }
        setFilterFieldAutoFocus(false);
        setPath(dirPath);
    };

    const generateBreadcrumbs = (path: string, handleBreadcrumbClick: { (dirPath: string): void }) => {
        const pathArray = path.split("/").filter((segment) => segment);

        const breadcrumbItems = [
            {
                title: (
                    <span style={{ cursor: "pointer" }} onClick={() => handleBreadcrumbClick("")}>
                        {t("fileBrowser.root")}
                    </span>
                ),
                key: "/",
            },
        ];

        pathArray.forEach((segment, index) => {
            const segmentPath = `/${pathArray.slice(0, index + 1).join("/")}`;
            breadcrumbItems.push({
                title: (
                    <span style={{ cursor: "pointer" }} onClick={() => handleBreadcrumbClick(segmentPath)}>
                        {segment}
                    </span>
                ),
                key: segmentPath,
            });
        });

        return <Breadcrumb items={breadcrumbItems} />;
    };

    // directory tree
    const onLoadTreeData: TreeSelectProps["loadData"] = ({ id }) =>
        new Promise((resolve, reject) => {
            const newPath = getPathFromNodeId(id);
            api.apiGetTeddyCloudApiRaw(`/api/fileIndexV2?path=${newPath}&special=library`)
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
                                id: id + "." + list.indexOf(entry),
                                pId: id,
                                value: id + "." + list.indexOf(entry),
                                title: entry.name,
                                fullPath: `${newPath}/${entry.name}/`,
                            };
                        });
                    setTreeData(treeData.concat(list));
                    resolve(true);
                })
                .then(() => {
                    reject();
                });
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
        let childNodes: string[] = [];
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
            dropdownStyle={{
                maxHeight: 400,
                overflow: "auto",
            }}
            onChange={setTreeNodeId}
            loadData={onLoadTreeData}
            treeData={treeData}
            treeNodeLabelProp="fullPath"
            placeholder={t("fileBrowser.moveFile.destinationPlaceholder")}
            treeExpandedKeys={expandedKeys}
            onTreeExpand={(keys) => setExpandedKeys(keys)}
            disabled={processing || uploading}
        />
    );

    // information model functions
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

    // Json Viewer functions
    const showJsonViewer = (file: string) => {
        const folder = special === "library" ? "/library" : "/content";
        fetchJsonData(folder + file);
        setFilterFieldAutoFocus(false);
        setCurrentFile(file);
        setIsJsonViewerModalOpen(true);
    };

    const closeJsonViewer = () => {
        setIsJsonViewerModalOpen(false);
    };

    const fetchJsonData = async (path: string) => {
        try {
            const response = await api.apiGetTeddyCloudApiRaw(path);
            const data = await response.json();
            setJsonData(data);
        } catch (error) {
            console.error("Error fetching JSON data:", error);
        }
    };

    const jsonViewerModalFooter = (
        <Button type="primary" onClick={() => setIsJsonViewerModalOpen(false)}>
            {t("tonies.informationModal.ok")}
        </Button>
    );

    const jsonViewerModal = (
        <Modal
            className="json-viewer"
            footer={jsonViewerModalFooter}
            width={800}
            title={"File: " + currentFile}
            open={isJsonViewerModalOpen}
            onCancel={closeJsonViewer}
        >
            {jsonData ? <CodeSnippet language="json" code={JSON.stringify(jsonData, null, 2)} /> : "Loading..."}
        </Modal>
    );

    // taf header viewer functions
    const showTafHeader = (file: string, recordTafHeader: RecordTafHeader) => {
        const currentRecordTafHeader: RecordTafHeader = recordTafHeader;
        const { trackSeconds, ...currentRecordTafHeaderCopy } = currentRecordTafHeader;
        setFilterFieldAutoFocus(false);
        setCurrentRecordTafHeader(currentRecordTafHeaderCopy);
        setCurrentFile(file);
        setIsTafHeaderModalOpen(true);
    };

    const closeTafHeader = () => {
        setIsTafHeaderModalOpen(false);
    };

    const tafHeaderViewerModal = (
        <Modal
            className="taf-header-viewer"
            footer={
                <Button type="primary" onClick={() => setIsTafHeaderModalOpen(false)}>
                    {t("tonies.informationModal.ok")}
                </Button>
            }
            title={t("tonies.tafHeaderOf") + currentFile}
            open={isTafHeaderModalOpen}
            onCancel={closeTafHeader}
            width={700}
        >
            {currentRecordTafHeader ? (
                <CodeSnippet language="json" code={JSON.stringify(currentRecordTafHeader, null, 2)} />
            ) : (
                "Loading..."
            )}
        </Modal>
    );

    // tap functions
    const handleEditTapClick = (file: string) => {
        if (file.includes(".tap")) {
            const folder = special === "library" ? "/library" : "/content";
            fetchJsonData(folder + file);
            setFilterFieldAutoFocus(false);
            setCurrentFile(file);
            setTapEditorKey((prevKey) => prevKey + 1);
            setIsTapEditorModalOpen(true);
        }
    };

    const onTAPCreate = (values: any) => {
        console.log("Received values of form: ", values);
        setIsTapEditorModalOpen(false);
    };

    // taf meta functions - to do
    const handleEditTafMetaDataClick = (path: string, record: Record) => {
        // To Do - to be completed
    };

    // delete functions
    const showDeleteConfirmDialog = (fileName: string, path: string, apiCall: string) => {
        setFilterFieldAutoFocus(false);
        setFileToDelete(fileName);
        setDeletePath(path);
        setDeleteApiCall(apiCall);
        setIsConfirmDeleteModalOpen(true);
    };

    const handleCancelDelete = () => {
        setIsConfirmDeleteModalOpen(false);
        setIsConfirmMultipleDeleteModalOpen(false);
    };

    const handleConfirmDelete = () => {
        deleteFile(deletePath, deleteApiCall);
        setRebuildList((prev) => !prev);
        setIsConfirmDeleteModalOpen(false);
    };

    const handleMultipleDelete = () => {
        setIsConfirmMultipleDeleteModalOpen(true);
    };

    const handleConfirmMultipleDelete = async () => {
        if (selectedRowKeys.length > 0) {
            const key = "deletingFiles";
            addLoadingNotification(key, t("fileBrowser.messages.deleting"), t("fileBrowser.messages.deleting"));
            for (const rowName of selectedRowKeys) {
                const file = (files as Record[]).find((file) => file.name === rowName);
                if (file) {
                    const deletePath = path + "/" + file.name;
                    const deleteApiCall = "?special=" + special + (overlay ? `&overlay=${overlay}` : "");
                    await deleteFile(deletePath, deleteApiCall, true);
                }
            }
            closeLoadingNotification(key);

            setRebuildList((prev) => !prev);
            setIsConfirmMultipleDeleteModalOpen(false);
            setSelectedRowKeys([]);
        } else {
            addNotification(
                NotificationTypeEnum.Warning,
                t("tonies.messages.noRowsSelected"),
                t("tonies.messages.noRowsSelectedForDeletion"),
                t("fileBrowser.title")
            );
        }
    };

    const deleteFile = async (deletePath: string, apiCall: string, flagMultiple?: boolean) => {
        const key = "deletingFiles";
        addLoadingNotification(
            key,
            t("fileBrowser.messages.deleting"),
            t("fileBrowser.messages.deletingDetails", {
                file: deletePath,
            })
        );

        try {
            const deleteUrl = `/api/fileDelete${apiCall}`;
            const response = await api.apiPostTeddyCloudRaw(deleteUrl, deletePath);

            const data = await response.text();

            !flagMultiple && closeLoadingNotification(key);

            if (data === "OK") {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("fileBrowser.messages.deleteSuccessful"),
                    t("fileBrowser.messages.deleteSuccessfulDetails", { file: deletePath }),
                    t("fileBrowser.title")
                );
                const idToRemove = findNodeIdByFullPath(deletePath + "/", treeData);
                if (idToRemove) {
                    setTreeData((prevData) => prevData.filter((node) => node.id !== idToRemove));
                }
                if (createDirectoryPath === deletePath + "/") {
                    setCreateDirectoryPath(path);
                }
            } else {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("fileBrowser.messages.deleteFailed"),
                    `${t("fileBrowser.messages.deleteFailedDetails", { file: deletePath })}: ${data}`,
                    t("fileBrowser.title")
                );
            }
        } catch (error) {
            !flagMultiple && closeLoadingNotification(key);
            addNotification(
                NotificationTypeEnum.Error,
                t("fileBrowser.messages.deleteFailed"),
                `${t("fileBrowser.messages.deleteFailedDetails", { file: deletePath })}: ${error}`,
                t("fileBrowser.title")
            );
        }
    };

    // create directory functions
    const showCreateDirectoryModal = () => {
        setIsUnchangedOrEmpty(true);
        setHasNewDirectoryInvalidChars(false);
        setcreateDirectoryInputKey((prevKey) => prevKey + 1);
        setFilterFieldAutoFocus(false);
        setIsCreateDirectoryModalOpen(true);
    };

    const closeCreateDirectoryModal = () => {
        setFilterFieldAutoFocus(false);
        setIsCreateDirectoryModalOpen(false);
    };

    const handleCreateDirectoryInputChange = (e: { target: { value: React.SetStateAction<string> } }) => {
        const value = e.target.value;
        const inputInvalid = !isInputValid(value.toString());
        setHasNewDirectoryInvalidChars(inputInvalid);
        setIsUnchangedOrEmpty(value === "");
    };

    const createDirectory = () => {
        const inputValueCreateDirectory = inputCreateDirectoryRef.current?.input?.value || "";
        try {
            api.apiPostTeddyCloudRaw(
                `/api/dirCreate?special=library`,
                createDirectoryPath + "/" + inputValueCreateDirectory
            )
                .then((response) => {
                    return response.text();
                })
                .then((text) => {
                    if (text !== "OK") {
                        throw new Error(text);
                    }
                    const parentNodeId = findNodeIdByFullPath(createDirectoryPath + "/", treeData) || rootTreeNode.id;
                    const newNodeId = `${parentNodeId}.${treeData.length}`;
                    const nodeExpanded = isNodeExpanded(parentNodeId);
                    const childNodes = findNodesByParentId(parentNodeId, treeData);
                    if (nodeExpanded || childNodes.length > 0) {
                        const newDir = {
                            id: newNodeId,
                            pId: parentNodeId,
                            value: newNodeId,
                            title: inputValueCreateDirectory,
                            fullPath: createDirectoryPath + "/" + inputValueCreateDirectory + "/",
                        };
                        setTreeData(
                            [...treeData, newDir].sort((a, b) => {
                                return a.title === b.title ? 0 : a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1;
                            })
                        );
                        if (isMoveFileModalOpen || isEncodeFilesModalOpen) {
                            setTreeNodeId(newNodeId);
                        }
                    }
                    addNotification(
                        NotificationTypeEnum.Success,
                        t("fileBrowser.createDirectory.directoryCreated"),
                        t("fileBrowser.createDirectory.directoryCreatedDetails", {
                            directory: createDirectoryPath + "/" + inputValueCreateDirectory,
                        }),
                        t("fileBrowser.title")
                    );
                    setIsCreateDirectoryModalOpen(false);
                    setRebuildList((prev) => !prev);
                    setCreateDirectoryPath(path);
                })
                .catch((error) => {
                    addNotification(
                        NotificationTypeEnum.Error,
                        t("fileBrowser.createDirectory.directoryCreateFailed"),
                        t("fileBrowser.createDirectory.directoryCreateFailedDetails", {
                            directory: createDirectoryPath + "/" + inputValueCreateDirectory,
                        }) + error,
                        t("fileBrowser.title")
                    );
                });
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("fileBrowser.createDirectory.directoryCreateFailed"),
                t("fileBrowser.createDirectory.directoryCreateFailedDetails", {
                    directory: createDirectoryPath + "/" + inputValueCreateDirectory,
                }) + error,
                t("fileBrowser.title")
            );
        }
    };

    const isCreateDirectoryButtonDisabled = isUnchangedOrEmpty || hasNewDirectoryInvalidChars;

    const createDirectoryModal = (
        <Modal
            title={t("fileBrowser.createDirectory.modalTitle")}
            key={"createDirModal-" + createDirectoryInputKey}
            open={isCreateDirectoryModalOpen}
            onCancel={closeCreateDirectoryModal}
            onOk={createDirectory}
            okText={t("fileBrowser.createDirectory.create")}
            cancelText={t("fileBrowser.createDirectory.cancel")}
            zIndex={1050}
            okButtonProps={{ disabled: isCreateDirectoryButtonDisabled }}
        >
            <Typography style={{ marginBottom: 8 }}>
                {t("fileBrowser.createDirectory.parentPath") + " " + createDirectoryPath + "/"}{" "}
            </Typography>
            <Form.Item
                validateStatus={hasNewDirectoryInvalidChars ? "error" : ""}
                help={
                    hasNewDirectoryInvalidChars
                        ? t("inputValidator.invalidCharactersDetected", { invalidChar: invalidCharactersAsString })
                        : ""
                }
                required
            >
                {" "}
                <Input
                    ref={inputCreateDirectoryRef}
                    type="text"
                    placeholder={t("fileBrowser.createDirectory.placeholder")}
                    status={hasNewDirectoryInvalidChars ? "error" : ""}
                    onChange={handleCreateDirectoryInputChange}
                />
            </Form.Item>
        </Modal>
    );

    // move / rename functions
    const moveRenameFile = async (source: string, target: string, moving: boolean, flagMultiple?: boolean) => {
        const body = "source=" + encodeURIComponent(source) + "&target=" + encodeURIComponent(target);
        const key = moving ? "move-file" : "rename-file";
        addLoadingNotification(
            key,
            moving ? t("fileBrowser.messages.moving") : t("fileBrowser.messages.renaming"),
            moving
                ? t("fileBrowser.messages.movingDetails", { file: source })
                : t("fileBrowser.messages.renamingDetails", { file: source })
        );
        try {
            const moveUrl = `/api/fileMove${"?special=" + special + (overlay ? `&overlay=${overlay}` : "")}`;
            const response = await api.apiPostTeddyCloudRaw(moveUrl, body);

            const data = await response.text();
            !flagMultiple && closeLoadingNotification(key);
            if (data === "OK") {
                addNotification(
                    NotificationTypeEnum.Success,
                    moving ? t("fileBrowser.messages.movingSuccessful") : t("fileBrowser.messages.renamingSuccessful"),
                    moving
                        ? t("fileBrowser.messages.movingSuccessfulDetails", { fileSource: source, fileTarget: target })
                        : t("fileBrowser.messages.renamingSuccessfulDetails", {
                              fileSource: source,
                              fileTarget: target,
                          }),
                    t("fileBrowser.title")
                );
            } else {
                throw data;
            }
        } catch (error) {
            !flagMultiple && closeLoadingNotification(key);
            addNotification(
                NotificationTypeEnum.Error,
                moving ? t("fileBrowser.messages.movingFailed") : t("fileBrowser.messages.renamingFailed"),
                (moving
                    ? t("fileBrowser.messages.movingFailedDetails", { fileSource: source, fileTarget: target })
                    : t("fileBrowser.messages.renamingFailedDetails", { fileSource: source, fileTarget: target })) +
                    error,
                t("fileBrowser.title")
            );
        }
    };

    // move files
    const showMoveDialog = (fileName: string) => {
        setTreeNodeId(rootTreeNode.id);
        setCurrentFile(fileName);
        setIsMoveFileModalOpen(true);
    };

    const closeMoveFileModal = () => {
        setIsMoveFileModalOpen(false);
        setCreateDirectoryPath(path);
    };

    const handleSingleMove = async (source: string, target: string) => {
        await moveRenameFile(source + "/" + currentFile, target + "/" + currentFile, true);
        setRebuildList((prev) => !prev);
        setIsMoveFileModalOpen(false);
        setTreeNodeId(rootTreeNode.id);
    };

    const handleMultipleMove = async (source: string, target: string) => {
        if (selectedRowKeys.length > 0) {
            const key = "move-file";
            addLoadingNotification(key, t("fileBrowser.messages.moving"), t("fileBrowser.messages.moving"));
            for (const rowName of selectedRowKeys) {
                const file = (files as Record[]).find((file) => file.name === rowName);
                if (file && !file.isDir) {
                    await moveRenameFile(source + "/" + file.name, target + "/" + file.name, true, true);
                }
            }
            closeLoadingNotification(key);
            setRebuildList((prev) => !prev);
            setIsMoveFileModalOpen(false);
            setSelectedRowKeys([]);
            setTreeNodeId(rootTreeNode.id);
        } else {
            addNotification(
                NotificationTypeEnum.Warning,
                t("tonies.messages.noRowsSelected"),
                t("tonies.messages.noRowsSelectedForMoving"),
                t("fileBrowser.title")
            );
        }
    };

    const isMoveButtonDisabled = !treeNodeId || getPathFromNodeId(treeNodeId) === path;

    const moveFileModal = (
        <Modal
            title={currentFile ? t("fileBrowser.moveFile.modalTitle") : t("fileBrowser.moveFile.modalTitleMultiple")}
            open={isMoveFileModalOpen}
            onCancel={closeMoveFileModal}
            onOk={() =>
                currentFile
                    ? handleSingleMove(path, getPathFromNodeId(treeNodeId))
                    : handleMultipleMove(path, getPathFromNodeId(treeNodeId))
            }
            okText={t("fileBrowser.moveFile.move")}
            cancelText={t("fileBrowser.moveFile.cancel")}
            okButtonProps={{ disabled: isMoveButtonDisabled }}
        >
            <Alert
                message={t("fileBrowser.attention")}
                description={t("fileBrowser.moveFile.attention")}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "space-between" }}>
                <Input
                    type="text"
                    style={{
                        borderTopRightRadius: currentFile ? 0 : "unset",
                        borderBottomRightRadius: currentFile ? 0 : "unset",
                    }}
                    disabled
                    value={path + "/" + (currentFile ? currentFile : "")}
                    placeholder={path + "/" + (currentFile ? currentFile : "")}
                />
                <div>{t("fileBrowser.moveFile.moveTo")}</div>

                <div style={{ display: "flex" }}>
                    {folderTreeElement}
                    <Tooltip title={t("fileBrowser.createDirectory.createDirectory")}>
                        <Button
                            icon={<FolderAddOutlined />}
                            onClick={() => {
                                setCreateDirectoryPath(getPathFromNodeId(treeNodeId));
                                showCreateDirectoryModal();
                            }}
                            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                        ></Button>
                    </Tooltip>
                </div>
            </div>
        </Modal>
    );

    // rename file
    const showRenameDialog = (fileName: string) => {
        setCurrentFile(fileName);
        setIsUnchangedOrEmpty(true);
        setHasInvalidChars(!isInputValid(fileName));
        setRenameInputKey((prevKey) => prevKey + 1);
        setIsRenameFileModalOpen(true);
    };

    const closeRenameFileModal = () => {
        setIsRenameFileModalOpen(false);
    };

    const handleRename = async (source: string, newFileName: string) => {
        try {
            await moveRenameFile(source + "/" + currentFile, source + "/" + newFileName, false);
            setRebuildList((prev) => !prev);
            setIsRenameFileModalOpen(false);
        } catch (error) {}
    };

    const handleRenameNewFilenameInputChange = (e: { target: { value: React.SetStateAction<string> } }) => {
        const value = e.target.value;
        const inputInvalid = !isInputValid(value.toString());
        const errorDetected = !value.toString() || inputInvalid;
        setHasInvalidChars(inputInvalid);
        setHasError(errorDetected);
        setIsUnchangedOrEmpty(!value || value === currentFile);
    };

    const isRenameButtonDisabled = isUnchangedOrEmpty || hasInvalidChars || hasError;

    const renameFileModal = (
        <Modal
            title={t("fileBrowser.renameFile.modalTitle")}
            key={"renameModal-" + renameInputKey}
            open={isRenameFileModalOpen}
            onCancel={closeRenameFileModal}
            onOk={() =>
                handleRename(
                    path,
                    inputRenameTafFileNameRef.current && inputRenameTafFileNameRef.current.input
                        ? inputRenameTafFileNameRef.current.input.value
                        : currentFile
                )
            }
            okText={t("fileBrowser.renameFile.rename")}
            cancelText={t("fileBrowser.renameFile.cancel")}
            okButtonProps={{ disabled: isRenameButtonDisabled }}
        >
            <Alert
                message={t("fileBrowser.attention")}
                description={t("fileBrowser.renameFile.attention")}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "space-between" }}>
                <Form.Item
                    validateStatus={hasInvalidChars ? "error" : ""}
                    help={
                        hasInvalidChars
                            ? t("inputValidator.invalidCharactersDetected", { invalidChar: invalidCharactersAsString })
                            : ""
                    }
                    required
                >
                    <Input
                        ref={inputRenameTafFileNameRef}
                        type="text"
                        defaultValue={currentFile}
                        onChange={handleRenameNewFilenameInputChange}
                        placeholder={currentFile}
                        status={hasInvalidChars ? "error" : ""}
                    />
                </Form.Item>
            </div>
        </Modal>
    );

    // select File Modal for encoding
    const showSelectFileModal = () => {
        setSelectFileFileBrowserKey((prevKey) => prevKey + 1);
        setIsSelectFileModalOpen(true);
    };

    const handleCancelSelectFile = () => {
        setIsSelectFileModalOpen(false);
    };

    const addSelectedFilesForEncoding = () => {
        setEncodeFileList((prevList) => {
            return [...prevList, ...selectedNewFilesForEncoding];
        });
        setIsSelectFileModalOpen(false);
        setSelectedNewFilesForEncoding([]);
    };

    const handleFileSelectChange = (files: any[], path: string, special: string) => {
        const newEncodedFiles: FileObject[] = [];

        if (files.length > 0) {
            for (const selectedFile of files) {
                const file = files.find(
                    (file) =>
                        file.name === selectedFile.name &&
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
        }
        setSelectedNewFilesForEncoding(newEncodedFiles);
    };

    const selectModalFooter = (
        <div
            style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                padding: "16px 0",
                margin: "-24px -24px -12px -24px",
                background: token.colorBgElevated,
            }}
        >
            <Button onClick={handleCancelSelectFile}>{t("tonies.selectFileModal.cancel")}</Button>
            <Button type="primary" onClick={addSelectedFilesForEncoding}>
                {t("tonies.selectFileModal.ok")}
            </Button>
        </div>
    );

    const selectFileModal = (
        <Modal
            className="sticky-footer"
            title={t("tonies.selectFileModal.selectFile")}
            open={isSelectFileModalOpen}
            onOk={addSelectedFilesForEncoding}
            onCancel={handleCancelSelectFile}
            width="auto"
            footer={selectModalFooter}
        >
            <SelectFileFileBrowser
                key={selectFileFileBrowserKey}
                special="library"
                maxSelectedRows={MAX_FILES - encodeFileList.length - 1}
                trackUrl={false}
                filetypeFilter={supportedAudioExtensionsForEncoding}
                onFileSelectChange={handleFileSelectChange}
            />
        </Modal>
    );

    // encode files
    const showFileEncodeModal = () => {
        setIsUnchangedOrEmpty(true);
        setHasInvalidChars(false);
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

    const encodeFiles = async () => {
        setProcessing(true);
        const newTafFilename = inputEncodeTafFileNameRef?.current?.input?.value;
        const key = "encoding-" + newTafFilename;
        addLoadingNotification(
            key,
            t("fileBrowser.encodeFiles.encoding"),
            t("fileBrowser.encodeFiles.encodingInProgress")
        );
        const target = getPathFromNodeId(treeNodeId) + "/" + newTafFilename + ".taf";
        const body =
            encodeFileList.map((file) => `source=${encodeURIComponent(file.path + "/" + file.name)}`).join("&") +
            `&target=${encodeURIComponent(target)}`;
        try {
            const response = await api.apiPostTeddyCloudRaw(`/api/fileEncode?special=${special}`, body);
            if (response.ok) {
                closeLoadingNotification(key);
                addNotification(
                    NotificationTypeEnum.Success,
                    t("fileBrowser.encodeFiles.encodingSuccessful"),
                    t("fileBrowser.encodeFiles.encodingSuccessfulDetails", { file: target }),
                    t("fileBrowser.title")
                );
                setIsEncodeFilesModalOpen(false);
                setTreeNodeId("1");
                setSelectedRowKeys([]);
                setRebuildList(!rebuildList);
            } else {
                closeLoadingNotification(key);
                addNotification(
                    NotificationTypeEnum.Error,
                    t("fileBrowser.encodeFiles.encodingFailed"),
                    t("fileBrowser.encodeFiles.encodingFailedDetails", { file: target }).replace(": ", ""),
                    t("fileBrowser.title")
                );
            }
        } catch (err) {
            closeLoadingNotification(key);
            addNotification(
                NotificationTypeEnum.Error,
                t("fileBrowser.encodeFiles.encodingFailed"),
                t("fileBrowser.encodeFiles.encodingFailedDetails", { file: target }) + err,
                t("fileBrowser.title")
            );
        }
        setProcessing(false);
    };

    const sensor = useSensor(PointerSensor, {
        activationConstraint: { distance: 10 },
    });

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (active.id !== over?.id) {
            setEncodeFileList((prev) => {
                const activeIndex = prev.findIndex((i) => i.uid === active.id);
                const overIndex = prev.findIndex((i) => i.uid === over?.id);
                return arrayMove(prev, activeIndex, overIndex);
            });
        }
    };

    const onRemove = (file: FileObject) => {
        const index = encodeFileList.indexOf(file);
        const newFileList = encodeFileList.slice();
        newFileList.splice(index, 1);
        setEncodeFileList(newFileList);
    };

    const sortFileListAlphabetically = () => {
        setEncodeFileList((prev) => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
    };

    const handleFileNameInputChange = (e: { target: { value: React.SetStateAction<string> } }) => {
        const value = e.target.value;
        const inputInvalid = !isInputValid(value.toString());
        const errorDetected = (encodeFileList.length > 0 && !value.toString()) || inputInvalid;
        setHasInvalidChars(inputInvalid);
        setHasError(errorDetected);
        setIsUnchangedOrEmpty(value === "");
    };

    const encodeFilesModal = (
        <Modal
            title={t("fileBrowser.encodeFiles.modalTitle")}
            key={"encodeModal-" + encodeFilesModalKey}
            open={isEncodeFilesModalOpen}
            onCancel={closeEncodeFilesModal}
            onOk={encodeFiles}
            okText={t("fileBrowser.encodeFiles.encode")}
            cancelText={t("fileBrowser.encodeFiles.cancel")}
            zIndex={1000}
            width="auto"
            okButtonProps={{ disabled: processing || hasError || isUnchangedOrEmpty || encodeFileList.length === 0 }}
        >
            {selectFileModal}
            <DndContext sensors={[sensor]} onDragEnd={onDragEnd}>
                <SortableContext
                    items={encodeFileList.map((i) => i.uid)}
                    strategy={verticalListSortingStrategy}
                    disabled={processing}
                >
                    <Button disabled={processing} onClick={showSelectFileModal}>
                        {t("fileBrowser.encodeFiles.addFiles")}
                    </Button>
                    {encodeFileList.map((file) => (
                        <DraggableFileObjectListItem
                            key={file.uid}
                            originNode={<div>{file.name}</div>}
                            onRemove={onRemove}
                            disabled={processing}
                            fileObjectList={encodeFileList}
                            file={file}
                        />
                    ))}
                </SortableContext>
            </DndContext>
            <Space direction="vertical" style={{ display: "flex" }}>
                {encodeFileList.length > 0 ? (
                    <>
                        <Space
                            direction="horizontal"
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "flex-start",
                            }}
                        >
                            <Button type="default" disabled={processing} onClick={sortFileListAlphabetically}>
                                {t("tonies.encoder.sortAlphabetically")}
                            </Button>
                        </Space>
                        <Divider />
                        <div style={{ width: "100%" }} className="encoder">
                            <Space direction="vertical" style={{ width: "100%" }}>
                                <Space.Compact
                                    direction="horizontal"
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "flex-end",
                                        justifyContent: "flex-end",
                                    }}
                                >
                                    <Input
                                        type="text"
                                        style={{
                                            maxWidth: 180,
                                            borderTopRightRadius: 0,
                                            borderBottomRightRadius: 0,
                                        }}
                                        disabled
                                        value={t("tonies.encoder.saveAs")}
                                    ></Input>
                                    {folderTreeElement}
                                    <Tooltip title={t("fileBrowser.createDirectory.createDirectory")}>
                                        <Button
                                            disabled={processing}
                                            icon={<FolderAddOutlined />}
                                            onClick={() => {
                                                setCreateDirectoryPath(getPathFromNodeId(treeNodeId));
                                                showCreateDirectoryModal();
                                            }}
                                            style={{ borderRadius: 0 }}
                                        ></Button>
                                    </Tooltip>

                                    <Input
                                        ref={inputEncodeTafFileNameRef}
                                        addonAfter=".taf"
                                        required
                                        status={hasError ? "error" : ""}
                                        onChange={handleFileNameInputChange}
                                        disabled={processing}
                                    />
                                </Space.Compact>
                                {hasInvalidChars ? (
                                    <div style={{ textAlign: "end", color: token.colorErrorText }}>
                                        {t("inputValidator.invalidCharactersDetected", {
                                            invalidChar: invalidCharactersAsString,
                                        })}
                                    </div>
                                ) : (
                                    ""
                                )}
                            </Space>
                        </div>
                    </>
                ) : (
                    <></>
                )}
            </Space>
        </Modal>
    );

    // upload files functionality
    const showUploadFilesDragAndDropModal = () => {
        setIsOpenUploadDragAndDropModal(true);
    };

    const closeUploadDragAndDropModal = () => {
        setUploadFileList([]);
        setIsOpenUploadDragAndDropModal(false);
    };

    const uploadDraggerProps = {
        name: "file",
        multiple: true,
        fileList: uploadFileList,
        customRequest: async (options: any) => {
            const { onSuccess, onError, file } = options;
            onSuccess("Ok");
        },
        onChange(info: any) {
            const { status, fileList } = info;
            if (status !== "uploading") {
                setUploadFileList(fileList);
                console.log(info.file, info.fileList);
            }
        },
        onDrop(e: any) {
            console.log("Dropped files", e.dataTransfer.files);
        },
        onRemove: (file: any) => {
            setUploadFileList((prevFileList) => prevFileList.filter((f) => f.uid !== file.uid));
        },
    };

    const handleUploadToTeddycloud = async (files: any[]) => {
        if (!files.length) {
            return;
        }
        setUploading(true);
        let failure = false;
        const key = "uploading-" + files.length + "-" + new Date();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            addLoadingNotification(
                key,
                t("fileBrowser.upload.uploading"),
                t("fileBrowser.upload.uploadInProgress", { file: file.name })
            );
            const formData = new FormData();
            formData.append(file.name, file.originFileObj);
            try {
                const response = await api.apiPostTeddyCloudFormDataRaw(
                    `/api/fileUpload?path=${encodeURIComponent(path)}&special=${special}`,
                    formData
                );
                if (response.ok) {
                    setUploadFileList((prevList) => prevList.filter((f) => f.uid !== file.uid));
                    addNotification(
                        NotificationTypeEnum.Success,
                        t("fileBrowser.upload.uploadedFile"),
                        t("fileBrowser.upload.uploadSuccessfulForFile", { file: file.name }),
                        t("fileBrowser.title")
                    );
                } else {
                    failure = true;
                    setUploadFileList((prevList) =>
                        prevList.map((f) => (f.uid === file.uid ? { ...f, status: "Failed" } : f))
                    );
                    addNotification(
                        NotificationTypeEnum.Error,
                        t("fileBrowser.upload.uploadedFileFailed"),
                        t("fileBrowser.upload.uploadFailedForFile", { file: file.name }),
                        t("fileBrowser.title")
                    );
                }
            } catch (err) {
                failure = true;
                addNotification(
                    NotificationTypeEnum.Error,
                    t("fileBrowser.upload.uploadedFileFailed"),
                    t("fileBrowser.upload.uploadFailedForFile", { file: file.name }),
                    t("fileBrowser.title")
                );
                setUploadFileList((prevList) =>
                    prevList.map((f) => (f.uid === file.uid ? { ...f, status: "Failed" } : f))
                );
            }
        }

        closeLoadingNotification(key);
        if (failure) {
            setRebuildList(!rebuildList);
            addNotification(
                NotificationTypeEnum.Error,
                t("fileBrowser.upload.uploadFailed"),
                t("fileBrowser.upload.uploadFailed"),
                t("fileBrowser.title")
            );
        } else {
            setRebuildList(!rebuildList);
            setIsOpenUploadDragAndDropModal(false);
            addNotification(
                NotificationTypeEnum.Success,
                t("fileBrowser.upload.uploadSuccessful"),
                t("fileBrowser.upload.uploadSuccessfulDetails"),
                t("fileBrowser.title")
            );
        }
        setUploading(false);
    };

    const uploadFileModalFooter = (
        <div
            style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                padding: "16px 0",
                margin: "-24px -24px -12px -24px",
                background: token.colorBgElevated,
            }}
        >
            <Button onClick={closeUploadDragAndDropModal}>{t("fileBrowser.upload.cancel")}</Button>
            <Button
                type="primary"
                onClick={() => handleUploadToTeddycloud(uploadFileList)}
                loading={uploading}
                disabled={uploadFileList.length === 0 || uploading}
            >
                {uploading ? t("fileBrowser.upload.uploading") : t("fileBrowser.upload.upload")}
            </Button>
        </div>
    );

    const uploadFileModal = (
        <Modal
            className="sticky-footer"
            title={t("fileBrowser.upload.modalTitle")}
            open={isOpenUploadDragAndDropModal}
            onCancel={closeUploadDragAndDropModal}
            footer={uploadFileModalFooter}
        >
            <div style={{ width: "100%", marginBottom: 8 }}>
                <Upload.Dragger {...uploadDraggerProps} style={{ width: "100%", marginBottom: 8 }}>
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">{t("fileBrowser.upload.uploadText")}</p>
                    <p className="ant-upload-hint">{t("fileBrowser.upload.uploadHint")}</p>
                </Upload.Dragger>
            </div>
        </Modal>
    );

    // migrate content functions
    const migrateContent2Lib = (ruid: string, libroot: boolean, overlay?: string) => {
        const key = "migrating-" + ruid;

        try {
            addLoadingNotification(
                key,
                t("fileBrowser.messages.migrationOngoing"),
                t("fileBrowser.messages.migrationOngoingDetails", { ruid: ruid })
            );
            const body = `ruid=${ruid}&libroot=${libroot}`;

            api.apiPostTeddyCloudRaw("/api/migrateContent2Lib", body, overlay)
                .then((response) => response.text())
                .then((data) => {
                    closeLoadingNotification(key);
                    if (data === "OK") {
                        addNotification(
                            NotificationTypeEnum.Success,
                            t("fileBrowser.messages.migrationSuccessful"),
                            t("fileBrowser.messages.migrationSuccessfulDetails", { ruid: ruid }),
                            t("fileBrowser.title")
                        );
                        setRebuildList((prev) => !prev);
                    } else {
                        addNotification(
                            NotificationTypeEnum.Success,
                            t("fileBrowser.messages.migrationFailed"),
                            t("fileBrowser.messages.migrationFailedDetails", { ruid: ruid }).replace(": ", ""),
                            t("fileBrowser.title")
                        );
                    }
                })
                .catch((error) => {
                    closeLoadingNotification(key);
                    addNotification(
                        NotificationTypeEnum.Success,
                        t("fileBrowser.messages.migrationFailed"),
                        t("fileBrowser.messages.migrationFailedDetails", { ruid: ruid }) + error,
                        t("fileBrowser.title")
                    );
                });
        } catch (error) {
            closeLoadingNotification(key);
            addNotification(
                NotificationTypeEnum.Success,
                t("fileBrowser.messages.migrationFailed"),
                t("fileBrowser.messages.migrationFailedDetails", { ruid: ruid }) + error,
                t("fileBrowser.title")
            );
        }
    };

    // filter functions
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterText(e.target.value);
        cursorPositionFilterRef.current = e.target.selectionStart;
        setFilterFieldAutoFocus(true);
    };

    const clearFilterField = () => {
        setFilterText("");
        cursorPositionFilterRef.current = 0;
    };

    const handleFilterFieldInputFocus = () => {
        setFilterFieldAutoFocus(true);
    };

    const handleFilterFieldInputBlur = () => {
        setFilterFieldAutoFocus(false);
    };

    // table functions
    const rowClassName = (record: any) => {
        return selectedRowKeys.includes(record.key) ? "highlight-row" : "";
    };

    const onSelectChange = (newSelectedRowKeys: Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const handleDirClick = (dirPath: string) => {
        setLoading(true);
        const newPath = dirPath === ".." ? path.split("/").slice(0, -1).join("/") : `${path}/${dirPath}`;
        if (trackUrl) {
            navigate(`?path=${newPath}`);
        }
        setFilterFieldAutoFocus(false);
        setSelectedRowKeys([]);
        setPath(newPath);
    };

    const getFieldValue = (obj: any, keys: string[]) => {
        return keys.reduce((acc, currentKey) => {
            if (acc && acc[currentKey] !== undefined) {
                return acc[currentKey];
            }
            return undefined;
        }, obj);
    };

    const defaultSorter = (a: any, b: any, dataIndex: string | string[]) => {
        // Get the values of the fields
        const fieldA = Array.isArray(dataIndex) ? getFieldValue(a, dataIndex) : a[dataIndex];
        const fieldB = Array.isArray(dataIndex) ? getFieldValue(b, dataIndex) : b[dataIndex];

        if (fieldA === undefined && fieldB === undefined) {
            return 0; // Both values are undefined, consider them equal
        } else if (fieldA === undefined) {
            return 1; // Field A is undefined, consider it greater than B
        } else if (fieldB === undefined) {
            return -1; // Field B is undefined, consider it greater than A
        }

        if (typeof fieldA === "string" && typeof fieldB === "string") {
            return fieldA.localeCompare(fieldB);
        } else if (typeof fieldA === "number" && typeof fieldB === "number") {
            return fieldA - fieldB;
        } else {
            console.log("Unsupported types for sorting:", a, b);
            console.log("Unsupported types for sorting field:", dataIndex, fieldA, fieldB);
            return 0;
        }
    };

    const dirNameSorter = (a: any, b: any) => {
        if (a.isDir === b.isDir) {
            return defaultSorter(a, b, "name");
        }
        return a.isDir ? -1 : 1;
    };

    const withinTafBoundaries = (numberOfFiles: number) => {
        return numberOfFiles > 0 && numberOfFiles <= MAX_FILES;
    };

    var columns: any[] = [
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
                let actions = [];

                // taf file
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
                                                path +
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
                                                encodeURI("/content" + path + "/" + record.name) +
                                                "?ogg=true&special=" +
                                                special +
                                                (overlay ? `&overlay=${overlay}` : ""),
                                        }
                                    )
                                }
                            />
                        </Tooltip>
                    );
                    // migration to lib possible
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
                                        encodeURI(
                                            import.meta.env.VITE_APP_TEDDYCLOUD_API_URL +
                                                "/content" +
                                                path +
                                                "/" +
                                                record.name
                                        ) +
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
                // tap file
                if (isTapList && record.name.includes(".tap")) {
                    actions.push(
                        <Tooltip key={`action-edit-${record.name}`} title={t("fileBrowser.tap.edit")}>
                            <EditOutlined
                                style={{ margin: "4px 8px 4px 0", padding: 4 }}
                                onClick={() => handleEditTapClick(path + "/" + record.name)}
                            />
                        </Tooltip>
                    );
                    actions.push(
                        <Tooltip key={`action-copy-${record.name}`} title={t("fileBrowser.tap.copy")}>
                            <CopyOutlined style={{ margin: "4px 8px 4px 0", padding: 4 }} />
                        </Tooltip>
                    );
                }
                if (record.tafHeader) {
                    actions.push(
                        <Tooltip key={`action-edit-${record.name}`} title={t("fileBrowser.tafMeta.edit")}>
                            <EditOutlined
                                style={{ margin: "4px 8px 4px 0", padding: 4 }}
                                onClick={() => handleEditTafMetaDataClick(path, record)}
                            />
                        </Tooltip>
                    );
                }
                // only in library move and rename
                if (special === "library") {
                    // include the rename icon on files
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
                    // include the move icon on files
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
                // include the delete action
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
                // Check if the column's dataIndex matches any of the specified dataIndex values
                return showColumns.includes(column.key);
            }
            return false;
        });
    }

    const noData = loading ? "" : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;

    return (
        <>
            <ConfirmationDialog
                title={t("fileBrowser.confirmDeleteModal")}
                open={isConfirmDeleteModalOpen}
                okText={t("fileBrowser.delete")}
                cancelText={t("fileBrowser.cancel")}
                content={t("fileBrowser.confirmDeleteDialog", { fileToDelete: fileToDelete })}
                handleOk={handleConfirmDelete}
                handleCancel={handleCancelDelete}
            />
            <ConfirmationDialog
                title={t("fileBrowser.confirmDeleteModal")}
                open={isConfirmMultipleDeleteModalOpen}
                okText={t("fileBrowser.delete")}
                cancelText={t("fileBrowser.cancel")}
                content={t("fileBrowser.confirmMultipleDeleteDialog")}
                handleOk={handleConfirmMultipleDelete}
                handleCancel={handleCancelDelete}
            />
            {jsonViewerModal}
            {tafHeaderViewerModal}
            {createDirectoryModal}
            {uploadFileModal}
            {moveFileModal}
            {renameFileModal}
            {encodeFilesModal}
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
                <div style={{ display: "flex", flexDirection: "row", marginBottom: 8 }}>
                    <div style={{ lineHeight: 1.5, marginRight: 16 }}>{t("tonies.currentPath")}</div>
                    {generateBreadcrumbs(path, handleBreadcrumbClick)}
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
                                            <Tooltip key="moveMultiple" title={t("fileBrowser.moveMultiple")}>
                                                <Button
                                                    size="small"
                                                    icon={<NodeExpandOutlined />}
                                                    onClick={() => showMoveDialog("")}
                                                    disabled={selectedRowKeys.length === 0}
                                                >
                                                    <div className="showBigDevicesOnly showMediumDevicesOnly">
                                                        {" "}
                                                        {t("fileBrowser.move")}
                                                    </div>
                                                </Button>
                                            </Tooltip>
                                        ) : (
                                            ""
                                        )}
                                        <Tooltip key="deleteMultiple" title={t("fileBrowser.deleteMultiple")}>
                                            <Button
                                                size="small"
                                                icon={<DeleteOutlined />}
                                                onClick={handleMultipleDelete}
                                                disabled={selectedRowKeys.length === 0}
                                            >
                                                <div className="showBigDevicesOnly showMediumDevicesOnly">
                                                    {" "}
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
                                                    t("fileBrowser.encodeFiles.encodeFiles") +
                                                    supportedAudioExtensionsForEncoding.join(", ")
                                                }
                                            >
                                                <Button
                                                    size="small"
                                                    icon={<CloudSyncOutlined />}
                                                    onClick={showFileEncodeModal}
                                                    disabled={selectedRowKeys.length === 0}
                                                >
                                                    <div className="showBigDevicesOnly showMediumDevicesOnly">
                                                        {" "}
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
                                <Button icon={<FolderAddOutlined />} size="small" onClick={showCreateDirectoryModal}>
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
                        selectedRowKeys,
                        onChange: onSelectChange,
                        getCheckboxProps: (record: Record) => ({
                            disabled: record.name === "..", // Disable checkbox for rows with name '..'
                        }),
                        onSelectAll: (selected: boolean, selectedRows: any[]) => {
                            const selectedKeys = selected
                                ? selectedRows.filter((row) => row.name !== "..").map((row) => row.name)
                                : [];
                            setSelectedRowKeys(selectedKeys);
                        },
                    }}
                    components={{
                        // Override the header to include custom search row
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
                                                    ref={inputFilterRef} // Assign ref to input element
                                                    style={{ width: "100%" }}
                                                    autoFocus={filterFieldAutoFocus}
                                                    addonAfter={
                                                        <CloseOutlined
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
