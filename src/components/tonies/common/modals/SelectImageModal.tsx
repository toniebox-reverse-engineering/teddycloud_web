import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Modal, Segmented, Space, Upload, theme } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { useTranslation } from "react-i18next";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { IMAGE_EXTENSIONS } from "../../../../constants/fileTypes";
import {
    SELECT_IMAGE_JSON_PREFETCH_FALLBACK_MS,
    UI_SEARCH_DEBOUNCE_MS,
} from "../../../../constants/numbers";
import { useUploadTimeoutMs } from "../../../../hooks/getsettings/useUploadTimeoutMs";
import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { useDirectoryTree } from "../hooks/useDirectoryTree";
import { useDirectoryCreate } from "../hooks/useCreateDirectory";
import { toCustomImgWebPath } from "../utils/imagePathUtils";
import {
    originalImageUrlMatchesTokens,
    tokenizeOriginalImageSearch,
} from "../utils/originalImageUrlSearch";
import CustomImagesPanel from "./selectImage/CustomImagesPanel";
import OriginalImagesPanel from "./selectImage/OriginalImagesPanel";
import { useOriginalImagesData } from "./selectImage/useOriginalImagesData";

const api = new TeddyCloudApi(defaultAPIConfig());
const { useToken } = theme;

const ORIGINAL_PICS_SESSION_KEY = "teddy:selectImageModal:originalPicUrls:v1";

const MODAL_WIDTH_CSS = "min(1200px, calc(100vw - 16px))";

const normalizePathForQuery = (inputPath: string) => {
    const raw = (inputPath || "").trim();
    if (!raw) return "";
    return raw
        .split("/")
        .filter((segment) => segment.length > 0)
        .map((segment) => {
            try {
                return encodeURIComponent(decodeURIComponent(segment));
            } catch {
                return encodeURIComponent(segment);
            }
        })
        .join("/");
};

type ImageSource = "custom" | "original";

const deriveCustomImgDirectory = (pic?: string): string => {
    if (!pic || !pic.startsWith("/custom_img/")) return "";
    const normalized = pic.slice("/custom_img/".length);
    const segments = normalized.split("/").filter(Boolean);
    if (segments.length <= 1) return "";
    return segments.slice(0, -1).join("/");
};

const isCustomImagePath = (path?: string) => !!path && path.startsWith("/custom_img/");

interface SelectImageModalProps {
    open: boolean;
    onClose: () => void;
    onSelectImage: (path: string) => void;
    initialSelection?: string;
    title?: string;
    /** Optional stacking override for nested modal usage. */
    zIndex?: number;
    /** When true, allows selecting multiple images (Custom + Original). onSelectImage is called for each. Used by TeddyStudio. */
    allowMultiple?: boolean;
}

/**
 * Select image = picker for Custom + Original images, with upload option for custom into specified folder.
 * Used in TeddyStudio and Custom Models. Not the Library Manager (that's Library page → custom_img tab with FileBrowser).
 */
