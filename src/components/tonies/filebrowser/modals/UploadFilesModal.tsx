import React, { useState } from "react";
import { Modal, Upload, Button, theme } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { useTeddyCloud } from "../../../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";

const api = new TeddyCloudApi(defaultAPIConfig());
const { useToken } = theme;

interface UploadFilesModalProps {
    open: boolean;
    onClose: () => void;

    path: string;
    special: string;

    uploadFileList: UploadFile<any>[];
    setUploadFileList: React.Dispatch<React.SetStateAction<UploadFile<any>[]>>;

    rebuildList: boolean;
    setRebuildList: React.Dispatch<React.SetStateAction<boolean>>;
}

const UploadFilesModal: React.FC<UploadFilesModalProps> = ({
    open,
    onClose,
    path,
    special,
    uploadFileList,
    setUploadFileList,
    rebuildList,
    setRebuildList,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();

    const [uploading, setUploading] = useState<boolean>(false);

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
            // optional: Logging hier behalten oder entfernen
            // console.log("Dropped files", e.dataTransfer.files);
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
        const key = "uploading-" + files.length + "-" + new Date();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            addLoadingNotification(
                key,
                t("fileBrowser.upload.uploading"),
                t("fileBrowser.upload.uploadInProgress", { file: file.name })
            );

            const formData = new FormData();
            // antd UploadFile hat originFileObj
            formData.append(file.name as string, file.originFileObj as Blob);

            try {
                const response = await api.apiPostTeddyCloudFormDataRaw(
                    `/api/fileUpload?path=${path}&special=${special}`,
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
                        prevList.map((f) => (f.uid === file.uid ? { ...f, status: "error" } : f))
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
                    prevList.map((f) => (f.uid === file.uid ? { ...f, status: "error" } : f))
                );
            }
        }

        closeLoadingNotification(key);

        setRebuildList(!rebuildList);

        if (failure) {
            addNotification(
                NotificationTypeEnum.Error,
                t("fileBrowser.upload.uploadFailed"),
                t("fileBrowser.upload.uploadFailed"),
                t("fileBrowser.title")
            );
        } else {
            addNotification(
                NotificationTypeEnum.Success,
                t("fileBrowser.upload.uploadSuccessful"),
                t("fileBrowser.upload.uploadSuccessfulDetails"),
                t("fileBrowser.title")
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
            <Button onClick={onClose}>{t("fileBrowser.upload.cancel")}</Button>
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
            onCancel={onClose}
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
