import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, type InputRef, type TreeSelectProps, type UploadProps } from "antd";
import type { DragEndEvent } from "@dnd-kit/core";
import { PointerSensor, useSensor } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { MAX_FILES } from "../../../../constants";
import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { MyUploadFile, upload as encoderUpload } from "../../../../utils/audio/audioEncoder";
import {
    isInputValid,
    INVALID_NAME_CHARS_DISPLAY as invalidCharactersAsString,
} from "../../../../utils/validation/fieldInputValidator";
import { ffmpegSupportedExtensions } from "../../../../utils/files/ffmpegSupportedExtensions";
import { createQueryString } from "../../../../utils/browser/queryParams";
import { loadWasmEncoder, isWasmEncoderAvailable, WasmTafEncoder } from "../../../../utils/audio/wasmEncoder";

const api = new TeddyCloudApi(defaultAPIConfig());

export type EncoderTreeNode = {
    id: string;
    pId: string;
    value: string;
    title: string;
    fullPath: string;
};

const rootTreeNode: EncoderTreeNode = {
    id: "1",
    pId: "-1",
    value: "1",
    title: "/",
    fullPath: "/",
};

export const useEncoder = () => {
    const { t } = useTranslation();
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();

    const [debugPCMObjects, setDebugPCMObjects] = useState(false);
    const [useFrontendEncoding, setUseFrontendEncoding] = useState(false);
    const [useFrontendEncodingSetting, setUseFrontendEncodingSetting] = useState(false);
    const [wasmLoaded, setWasmLoaded] = useState(false);
    const [bitrate, setBitrate] = useState(96);

    const [fileList, setFileList] = useState<MyUploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [tafFilename, setTafFilename] = useState("");

    const [treeNodeId, setTreeNodeId] = useState<string>(rootTreeNode.id);
    const [treeData, setTreeData] = useState<EncoderTreeNode[]>([rootTreeNode]);

    const [isCreateDirectoryModalOpen, setCreateDirectoryModalOpen] = useState(false);
    const [createDirectoryPath, setCreateDirectoryPath] = useState<string>("");
    const [rebuildList, setRebuildList] = useState<boolean>(false);

    const [hasInvalidChars, setHasInvalidChars] = useState(false);

    const inputRef = useRef<InputRef>(null);

    // -------------------------------------------------
    // Initial Settings + Tree preload
    // -------------------------------------------------

    useEffect(() => {
        const fetchDebugPCM = async () => {
            try {
                const response = await api.apiGetTeddyCloudSettingRaw("debug.web.pcm_encode_console_url");
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setDebugPCMObjects(data.toString() === "true");
            } catch (error) {
                console.error("Error fetching debug.web.pcm_encode_console_url: ", error);
            }
        };

        const fetchUseFrontendSetting = async () => {
            try {
                const response = await api.apiGetTeddyCloudSettingRaw("encode.use_frontend");
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                const useFrontend = data.toString() === "true";
                setUseFrontendEncodingSetting(useFrontend);
                setUseFrontendEncoding(useFrontend);

                if (useFrontend) {
                    loadWasmEncoder()
                        .then(() => {
                            setWasmLoaded(true);
                            console.log("WASM encoder pre-loaded");
                        })
                        .catch((error) => {
                            console.error("Failed to pre-load WASM encoder:", error);
                        });
                }
            } catch (error) {
                console.error("Error fetching encode.use_frontend: ", error);
            }
        };

        const fetchBitrateSetting = async () => {
            try {
                const response = await api.apiGetTeddyCloudSettingRaw("encode.bitrate");
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                const bitrateSetting = parseInt(data.toString(), 10);
                if (!isNaN(bitrateSetting)) setBitrate(bitrateSetting);
            } catch (error) {
                console.error("Error fetching encode.bitrate: ", error);
            }
        };

        const preLoadTreeData = async () => {
            const path = pathFromNodeId(rootTreeNode.id);
            api.apiGetTeddyCloudApiRaw(`/api/fileIndexV2?path=${encodeURIComponent(path)}&special=library`)
                .then((response) => response.json())
                .then((data) => {
                    let list: any[] = data.files;
                    list = list
                        .filter((entry) => entry.isDir && entry.name !== "..")
                        .sort((a, b) => (a.name === b.name ? 0 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1))
                        .map((entry, idx) => {
                            const parentPath = path || "";
                            const fullPath = (parentPath === "" ? "" : parentPath) + "/" + entry.name + "/"; // z.B. /dir1/dir2/
                            return {
                                id: rootTreeNode.id + "." + idx,
                                pId: rootTreeNode.id,
                                value: rootTreeNode.id + "." + idx,
                                title: entry.name,
                                fullPath,
                            } as EncoderTreeNode;
                        });
                    setTreeData((prev) => prev.concat(list));
                })
                .catch((error) => console.error("Error preloading tree data:", error));
        };

        fetchDebugPCM();
        fetchUseFrontendSetting();
        fetchBitrateSetting();
        preLoadTreeData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Autofocus fürs eigene kleine Input-Feld, falls du es nutzen willst
    useEffect(() => {
        if (isCreateDirectoryModalOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        }
    }, [isCreateDirectoryModalOpen]);

    // -------------------------------------------------
    // Tree / Pfade + Helper-Funktionen fürs Modal
    // -------------------------------------------------

    const pathFromNodeId = (nodeId: string): string => {
        const node = treeData.find((n) => n.value === nodeId);
        if (!node) return "";
        if (node.fullPath === "/") return "";
        return node.fullPath.replace(/\/$/, ""); // "/foo/bar/" -> "/foo/bar"
    };

    const isNodeExpanded = (nodeId: string) => {
        // Encoder nutzt keine expand/collapse-Logik → einfach immer true
        return true;
    };

    const findNodeIdByFullPath = (fullPath: string, nodes: EncoderTreeNode[]): string | null => {
        const node = nodes.find((n) => n.fullPath === fullPath);
        return node ? node.id : null;
    };

    const findNodesByParentId = (parentId: string, nodes: EncoderTreeNode[]): string[] => {
        return nodes.filter((n) => n.pId === parentId).map((n) => n.id);
    };

    const onLoadTreeData: TreeSelectProps["loadData"] = ({ id }) =>
        new Promise((resolve) => {
            const path = pathFromNodeId(id);
            api.apiGetTeddyCloudApiRaw(`/api/fileIndexV2?path=${encodeURIComponent(path)}&special=library`)
                .then((response) => response.json())
                .then((data) => {
                    let list: any[] = data.files;
                    list = list
                        .filter((entry) => entry.isDir && entry.name !== "..")
                        .sort((a, b) => (a.name === b.name ? 0 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1))
                        .map((entry, idx) => {
                            const parentPath = path || "";
                            const fullPath = (parentPath === "" ? "" : parentPath) + "/" + entry.name + "/"; // z.B. /dir1/dir2/
                            return {
                                id: id + "." + idx,
                                pId: id,
                                value: id + "." + idx,
                                title: entry.name,
                                fullPath,
                            } as EncoderTreeNode;
                        });

                    setTreeData((prev) => prev.concat(list));
                    resolve(true);
                })
                .catch((error) => {
                    console.error("Error loading tree data:", error);
                    resolve(false);
                });
        });

    // -------------------------------------------------
    // DnD / Upload-Liste
    // -------------------------------------------------

    const sensor = useSensor(PointerSensor, {
        activationConstraint: { distance: 10 },
    });

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (active.id !== over?.id) {
            setFileList((prev) => {
                const activeIndex = prev.findIndex((i) => i.uid === active.id);
                const overIndex = prev.findIndex((i) => i.uid === over?.id);
                if (activeIndex === -1 || overIndex === -1) return prev;
                return arrayMove(prev, activeIndex, overIndex);
            });
        }
    };

    const onChangeUpload: UploadProps["onChange"] = ({ fileList: newFileList }) => {
        if (newFileList.length > MAX_FILES) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.encoder.tooManyFilesError"),
                t("tonies.encoder.maxFiles", { maxFiles: MAX_FILES }),
                t("tonies.title")
            );
        }

        const updatedFileList = newFileList.slice(0, MAX_FILES) as MyUploadFile[];

        if (updatedFileList.length === 1 && tafFilename === "") {
            const singleFile = updatedFileList[0];
            const fileNameWithoutExtension = singleFile.name.replace(/\.[^/.]+$/, "");
            setTafFilename(fileNameWithoutExtension);
        }

        setFileList(updatedFileList);
    };

    const onRemoveUpload = (file: MyUploadFile) => {
        setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
    };

    const uploadProps: UploadProps = {
        listType: "picture",
        multiple: true,
        accept: ffmpegSupportedExtensions.join(","),
        beforeUpload: (file) => {
            const isAccepted = ffmpegSupportedExtensions.some((ext) =>
                file.name.toLowerCase().endsWith(ext.toLowerCase())
            );

            if (!isAccepted) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("tonies.encoder.unsupportedFileType"),
                    t("tonies.encoder.unsupportedFileTypeDetails", { file: file.name }),
                    t("tonies.title")
                );
                return Upload.LIST_IGNORE;
            }

            const myFile: MyUploadFile = file;
            myFile.file = file;
            setFileList((prev) => [...prev, myFile]);
            return false;
        },
        fileList,
        onChange: onChangeUpload,
    };

    const sortFileListAlphabetically = () => {
        setFileList((prev) => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
    };

    const clearFileList = () => {
        setFileList([]);
    };

    // -------------------------------------------------
    // CreateDirectoryModal-Handling (nur Open/Close + Path)
    // -------------------------------------------------

    const openCreateDirectoryModal = () => {
        const currentPath = pathFromNodeId(treeNodeId); // ohne / am Ende
        setCreateDirectoryPath(currentPath);
        setCreateDirectoryModalOpen(true);
    };

    const closeCreateDirectoryModal = () => {
        setCreateDirectoryModalOpen(false);
    };

    // -------------------------------------------------
    // Filename input
    // -------------------------------------------------

    const handleFileNameInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setHasInvalidChars(!isInputValid(value));
        setTafFilename(value);
    };

    // -------------------------------------------------
    // Server-side Upload
    // -------------------------------------------------

    const handleUpload = async () => {
        setUploading(true);
        const formData = new FormData();
        const key = "encoding-" + tafFilename + ".taf";

        addLoadingNotification(key, t("tonies.encoder.uploading"), t("tonies.encoder.uploading"));

        for (const file of fileList) {
            addLoadingNotification(
                key,
                t("tonies.encoder.uploading"),
                t("tonies.encoder.uploadingDetails", { file: file.name })
            );
            try {
                await new Promise<void>((resolve, reject) =>
                    (encoderUpload as any)(resolve, reject, formData, fileList, file, debugPCMObjects)
                );
            } catch (error) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("tonies.encoder.processingError"),
                    t("tonies.encoder.errorFileProcessing") + error,
                    t("tonies.title")
                );
                closeLoadingNotification(key);
                setUploading(false);
                return;
            }
        }

        const currentUnixTime = Math.floor(Date.now() / 1000);
        const queryParams = {
            name: tafFilename + ".taf",
            audioId: currentUnixTime - 0x50000000,
            path: pathFromNodeId(treeNodeId),
            special: "library",
        };

        setProcessing(true);
        const queryString = createQueryString(queryParams);

        try {
            addLoadingNotification(
                key,
                t("tonies.encoder.processing"),
                t("tonies.encoder.processingDetails", { file: tafFilename + ".taf" })
            );
            const response = await api.apiPostTeddyCloudFormDataRaw(`/api/pcmUpload?${queryString}`, formData);
            closeLoadingNotification(key);
            if (response.ok) {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonies.encoder.uploadSuccessful"),
                    t("tonies.encoder.uploadSuccessfulDetails", { file: tafFilename + ".taf" }),
                    t("tonies.title")
                );
                setFileList([]);
                setTafFilename("");
            } else {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("tonies.encoder.uploadFailed"),
                    t("tonies.encoder.uploadFailedDetails") + response.statusText,
                    t("tonies.title")
                );
            }
        } catch (err) {
            closeLoadingNotification(key);
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.encoder.uploadFailed"),
                t("tonies.encoder.uploadFailedDetails") + err,
                t("tonies.title")
            );
        } finally {
            setProcessing(false);
            setUploading(false);
        }
    };

    // -------------------------------------------------
    // Browser-side (WASM) Upload
    // -------------------------------------------------

    const handleWasmUpload = async () => {
        setUploading(true);
        setProcessing(true);
        const key = "encoding-" + tafFilename + ".taf";

        try {
            if (!isWasmEncoderAvailable()) {
                addLoadingNotification(key, t("tonies.encoder.loading"), t("tonies.encoder.loadingWasmEncoder"));
                await loadWasmEncoder();
                setWasmLoaded(true);
            }

            const currentUnixTime = Math.floor(Date.now() / 1000);
            const audioId = currentUnixTime - 0x50000000;

            addLoadingNotification(key, t("tonies.encoder.processing"), t("tonies.encoder.browserEncodingInProgress"));

            const tafBlob = await WasmTafEncoder.encodeMultipleFiles(
                fileList,
                audioId,
                bitrate,
                (current, total, currentFile) => {
                    addLoadingNotification(
                        key,
                        t("tonies.encoder.processing"),
                        `${t("tonies.encoder.encoding")} ${current + 1}/${total}: ${currentFile}`
                    );
                }
            );

            setProcessing(false);
            setUploading(true);

            addLoadingNotification(
                key,
                t("tonies.encoder.uploading"),
                t("tonies.encoder.uploadingDetails", { file: tafFilename + ".taf" })
            );

            const queryParams = {
                name: tafFilename + ".taf",
                path: pathFromNodeId(treeNodeId),
                special: "library",
            };
            const queryString = createQueryString(queryParams);
            const formData = new FormData();
            formData.append("file", tafBlob, tafFilename + ".taf");

            const response = await api.apiPostTeddyCloudFormDataRaw(`/api/tafUpload?${queryString}`, formData);
            closeLoadingNotification(key);
            if (response.ok) {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonies.encoder.uploadSuccessful"),
                    t("tonies.encoder.uploadSuccessfulDetails", { file: tafFilename + ".taf" }),
                    t("tonies.title")
                );
                setFileList([]);
                setTafFilename("");
            } else {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("tonies.encoder.uploadFailed"),
                    t("tonies.encoder.uploadFailedDetails") + response.statusText,
                    t("tonies.title")
                );
            }
        } catch (err) {
            closeLoadingNotification(key);
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.encoder.uploadFailed"),
                t("tonies.encoder.uploadFailedDetails") + err,
                t("tonies.title")
            );
            throw err;
        } finally {
            setProcessing(false);
            setUploading(false);
        }
    };

    return {
        // State
        fileList,
        uploading,
        processing,
        tafFilename,
        hasInvalidChars,
        useFrontendEncoding,
        useFrontendEncodingSetting,
        treeNodeId,
        treeData,
        isCreateDirectoryModalOpen,
        createDirectoryPath,
        inputRef,

        // Actions
        setTreeNodeId,
        setUseFrontendEncoding,
        sortFileListAlphabetically,
        clearFileList,
        openCreateDirectoryModal,
        closeCreateDirectoryModal,
        setCreateDirectoryPath,
        handleFileNameInputChange,
        handleUpload,
        handleWasmUpload,

        // DnD / Upload
        sensor,
        onDragEnd,
        uploadProps,
        onRemoveUpload,
        onLoadTreeData,

        // CreateDirectoryModal
        rootTreeNode,
        isNodeExpanded,
        findNodeIdByFullPath,
        findNodesByParentId,
        setRebuildList,
        setTreeData,

        // Helper
        pathFromNodeId,
        invalidCharactersAsString,
    };
};
