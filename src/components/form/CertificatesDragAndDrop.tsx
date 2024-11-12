import { useTranslation } from "react-i18next";
import { Upload, UploadFile } from "antd";
import { InboxOutlined } from "@ant-design/icons";

import { ApiUploadCertPostRequest, TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

export const CertificateDragNDrop: React.FC<{ overlay?: string }> = ({ overlay }) => {
    const { t } = useTranslation();
    const { addNotification, setFetchCloudStatus } = useTeddyCloud();

    const handleUpload = async (file: UploadFile<any>) => {
        const formData = new FormData();
        formData.append("file", file as unknown as Blob);

        const payload: ApiUploadCertPostRequest = {
            filename: [formData.get("file") as Blob], // Wrap Blob in an array
        };

        const triggerWriteConfig = async () => {
            await api.apiTriggerWriteConfigGet();
        };

        const UploadCertificates = async (formData: any) => {
            try {
                await api.apiUploadCertPost(formData, overlay);
                try {
                    triggerWriteConfig();
                } catch (e) {
                    addNotification(
                        NotificationTypeEnum.Error,
                        t("settings.errorWhileSavingConfig"),
                        t("settings.errorWhileSavingConfigDetails") + e,
                        overlay ? t("tonieboxes.navigationTitle") : t("settings.navigationTitle")
                    );
                }
                addNotification(
                    NotificationTypeEnum.Success,
                    t("settings.certificates.uploadSuccessful"),
                    t("settings.certificates.uploadSuccessfulDetails", {
                        filename: file.name,
                    }),
                    overlay ? t("tonieboxes.navigationTitle") : t("settings.navigationTitle")
                );
                setFetchCloudStatus((prev) => !prev);
            } catch (err) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("settings.certificates.uploadFailed"),
                    t("settings.certificates.uploadFailedDetails", {
                        filename: file.name,
                    }) +
                        ": " +
                        err,
                    overlay ? t("tonieboxes.navigationTitle") : t("settings.navigationTitle")
                );
            }
        };

        UploadCertificates(payload);
    };

    const props = {
        name: "file",
        multiple: true,
        beforeUpload: (file: UploadFile) => {
            if (file.type !== "application/x-x509-ca-cert" && !file.name.endsWith(".der")) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("settings.certificates.uploadFailed"),
                    t("settings.certificates.uploadFailedDetails", {
                        filename: file.name,
                    }) +
                        ": " +
                        t("settings.certificates.invalidFileType"),
                    overlay ? t("tonieboxes.navigationTitle") : t("settings.navigationTitle")
                );
                return Upload.LIST_IGNORE;
            }
            return true;
        },
        customRequest: async (options: any) => {
            const { onSuccess, onError, file } = options;
            try {
                await handleUpload(file);
                onSuccess("Ok");
            } catch (error) {
                onError(error as Error);
            }
        },
        onChange(info: any) {
            const { status } = info.file;
            if (status !== "uploading") {
                console.log(info.file, info.fileList);
            }
        },

        onDrop(e: any) {
            console.log("Dropped files", e.dataTransfer.files);
        },
    };

    return (
        <Upload.Dragger {...props}>
            <p className="ant-upload-drag-icon">
                <InboxOutlined />
            </p>
            <p className="ant-upload-text">{t("settings.certificates.uploadText")}</p>
            <p className="ant-upload-hint">{t("settings.certificates.uploadHint")}</p>
        </Upload.Dragger>
    );
};
