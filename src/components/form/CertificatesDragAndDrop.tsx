import { Upload, message, UploadFile } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { ApiUploadCertPostRequest, TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export const CertificateDragNDrop: React.FC<{ overlay?: string }> = ({ overlay }) => {
    const { t } = useTranslation();

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
                    message.error("Error while saving config to file.");
                }
                message.success(
                    t("settings.certificates.uploadSuccessful", {
                        filename: file.name,
                    })
                );
            } catch (err) {
                message.error(
                    t("settings.certificates.uploadFailed", {
                        filename: file.name,
                    })
                );
            }
        };

        UploadCertificates(payload);
    };

    const props = {
        name: "file",
        multiple: true,
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
