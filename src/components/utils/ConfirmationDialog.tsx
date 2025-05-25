import React, { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Modal, theme } from "antd";
import { WarningOutlined } from "@ant-design/icons";

const { useToken } = theme;

interface ConfirmationDialogProps {
    title: string;
    okText: string;
    cancelText: string;
    content: string;
    contentHint?: string;
    contentHintTitle?: string;
    contentDetails?: string | ReactNode;
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
    contentDetails = "",
    open,
    handleOk,
    handleCancel,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();

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
            {contentDetails && (
                <div style={{ marginBottom: 24, padding: 8, background: token.colorBgContainerDisabled }}>
                    {contentDetails}
                </div>
            )}
        </Modal>
    );
};

export default ConfirmationDialog;
