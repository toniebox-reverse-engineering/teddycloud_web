import { UploadProps, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import Dragger from "antd/es/upload/Dragger";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export const CertificateDragNDrop: React.FC<{ overlay?: String }> = ({ overlay }) => {
  const { t } = useTranslation();

  const props: UploadProps = {
    name: "file",
    multiple: true,
    customRequest: (options) => {
      const { onSuccess, onError, file, filename } = options;

      const triggerWriteConfig = async () => {
        await api.apiTriggerWriteConfigGet();
      };

      const formData = new FormData();
      formData.append(filename!, file);

      const UploadCertificates = async (formData: any) => {
        try {
          await api.apiUploadCertPost(formData, overlay);
          onSuccess!("Ok");

          try {
            triggerWriteConfig();
          } catch (e) {
            message.error("Error while saving config to file.");
          }
        } catch (err) {
          const error = new Error("Some error");
          onError!(error);
        }
      };

      UploadCertificates(formData);
    },
    onChange(info) {
      const { status } = info.file;
      if (status !== "uploading") {
        console.log(info.file, info.fileList);
      }
      if (status === "done") {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },

    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  return (
    <>
      <Dragger {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          {t("settings.certificates.uploadText")}
        </p>
        <p className="ant-upload-hint">
          {t("settings.certificates.uploadHint")}
        </p>
      </Dragger>
    </>
  );
};
