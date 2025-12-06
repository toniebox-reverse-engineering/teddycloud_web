import { Modal, Upload, Button, Typography, UploadProps } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Paragraph } = Typography;

interface PluginUploadModalProps {
    open: boolean;
    uploading: boolean;
    file: File | null;
    onFileChange: (file: File | null) => void;
    onOk: () => void;
    onCancel: () => void;
}

export const PluginUploadModal: React.FC<PluginUploadModalProps> = ({
    open,
    uploading,
    file,
    onFileChange,
    onOk,
    onCancel,
}) => {
    const { t } = useTranslation();

    const uploadProps: UploadProps = {
        beforeUpload: () => false,
        accept: ".zip",
        onChange: (info) => {
            const fileList = info.fileList.slice(-1);
            const last = fileList[0];
            onFileChange(last ? (last.originFileObj as File) : null);
        },
        onRemove: () => {
            onFileChange(null);
        },
        maxCount: 1,
        fileList: file ? [{ uid: file.name, name: file.name } as any] : [],
    };

    return (
        <Modal
            open={open}
            title={t("community.plugins.upload.uploadModal")}
            onCancel={onCancel}
            onOk={onOk}
            okText={t("community.plugins.upload.add")}
            okButtonProps={{ loading: uploading, disabled: !file }}
            cancelButtonProps={{ disabled: uploading }}
        >
            <Paragraph>{t("community.plugins.upload.uploadModalHint")}</Paragraph>
            <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>{t("community.plugins.upload.selectPluginZip")}</Button>
            </Upload>
        </Modal>
    );
};
