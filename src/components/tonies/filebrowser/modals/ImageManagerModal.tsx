import React, { useEffect, useMemo, useState } from "react";
import { Empty, List, Modal, Segmented, Space } from "antd";
import { useTranslation } from "react-i18next";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { SelectFileFileBrowser } from "../SelectFileFileBrowser";

const api = new TeddyCloudApi(defaultAPIConfig());

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

type ImageSource = "custom" | "default";

const normalizeDirPath = (value: string) => value.replace(/^\/+/, "").replace(/\/+$/, "");

const deriveCustomImgDirectory = (pic?: string): string => {
    if (!pic || !pic.startsWith("/custom_img/")) return "";
    const normalized = pic.slice("/custom_img/".length);
    const segments = normalized.split("/").filter(Boolean);
    if (segments.length <= 1) return "";
    return segments.slice(0, -1).join("/");
};

const toCustomImgWebPath = (path: string, fileName: string) => {
    const normalizedPath = normalizeDirPath(path);
    return normalizedPath ? `/custom_img/${normalizedPath}/${fileName}` : `/custom_img/${fileName}`;
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

interface ImageManagerModalProps {
    open: boolean;
    onClose: () => void;
    onSelectImage: (path: string) => void;
    initialSelection?: string;
    title?: string;
}

export const ImageManagerModal: React.FC<ImageManagerModalProps> = ({
    open,
    onClose,
    onSelectImage,
    initialSelection = "",
    title: titleProp,
}) => {
    const { t } = useTranslation();
    const title = titleProp ?? t("tonies.imageManager.title");
    const [source, setSource] = useState<ImageSource>("custom");
    const [customPath, setCustomPath] = useState("");
    const [customSelection, setCustomSelection] = useState("");
    const [defaultSelection, setDefaultSelection] = useState("");
    const [defaultImages, setDefaultImages] = useState<string[]>([]);


    useEffect(() => {
        if (!open) return;
        const initialIsCustom = isCustomImagePath(initialSelection);
        const initialIsDefault = initialSelection && !initialIsCustom;
        setSource(initialIsCustom ? "custom" : initialIsDefault ? "default" : "custom");
        setCustomSelection(initialIsCustom ? initialSelection : "");
        setDefaultSelection(initialIsDefault ? initialSelection : "");
        setCustomPath(initialIsCustom ? deriveCustomImgDirectory(initialSelection) : "");
    }, [initialSelection, open]);

    useEffect(() => {
        if (!open || source !== "default") return;
        const loadDefaultImages = async () => {
            try {
                const response = await api.apiGetTeddyCloudApiRaw("/api/toniesJson");
                if (!response.ok) return;
                const data = await response.json();
                const normalized = Array.isArray(data) ? data : [];
                const pics = normalized
                    .flatMap((entry: any) => [
                        typeof entry?.pic === "string" ? entry.pic : "",
                        typeof entry?.picture === "string" ? entry.picture : "",
                        typeof entry?.tonieInfo?.picture === "string" ? entry.tonieInfo.picture : "",
                        typeof entry?.sourceInfo?.picture === "string" ? entry.sourceInfo.picture : "",
                    ])
                    .map((pic: string) => normalizePreviewPath(pic))
                    .filter((pic: string) => pic.length > 0);
                setDefaultImages(Array.from(new Set(pics)).sort((a, b) => a.localeCompare(b)));
            } catch {
                setDefaultImages([]);
            }
        };
        void loadDefaultImages();
    }, [open, source]);

    const selectedImage = source === "custom" ? customSelection : defaultSelection;

    const canConfirm = useMemo(() => selectedImage.trim().length > 0, [selectedImage]);

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
                            { label: t("tonies.imageManager.sourceDefault"), value: "default" },
                        ]}
                        onChange={(value) => setSource(value)}
                    />
                </Space>

                <div style={{ display: source === "custom" ? "block" : "none" }}>
                    <SelectFileFileBrowser
                        key="custom-picker"
                        special="custom_img"
                        initialPath={customPath}
                        filetypeFilter={IMAGE_EXTENSIONS}
                        trackUrl={false}
                        maxSelectedRows={0}
                        enableFileManagement
                        showColumns={["picture", "name", "size", "date", "controls"]}
                        onFileSelectChange={(files, path) => {
                            setCustomPath(path);
                            if (files.length === 0) return;
                            setCustomSelection(toCustomImgWebPath(path, files[0].name));
                        }}
                        onUploadedFiles={(files, path) => {
                            if (files.length > 0) {
                                setSource("custom");
                                setCustomSelection(toCustomImgWebPath(path, files[0]));
                            }
                        }}
                    />
                </div>
                <div
                    style={{
                        display: source === "default" ? "block" : "none",
                        maxHeight: 520,
                        overflowY: "auto",
                        border: "1px solid #303030",
                        borderRadius: 8,
                    }}
                >
                    {defaultImages.length === 0 ? (
                        <Empty
                            style={{ margin: "40px 0" }}
                            description={t("tonies.imageManager.noDefaultImages")}
                        />
                    ) : (
                        <List
                            dataSource={defaultImages}
                            renderItem={(item) => (
                                <List.Item
                                    onClick={() => setDefaultSelection(item)}
                                    style={{
                                        cursor: "pointer",
                                        padding: 8,
                                        border:
                                            defaultSelection === item ? "1px solid #1677ff" : "1px solid transparent",
                                        borderRadius: 8,
                                        margin: 4,
                                    }}
                                >
                                    <Space align="center">
                                        <img
                                            src={item}
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

export default ImageManagerModal;
