import React from "react";
import { Alert, Modal } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface ConfirmationDialogProps {
    title: string;
    okText: string;
    cancelText: string;
    content: string;
    contentHint?: string;
    contentHintTitle?: string;
    open: boolean;
    handleOk: () => void;
    handleCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    title,
    okText,
    cancelText,
    content,
    contentHint = "",
    contentHintTitle = "",
    open,
    handleOk,
    handleCancel,
}) => {
    const { t } = useTranslation();

    return (
        <Modal
            title={
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <WarningOutlined style={{ fontSize: 36, color: "orange", margin: 16 }} />
                    <div style={{ marginBottom: 16 }}>{title}</div>
                </div>
            }
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            okText={okText}
            cancelText={cancelText}
            className="warning"
        >
            <div style={{ marginBottom: 24 }}>{content}</div>
            {contentHint && (
                <div>
                    <Alert
                        type="warning"
                        showIcon
                        message={contentHintTitle || t("confirmDialog.contentHintTitle")}
                        description={contentHint}
                    />
                </div>
            )}
        </Modal>
    );
};

export default ConfirmationDialog;
