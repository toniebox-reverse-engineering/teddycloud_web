import React, { useEffect, useMemo, useState } from "react";
import { Button, Empty, List, Modal, Segmented, Space, Upload, theme } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { FolderAddOutlined, InboxOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { IMAGE_EXTENSIONS } from "../../../../constants/fileTypes";
import { UPLOAD_TIMEOUT_MS } from "../../../../constants/numbers";
import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { SelectFileFileBrowser } from "../../filebrowser/SelectFileFileBrowser";
import { useDirectoryTree } from "../hooks/useDirectoryTree";
import { useDirectoryCreate } from "../hooks/useCreateDirectory";
import CreateDirectoryModal from "./CreateDirectoryModal";
import { toCustomImgWebPath, toImageSrc } from "../utils/imagePathUtils";

const api = new TeddyCloudApi(defaultAPIConfig());
const { useToken } = theme;

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

const normalizePreviewPath = (value?: string) => {
    const raw = (value || "").trim();
    if (!raw) return "";
    if (/^(https?:\/\/|data:|blob:)/i.test(raw)) return raw;
    if (raw.startsWith("/")) return raw;
    if (raw.startsWith("custom_img/")) return `/${raw}`;
    if (raw.startsWith("img/")) return `/${raw}`;
    return raw;
};

interface SelectImageModalProps {
    open: boolean;
    onClose: () => void;
    onSelectImage: (path: string) => void;
    initialSelection?: string;
    title?: string;
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
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();
    const title = titleProp ?? t("tonies.imageManager.title");
    const [source, setSource] = useState<ImageSource>("custom");
    const [customPath, setCustomPath] = useState("");
    const [customSelection, setCustomSelection] = useState("");
    const [originalSelection, setOriginalSelection] = useState("");
    const [originalImages, setOriginalImages] = useState<string[]>([]);
    const [originalImagesLoading, setOriginalImagesLoading] = useState(false);
    const [rebuildTrigger, setRebuildTrigger] = useState(0);
    const [uploadFileList, setUploadFileList] = useState<UploadFile<any>[]>([]);

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
        if (!open) return;
        const initialIsCustom = isCustomImagePath(initialSelection);
        const initialIsOriginal = initialSelection && !initialIsCustom;
        setSource(initialIsCustom ? "custom" : initialIsOriginal ? "original" : "custom");
        setCustomSelection(initialIsCustom ? initialSelection : "");
        setOriginalSelection(initialIsOriginal ? initialSelection : "");
        setCustomPath(initialIsCustom ? deriveCustomImgDirectory(initialSelection) : "");
    }, [initialSelection, open]);

    useEffect(() => {
        if (!open) {
            setOriginalImagesLoading(false);
            return;
        }
        setOriginalImagesLoading(true);
        let cancelled = false;
        const loadOriginalImages = async () => {
            try {
                const response = await api.apiGetTeddyCloudApiRaw("/api/toniesJson");
                if (cancelled || !response.ok) return;
                const data = await response.json();
                const normalized = Array.isArray(data) ? data : [];
                const pics = normalized
                    .flatMap((entry: any) => [
                        typeof entry?.pic === "string" ? entry.pic : "",
                        typeof entry?.cachePic === "string" ? entry.cachePic : "",
                        typeof entry?.tonieInfo?.picture === "string" ? entry.tonieInfo.picture : "",
                        typeof entry?.sourceInfo?.picture === "string" ? entry.sourceInfo.picture : "",
                    ])
                    .map((pic: string) => normalizePreviewPath(pic))
                    .filter((pic: string) => pic.length > 0);
                if (!cancelled) setOriginalImages(Array.from(new Set(pics)).sort((a, b) => a.localeCompare(b)));
            } catch {
                if (!cancelled) setOriginalImages([]);
            } finally {
                if (!cancelled) setOriginalImagesLoading(false);
            }
        };
        void loadOriginalImages();
        return () => {
            cancelled = true;
        };
    }, [open]);

    const selectedImage = source === "custom" ? customSelection : originalSelection;

    const canConfirm = useMemo(() => selectedImage.trim().length > 0, [selectedImage]);

    const handleUploadRequest = async (options: any) => {
        const { file, onSuccess, onError } = options;
        const key = "upload-img-" + Date.now();
        addLoadingNotification(key, t("fileBrowser.upload.uploading"), t("fileBrowser.upload.uploadInProgress", { file: file.name }));
        const encodedPath = normalizePathForQuery(customPath);
        const formData = new FormData();
        formData.append("file", file, file.name);
        try {
            const response = await Promise.race<Response>([
                api.apiPostTeddyCloudFormDataRaw(`/api/fileUpload?path=${encodedPath}&special=custom_img`, formData),
                new Promise<Response>((_, reject) =>
                    setTimeout(() => reject(new Error(`Upload timeout after ${UPLOAD_TIMEOUT_MS}ms`)), UPLOAD_TIMEOUT_MS)
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
                    setCustomSelection(toCustomImgWebPath(customPath, file.name));
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

    return (
        <>
            <Modal
                open={open}
                onCancel={onClose}
                title={title}
                width={1200}
                onOk={() => {
                    if (!canConfirm) return;
                    onSelectImage(selectedImage);
                    onClose();
                }}
                okButtonProps={{ disabled: !canConfirm }}
                okText={t("tonies.imageManager.okText")}
            >
                <Space style={{ marginBottom: 12 }}>
                    <Segmented<ImageSource>
                        value={source}
                        options={[
                            { label: t("tonies.imageManager.sourceCustom"), value: "custom" },
                            { label: t("tonies.imageManager.sourceOriginal"), value: "original" },
                        ]}
                        onChange={(value) => setSource(value)}
                    />
                </Space>

                <div style={{ display: source === "custom" ? "block" : "none" }}>
                    {source === "custom" && (
                        <>
                            <Upload.Dragger
                                {...uploadDraggerProps}
                                style={{ width: "100%", padding: "8px 16px", marginBottom: 12 }}
                            >
                                <p className="ant-upload-drag-icon" style={{ marginBottom: 4 }}>
                                    <InboxOutlined />
                                </p>
                                <p className="ant-upload-text" style={{ margin: 0, fontSize: 12 }}>
                                    {t("fileBrowser.upload.uploadHint")}
                                </p>
                            </Upload.Dragger>
                            <div style={{ marginBottom: 12 }}>
                                <Button
                                    icon={<FolderAddOutlined />}
                                    size="small"
                                    onClick={() => openCreateDirectoryModal(customPath)}
                                >
                                    {t("fileBrowser.createDirectory.createDirectory")}
                                </Button>
                            </div>
                        </>
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
                    <SelectFileFileBrowser
                        key={`custom-picker-${rebuildTrigger}`}
                        special="custom_img"
                        initialPath={customPath}
                        filetypeFilter={IMAGE_EXTENSIONS}
                        trackUrl={false}
                        maxSelectedRows={0}
                        showColumns={["picture", "name", "size", "date", "controls"]}
                        onFileSelectChange={(files, path) => {
                            setCustomPath(path);
                            if (files.length === 0) return;
                            setCustomSelection(toCustomImgWebPath(path, files[0].name));
                        }}
                    />
                </div>
                <div
                    style={{
                        display: source === "original" ? "block" : "none",
                        maxHeight: 520,
                        overflowY: "auto",
                        border: `1px solid ${token.colorBorder}`,
                        borderRadius: 8,
                    }}
                >
                    {originalImagesLoading ? (
                        <Empty
                            style={{ margin: "40px 0" }}
                            description={t("tonies.imageManager.originalImagesLoading")}
                        />
                    ) : originalImages.length === 0 ? (
                        <Empty
                            style={{ margin: "40px 0" }}
                            description={t("tonies.imageManager.noOriginalImages")}
                        />
                    ) : (
                        <List
                            dataSource={originalImages}
                            renderItem={(item) => (
                                <List.Item
                                    onClick={() => setOriginalSelection(item)}
                                    style={{
                                        cursor: "pointer",
                                        padding: 8,
                                        border:
                                            originalSelection === item
                                                ? `1px solid ${token.colorPrimary}`
                                                : "1px solid transparent",
                                        borderRadius: 8,
                                        margin: 4,
                                    }}
                                >
                                    <Space align="center">
                                        <img
                                            src={toImageSrc(item)}
                                            alt="default"
                                            referrerPolicy="no-referrer"
                                            loading="lazy"
                                            decoding="async"
                                            style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }}
                                        />
                                        <span>{item}</span>
                                    </Space>
                                </List.Item>
                            )}
                        />
                    )}
                </div>
            </Modal>
        </>
    );
};

export default SelectImageModal;
