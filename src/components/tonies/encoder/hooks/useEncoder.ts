import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, type InputRef, type TreeSelectProps, type UploadProps } from "antd";
import type { DragEndEvent } from "@dnd-kit/core";
import { PointerSensor, useSensor } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { MAX_FILES } from "../../../../constants/numbers";
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
import { useDirectoryTree } from "../../common/hooks/useDirectoryTree";

const api = new TeddyCloudApi(defaultAPIConfig());

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

        fetchDebugPCM();
        fetchUseFrontendSetting();
        fetchBitrateSetting();
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

    const directoryTree = useDirectoryTree();
    const { treeNodeId, setTreeData, getPathFromNodeId } = directoryTree;

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
    // CreateDirectoryModal-Handling
    // -------------------------------------------------

    const openCreateDirectoryModal = () => {
        const currentPath = getPathFromNodeId(treeNodeId); // ohne / am Ende
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
            path: getPathFromNodeId(treeNodeId),
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
                path: getPathFromNodeId(treeNodeId),
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
        isCreateDirectoryModalOpen,
        createDirectoryPath,
        inputRef,

        // Actions
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

        directoryTree,

        // CreateDirectoryModal
        setRebuildList,
        setTreeData,

        // Helper
        invalidCharactersAsString,
    };
};
