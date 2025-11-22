import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, type InputRef, type TreeSelectProps, type UploadProps } from "antd";
import { DefaultOptionType } from "antd/es/select";
import type { DragEndEvent } from "@dnd-kit/core";
import { PointerSensor, useSensor } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { MAX_FILES } from "../../../../constants";
import { useTeddyCloud } from "../../../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { MyUploadFile, upload as encoderUpload } from "../../../../utils/encoder";
import { isInputValid, invalidCharactersAsString } from "../../../../utils/fieldInputValidator";
import { supportedAudioExtensionsFFMPG } from "../../../../utils/supportedAudioExtensionsFFMPG";
import { createQueryString } from "../../../../utils/url";
import { loadWasmEncoder, isWasmEncoderAvailable, WasmTafEncoder } from "../../../../utils/wasmEncoder";

const api = new TeddyCloudApi(defaultAPIConfig());

const rootTreeNode = { id: "1", pId: "-1", value: "1", title: "/" };

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
    const [treeData, setTreeData] = useState<Omit<DefaultOptionType, "label">[]>([rootTreeNode]);
    const [isCreateDirectoryModalOpen, setCreateDirectoryModalOpen] = useState(false);
    const [inputValueCreateDirectory, setInputValueCreateDirectory] = useState("");
    const [hasInvalidChars, setHasInvalidChars] = useState(false);
    const [hasNewDirectoryInvalidChars, setHasNewDirectoryInvalidChars] = useState(false);

    const inputRef = useRef<InputRef>(null);

    // -------------------------------------------------------------------
    // Initial Settings + Tree preload
    // -------------------------------------------------------------------

    useEffect(() => {
        const fetchDebugPCM = async () => {
            let logPCMURLObject = false;
            try {
                const response = await api.apiGetTeddyCloudSettingRaw("debug.web.pcm_encode_console_url");
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                logPCMURLObject = data.toString() === "true";
            } catch (error) {
                console.error("Error fetching debug.web.pcm_encode_console_url: ", error);
            }
            setDebugPCMObjects(logPCMURLObject);
        };

        const fetchUseFrontendSetting = async () => {
            try {
                const response = await api.apiGetTeddyCloudSettingRaw("encode.use_frontend");
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
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
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                const bitrateSetting = parseInt(data.toString(), 10);
                if (!isNaN(bitrateSetting)) {
                    setBitrate(bitrateSetting);
                }
            } catch (error) {
                console.error("Error fetching encode.bitrate: ", error);
            }
        };

        const preLoadTreeData = async () => {
            const newPath = pathFromNodeId(rootTreeNode.id);
            api.apiGetTeddyCloudApiRaw(`/api/fileIndexV2?path=${encodeURIComponent(newPath)}&special=library`)
                .then((response) => response.json())
                .then((data) => {
                    let list: any[] = data.files;
                    list = list
                        .filter((entry) => entry.isDir && entry.name !== "..")
                        .sort((a, b) => (a.name === b.name ? 0 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1))
                        .map((entry, idx) => ({
                            id: rootTreeNode.id + "." + idx,
                            pId: rootTreeNode.id,
                            value: rootTreeNode.id + "." + idx,
                            title: entry.name,
                        }));
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

    // Autofocus im Create-Directory-Modal
    useEffect(() => {
        if (isCreateDirectoryModalOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        }
    }, [isCreateDirectoryModalOpen]);

    // -------------------------------------------------------------------
    // Tree / Pfade
    // -------------------------------------------------------------------

    const pathFromNodeId = (nodeId: string): string => {
        const node = treeData.filter((entry) => entry.value === nodeId)[0];
        if (!node) return "";
        if (node.pId === "-1") return "";
        return pathFromNodeId(treeData.filter((entry) => entry.id === node.pId)[0].id) + "/" + node.title;
    };

    const onLoadTreeData: TreeSelectProps["loadData"] = ({ id }) =>
        new Promise((resolve) => {
            const newPath = pathFromNodeId(id);
            api.apiGetTeddyCloudApiRaw(`/api/fileIndexV2?path=${encodeURIComponent(newPath)}&special=library`)
                .then((response) => response.json())
                .then((data) => {
                    let list: any[] = data.files;
                    list = list
                        .filter((entry) => entry.isDir && entry.name !== "..")
                        .sort((a, b) => (a.name === b.name ? 0 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1))
                        .map((entry, idx) => ({
                            id: id + "." + idx,
                            pId: id,
                            value: id + "." + idx,
                            title: entry.name,
                        }));
                    setTreeData((prev) => prev.concat(list));
                    resolve(true);
                })
                .catch((error) => {
                    console.error("Error loading tree data:", error);
                    resolve(false);
                });
        });

    // -------------------------------------------------------------------
    // Drag & Drop / Upload-Liste
    // -------------------------------------------------------------------

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
        accept: supportedAudioExtensionsFFMPG.join(","),
        beforeUpload: (file) => {
            const isAccepted = supportedAudioExtensionsFFMPG.some((ext) =>
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

    // -------------------------------------------------------------------
    // Create Directory Modal
    // -------------------------------------------------------------------

    const openCreateDirectoryModal = () => {
        setCreateDirectoryModalOpen(true);
    };

    const closeCreateDirectoryModal = () => {
        setCreateDirectoryModalOpen(false);
        setInputValueCreateDirectory("");
        setHasNewDirectoryInvalidChars(false);
    };

    const handleCreateDirectoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setHasNewDirectoryInvalidChars(!isInputValid(value));
        setInputValueCreateDirectory(value);
    };

    const createDirectory = () => {
        const path = pathFromNodeId(treeNodeId);
        const newNodeId = `${treeNodeId}.${treeData.length}`;
        const newDir = {
            id: newNodeId,
            pId: treeNodeId,
            value: newNodeId,
            title: inputValueCreateDirectory,
        };

        api.apiPostTeddyCloudRaw(`/api/dirCreate?special=library`, path + "/" + inputValueCreateDirectory)
            .then((response) => response.text())
            .then((text) => {
                if (text !== "OK") {
                    throw new Error(text);
                }

                setTreeData((prev) =>
                    [...prev, newDir].sort((a, b) =>
                        a.title === b.title ? 0 : a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1
                    )
                );
                setTreeNodeId(newNodeId);
                addNotification(
                    NotificationTypeEnum.Success,
                    t("fileBrowser.createDirectory.directoryCreated"),
                    t("fileBrowser.createDirectory.directoryCreatedDetails", {
                        directory: path + "/" + inputValueCreateDirectory,
                    }),
                    t("fileBrowser.title")
                );
                setCreateDirectoryModalOpen(false);
                setInputValueCreateDirectory("");
            })
            .catch((error) => {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("fileBrowser.createDirectory.directoryCreateFailed"),
                    t("fileBrowser.createDirectory.directoryCreateFailedDetails", {
                        directory: path + "/" + inputValueCreateDirectory,
                    }) + error,
                    t("fileBrowser.title")
                );
            });
    };

    // -------------------------------------------------------------------
    // Filename input
    // -------------------------------------------------------------------

    const handleFileNameInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setHasInvalidChars(!isInputValid(value));
        setTafFilename(value);
    };

    // -------------------------------------------------------------------
    // Server-side Upload
    // -------------------------------------------------------------------

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

    // -------------------------------------------------------------------
    // Browser-side (WASM) Upload
    // -------------------------------------------------------------------

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
        // state
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
        inputValueCreateDirectory,
        hasNewDirectoryInvalidChars,
        inputRef,

        // actions
        setTreeNodeId,
        setUseFrontendEncoding,
        sortFileListAlphabetically,
        clearFileList,
        openCreateDirectoryModal,
        closeCreateDirectoryModal,
        handleCreateDirectoryInputChange,
        handleFileNameInputChange,
        createDirectory,
        handleUpload,
        handleWasmUpload,

        // DnD / Upload
        sensor,
        onDragEnd,
        uploadProps,
        onRemoveUpload,
        onLoadTreeData,
        pathFromNodeId,

        // helpers
        invalidCharactersAsString,
    };
};
