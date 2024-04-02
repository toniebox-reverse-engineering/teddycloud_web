import { UploadProps, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import {
  HiddenDesktop,
  StyledBreadcrumb,
  StyledContent,
  StyledLayout,
  StyledSider,
} from "../../../components/StyledComponents";
import { SettingsSubNav } from "../../../components/settings/SettingsSubNav";
import Dragger from "antd/es/upload/Dragger";
import { TeddyCloudApi } from "../../../api";
import { defaultAPIConfig } from "../../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export const CertificatesPage = () => {
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
          await api.apiUploadCertPost(formData);
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
      <StyledSider>
        <SettingsSubNav />
      </StyledSider>
      <StyledLayout>
        <HiddenDesktop>
          <SettingsSubNav />
        </HiddenDesktop>
        <StyledBreadcrumb
          items={[
            { title: t("home.navigationTitle") },
            { title: t("settings.navigationTitle") },
            { title: t("settings.certificates.navigationTitle") },
          ]}
        />
        <StyledContent>
          <h1>{t(`settings.certificates.title`)}</h1>
          <div>
            <Dragger {...props}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag file to this area to upload
              </p>
              <p className="ant-upload-hint">
                Drag and drop client certificates from your box here
              </p>
            </Dragger>
          </div>
        </StyledContent>
      </StyledLayout>
    </>
  );
};
