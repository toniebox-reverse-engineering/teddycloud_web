import { useTranslation } from "react-i18next";
import { Upload, UploadFile } from "antd";
import type { UploadProps } from "antd";

import { InboxOutlined } from "@ant-design/icons";

import { ApiUploadCertPostRequest, TeddyCloudApi } from "../../../api";
import { defaultAPIConfig } from "../../../config/defaultApiConfig";
import { useTeddyCloud } from "../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../types/teddyCloudNotificationTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

interface CertificateDragNDropProps {
    overlay?: string;
}

type CustomRequestOptions = Parameters<NonNullable<UploadProps["customRequest"]>>[0];

export const CertificateDragNDrop: React.FC<CertificateDragNDropProps> = ({ overlay }) => {
    const { t } = useTranslation();
    const { addNotification, setFetchCloudStatus } = useTeddyCloud();

    const navigationTitle = overlay ? t("tonieboxes.navigationTitle") : t("settings.navigationTitle");

    const triggerWriteConfig = async () => {
        try {
            await api.apiTriggerWriteConfigGet();
        } catch (e) {
            addNotification(
                NotificationTypeEnum.Error,
                t("settings.errorWhileSavingConfig"),
                t("settings.errorWhileSavingConfigDetails") + e,
                navigationTitle
            );
        }
    };

    const handleUpload = async (file: UploadFile<unknown>) => {
        const blob = file as unknown as Blob;

        const payload: ApiUploadCertPostRequest = {
            filename: [blob],
        };

        try {
            await api.apiUploadCertPost(payload, overlay);
            await triggerWriteConfig();

            addNotification(
                NotificationTypeEnum.Success,
                t("settings.certificates.uploadSuccessful"),
                t("settings.certificates.uploadSuccessfulDetails", {
                    filename: file.name,
                }),
                navigationTitle
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
                navigationTitle
            );
            throw err;
        }
    };

    const props = {
        name: "file",
        multiple: true,
        beforeUpload: (file: UploadFile<unknown>) => {
            if (file.type !== "application/x-x509-ca-cert" && !file.name.endsWith(".der")) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("settings.certificates.uploadFailed"),
                    t("settings.certificates.uploadFailedDetails", {
                        filename: file.name,
                    }) +
                        ": " +
                        t("settings.certificates.invalidFileType"),
                    navigationTitle
                );
                return Upload.LIST_IGNORE;
            }
            return true;
        },
        customRequest: async (options: CustomRequestOptions) => {
            const { onSuccess, onError, file } = options;
            try {
                await handleUpload(file as UploadFile<unknown>);
                onSuccess && onSuccess("OK");
            } catch (error) {
                onError && onError(error as Error);
            }
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
