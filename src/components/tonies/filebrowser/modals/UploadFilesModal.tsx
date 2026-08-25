import React, { useEffect, useState } from "react";
import { Modal, Upload, Button, theme } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { useUploadTimeoutMs } from "../../../../hooks/getsettings/useUploadTimeoutMs";
import { useTeddyCloud } from "../../../../provider/TeddyCloudProvider";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";

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

interface UploadFilesModalProps {
    open: boolean;
    onClose: () => void;

    path: string;
    special: string;

    uploadFileList: UploadFile<any>[];
    setUploadFileList: React.Dispatch<React.SetStateAction<UploadFile<any>[]>>;

    setRebuildList: React.Dispatch<React.SetStateAction<boolean>>;
    onUploadedFiles?: (files: string[], path: string, special: string) => void;
}

const UploadFilesModal: React.FC<UploadFilesModalProps> = ({
    open,
    onClose,
    path,
    special,
    uploadFileList,
    setUploadFileList,

    setRebuildList,
    onUploadedFiles,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();
    const uploadTimeoutMs = useUploadTimeoutMs();

    const [uploading, setUploading] = useState<boolean>(false);

    useEffect(() => {
        // Ensure stale loading state is cleared when modal closes/reopens.
        if (!open) {
            setUploading(false);
        }
    }, [open]);

    const uploadDraggerProps: UploadProps = {
        name: "file",
        multiple: true,
        fileList: uploadFileList,
        customRequest: async (options: any) => {
            const { onSuccess } = options;
            onSuccess?.("Ok");
        },
        onChange(info: any) {
            const { status, fileList } = info;
            if (status !== "uploading") {
                setUploadFileList(fileList);
            }
        },
        onDrop(e: any) {
            console.log("Dropped files", e.dataTransfer.files);
        },
        onRemove: (file: any) => {
            setUploadFileList((prevFileList) => prevFileList.filter((f) => f.uid !== file.uid));
        },
    };

    const handleUploadToTeddycloud = async (files: UploadFile<any>[]) => {
        if (!files.length) {
            return;
        }

        setUploading(true);
        let failure = false;
        const uploadedFileNames: string[] = [];
        const key = "uploading-" + files.length + "-" + new Date();
        const encodedPath = normalizePathForQuery(path);
        const encodedSpecial = encodeURIComponent(special);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            addLoadingNotification(
                key,
                t("fileBrowser.upload.uploading"),
                t("fileBrowser.upload.uploadInProgress", { file: file.name }),
            );

            const formData = new FormData();
            const originalBlob = file.originFileObj as Blob | undefined;
            if (!originalBlob) {
                failure = true;
                setUploadFileList((prevList) =>
                    prevList.map((f) => (f.uid === file.uid ? { ...f, status: "error" } : f)),
                );
                continue;
            }
            // Keep multipart field name stable; send original filename separately.
            formData.append("file", originalBlob, file.name);

            try {
                const timeoutMsg = t("fileBrowser.upload.uploadTimeout", { ms: uploadTimeoutMs });
                const response = await Promise.race<Response>([
                    api.apiPostTeddyCloudFormDataRaw(
                        `/api/fileUpload?path=${encodedPath}&special=${encodedSpecial}`,
                        formData,
                    ),
                    new Promise<Response>((_, reject) =>
                        setTimeout(() => reject(new Error(timeoutMsg)), uploadTimeoutMs),
                    ),
                ]);
                if (response.ok) {
                    setUploadFileList((prevList) => prevList.filter((f) => f.uid !== file.uid));
                    uploadedFileNames.push(file.name as string);
                    addNotification(
                        NotificationTypeEnum.Success,
                        t("fileBrowser.upload.uploadedFile"),
                        t("fileBrowser.upload.uploadSuccessfulForFile", { file: file.name }),
                        t("fileBrowser.title"),
                    );
                } else {
                    failure = true;
                    setUploadFileList((prevList) =>
                        prevList.map((f) => (f.uid === file.uid ? { ...f, status: "error" } : f)),
                    );
                    addNotification(
                        NotificationTypeEnum.Error,
                        t("fileBrowser.upload.uploadedFileFailed"),
                        t("fileBrowser.upload.uploadFailedForFile", { file: file.name }),
                        t("fileBrowser.title"),
                    );
                }
            } catch (err) {
                failure = true;
                const errorMessage = err instanceof Error ? err.message : String(err);
                addNotification(
                    NotificationTypeEnum.Error,
                    t("fileBrowser.upload.uploadedFileFailed"),
                    `${t("fileBrowser.upload.uploadFailedForFile", { file: file.name })} (${errorMessage})`,
                    t("fileBrowser.title"),
                );
                setUploadFileList((prevList) =>
                    prevList.map((f) => (f.uid === file.uid ? { ...f, status: "error" } : f)),
                );
            }
        }

        await closeLoadingNotification(key);

        setRebuildList((prev) => !prev);
        if (uploadedFileNames.length > 0 && onUploadedFiles) {
            onUploadedFiles(uploadedFileNames, path, special);
        }

        if (failure) {
            addNotification(
                NotificationTypeEnum.Error,
                t("fileBrowser.upload.uploadFailed"),
                t("fileBrowser.upload.uploadFailed"),
                t("fileBrowser.title"),
            );
        } else {
            addNotification(
                NotificationTypeEnum.Success,
                t("fileBrowser.upload.uploadSuccessful"),
                t("fileBrowser.upload.uploadSuccessfulDetails"),
                t("fileBrowser.title"),
            );
            onClose();
        }

        setUploading(false);
    };

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
            <Button
                onClick={() => {
                    setUploading(false);
                    onClose();
                }}
            >
                {t("fileBrowser.upload.cancel")}
            </Button>
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

    return (
        <Modal
            className="sticky-footer"
            title={t("fileBrowser.upload.modalTitle")}
            open={open}
            onCancel={() => {
                setUploading(false);
                onClose();
            }}
            footer={footer}
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
};

export default UploadFilesModal;