export const SelectImageModal: React.FC<SelectImageModalProps> = ({
    open,
    onClose,
    onSelectImage,
    initialSelection = "",
    title: titleProp,
    zIndex,
    allowMultiple = false,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();
    const uploadTimeoutMs = useUploadTimeoutMs();
    const title = titleProp ?? t("tonies.imageManager.title");
    const [source, setSource] = useState<ImageSource>("custom");
    const [customPath, setCustomPath] = useState("");
    const [customSelections, setCustomSelections] = useState<string[]>([]);
    const [originalSelections, setOriginalSelections] = useState<string[]>([]);
    const [rebuildTrigger, setRebuildTrigger] = useState(0);
    const [uploadFileList, setUploadFileList] = useState<UploadFile<any>[]>([]);
    const [originalSearchInput, setOriginalSearchInput] = useState("");
    const [debouncedOriginalSearch, setDebouncedOriginalSearch] = useState("");
    const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [imagePreviewUrl, setImagePreviewUrl] = useState("");

    const openImagePreview = useCallback((url: string) => {
        setImagePreviewUrl(url);
        setImagePreviewOpen(true);
    }, []);

    const { originalImages, originalImagesLoading } = useOriginalImagesData({
        open,
        source,
        sessionKey: ORIGINAL_PICS_SESSION_KEY,
    });

    const directoryTree = useDirectoryTree("custom_img", { skipPreload: true });
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
        path: customPath,
        directoryTree,
        selectNewNode: true,
        setRebuildList: () => setRebuildTrigger((prev) => prev + 1),
        special: "custom_img",
    });

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedOriginalSearch(originalSearchInput), UI_SEARCH_DEBOUNCE_MS);
        return () => window.clearTimeout(timer);
    }, [originalSearchInput]);

    useEffect(() => {
        if (!open) {
            setOriginalSearchInput("");
            setDebouncedOriginalSearch("");
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const initialIsCustom = isCustomImagePath(initialSelection);
        const initialIsOriginal = initialSelection && !initialIsCustom;
        setSource(initialIsCustom ? "custom" : initialIsOriginal ? "original" : "custom");
        setCustomSelections(initialIsCustom ? [initialSelection] : []);
        setOriginalSelections(initialIsOriginal ? [initialSelection] : []);
        setCustomPath(initialIsCustom ? deriveCustomImgDirectory(initialSelection) : "");
    }, [initialSelection, open]);

    const searchTokens = useMemo(() => tokenizeOriginalImageSearch(debouncedOriginalSearch), [debouncedOriginalSearch]);

    const filteredOriginalUrls = useMemo(
        () => originalImages.filter((url) => originalImageUrlMatchesTokens(url, searchTokens)),
        [originalImages, searchTokens]
    );
    const originalTableData = useMemo(() => filteredOriginalUrls.map((url) => ({ url })), [filteredOriginalUrls]);

    const selectedImages = source === "custom" ? customSelections : originalSelections;
    const selectedImagesForConfirm = useMemo(
        () =>
            allowMultiple
                ? Array.from(new Set([...customSelections, ...originalSelections]))
                : selectedImages,
        [allowMultiple, customSelections, originalSelections, selectedImages]
    );

    const canConfirm = useMemo(() => selectedImagesForConfirm.length > 0, [selectedImagesForConfirm]);

    const confirmSelection = (paths: string[]) => {
        if (paths.length === 0) return;
        paths.forEach((path) => onSelectImage(path));
        onClose();
    };

    const handleUploadRequest = async (options: any) => {
        const { file, onSuccess, onError } = options;
        const key = "upload-img-" + Date.now();
        addLoadingNotification(key, t("fileBrowser.upload.uploading"), t("fileBrowser.upload.uploadInProgress", { file: file.name }));
        const encodedPath = normalizePathForQuery(customPath);
        const formData = new FormData();
        formData.append("file", file, file.name);
        const timeoutMsg = t("fileBrowser.upload.uploadTimeout", { ms: uploadTimeoutMs });
        try {
            const response = await Promise.race<Response>([
                api.apiPostTeddyCloudFormDataRaw(`/api/fileUpload?path=${encodedPath}&special=custom_img`, formData),
                new Promise<Response>((_, reject) =>
                    setTimeout(() => reject(new Error(timeoutMsg)), uploadTimeoutMs)
                ),
            ]);
            await closeLoadingNotification(key);
            if (response.ok) {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("fileBrowser.upload.uploadedFile"),
                    t("fileBrowser.upload.uploadSuccessfulForFile", { file: file.name }),
                    t("fileBrowser.title")
                );
                setRebuildTrigger((prev) => prev + 1);
                if (IMAGE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
                    setCustomSelections([toCustomImgWebPath(customPath, file.name)]);
                }
                onSuccess?.("ok");
            } else {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("fileBrowser.upload.uploadedFileFailed"),
                    t("fileBrowser.upload.uploadFailedForFile", { file: file.name }),
                    t("fileBrowser.title")
                );
                onError?.(new Error("Upload failed"));
            }
        } catch (err) {
            await closeLoadingNotification(key);
            const msg = err instanceof Error ? err.message : String(err);
            addNotification(
                NotificationTypeEnum.Error,
                t("fileBrowser.upload.uploadedFileFailed"),
                `${t("fileBrowser.upload.uploadFailedForFile", { file: file.name })} (${msg})`,
                t("fileBrowser.title")
            );
            onError?.(err);
        }
    };

    const uploadDraggerProps: UploadProps = {
        name: "file",
        multiple: true,
        accept: IMAGE_EXTENSIONS.map((ext) => `.${ext}`).join(","),
        fileList: uploadFileList,
        customRequest: handleUploadRequest,
        onChange: (info) => {
            if (info.file.status !== "uploading") {
                setUploadFileList(info.fileList);
            }
        },
        onRemove: (file) => {
            setUploadFileList((prev) => prev.filter((f) => f.uid !== file.uid));
        },
        showUploadList: { showPreviewIcon: false },
    };

    const handleConfirm = () => {
        if (!canConfirm) return;
        confirmSelection(selectedImagesForConfirm);
    };
    const handleCustomFileSelectChange = useCallback(
        (paths: string[], path: string) => {
            setCustomPath(path);
            setCustomSelections(allowMultiple ? paths : paths.slice(0, 1));
        },
        [allowMultiple]
    );
    const handleCustomFileDoubleClick = useCallback(
        (path: string, fileName: string) => {
            if (allowMultiple) return;
            confirmSelection([toCustomImgWebPath(path, fileName)]);
        },
        [allowMultiple]
    );

    const footer = (
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
            <Button htmlType="button" onClick={onClose}>
                {t("tonies.selectFileModal.cancel")}
            </Button>
            <Button htmlType="button" type="primary" onClick={handleConfirm} disabled={!canConfirm}>
                {t("tonies.imageManager.okText")}
            </Button>
        </div>
    );

    return (
        <>
            <Modal
                title={t("tonies.customEditor.previewTitle")}
                open={imagePreviewOpen}
                onCancel={() => setImagePreviewOpen(false)}
                footer={null}
                zIndex={zIndex !== undefined ? zIndex + 1 : undefined}
            >
                {imagePreviewUrl ? (
                    <img
                        src={imagePreviewUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        style={{ width: "100%" }}
                    />
                ) : null}
            </Modal>
            <Modal
                className="sticky-footer"
                open={open}
                onCancel={onClose}
                destroyOnClose
                title={title}
                width={MODAL_WIDTH_CSS}
                footer={footer}
                zIndex={zIndex}
                bodyStyle={{
                    maxHeight: "calc(100dvh - 200px)",
                    overflow: "hidden",
                    padding: "12px 16px",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div style={{ width: "100%", display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
                    <Space style={{ marginBottom: 8 }}>
                        <Segmented<ImageSource>
                            value={source}
                            options={[
                                { label: t("tonies.imageManager.sourceCustom"), value: "custom" },
                                { label: t("tonies.imageManager.sourceOriginal"), value: "original" },
                            ]}
                            onChange={(value) => setSource(value)}
                        />
                    </Space>

                    {source === "custom" ? (
                        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                            <CustomImagesPanel
                                allowMultiple={allowMultiple}
                                customPath={customPath}
                                rebuildTrigger={rebuildTrigger}
                                active
                                onImagePreview={openImagePreview}
                                uploadDraggerProps={uploadDraggerProps}
                                isCreateDirectoryModalOpen={isCreateDirectoryModalOpen}
                                createDirectoryPath={createDirectoryPath}
                                createDirectoryInputKey={createDirectoryInputKey}
                                hasNewDirectoryInvalidChars={hasNewDirectoryInvalidChars}
                                isCreateDirectoryButtonDisabled={isCreateDirectoryButtonDisabled}
                                inputCreateDirectoryRef={inputCreateDirectoryRef}
                                handleCreateDirectoryInputChange={handleCreateDirectoryInputChange}
                                closeCreateDirectoryModal={closeCreateDirectoryModal}
                                createDirectory={createDirectory}
                                openCreateDirectoryModal={openCreateDirectoryModal}
                                onCustomSelect={handleCustomFileSelectChange}
                                onCustomDoubleClick={handleCustomFileDoubleClick}
                                onCustomImgDropFiles={(files) => {
                                    Array.from(files).forEach((file) => {
                                        if (!IMAGE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
                                            return;
                                        }
                                        void handleUploadRequest({
                                            file: file as any,
                                            onSuccess: () => {},
                                            onError: () => {},
                                        });
                                    });
                                }}
                            />
                        </div>
                    ) : null}

                    {source === "original" ? (
                        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                            <OriginalImagesPanel
                                allowMultiple={allowMultiple}
                                originalImagesLoading={originalImagesLoading}
                                originalImages={originalImages}
                                originalSearchInput={originalSearchInput}
                                setOriginalSearchInput={setOriginalSearchInput}
                                originalSelections={originalSelections}
                                setOriginalSelections={setOriginalSelections}
                                originalTableData={originalTableData}
                                onConfirmSingle={(url) => confirmSelection([url])}
                                onImagePreview={openImagePreview}
                            />
                        </div>
                    ) : null}
                </div>
            </Modal>
        </>
    );
};

export default SelectImageModal;
