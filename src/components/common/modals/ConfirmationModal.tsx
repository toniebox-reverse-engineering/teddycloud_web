import React, { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Modal, theme } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import styled from "styled-components";

const { useToken } = theme;

const StyledModal = styled(Modal)<{ warningColor: string }>`
    &.warning {
        .ant-modal-content {
            border-top: 8px solid ${({ warningColor }) => warningColor};
        }
    }
`;

interface ConfirmationDialogProps {
    title: string;
    okText: string;
    cancelText: string;
    content: string;
    contentHint?: string;
    contentHintTitle?: string;
    contentDetails?: ReactNode;
    open: boolean;
    handleOk: () => void;
    handleCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    title,
    okText,
    cancelText,
    content,
    contentHint,
    contentHintTitle,
    contentDetails,
    open,
    handleOk,
    handleCancel,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();

    const modalHeader = (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                paddingBottom: 8,
            }}
        >
            <WarningOutlined style={{ fontSize: 36, color: token.colorWarning }} />
            <div>{title}</div>
        </div>
    );

    return (
        <StyledModal
            warningColor={token.colorWarning}
            className="warning"
            open={open}
            title={modalHeader}
            onOk={handleOk}
            onCancel={handleCancel}
            okText={okText}
            cancelText={cancelText}
        >
            <div style={{ marginBottom: 24 }}>{content}</div>

            {contentHint && (
                <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 20 }}
                    title={contentHintTitle || t("confirmDialog.contentHintTitle")}
                    description={contentHint}
                />
            )}

            {contentDetails && (
                <div
                    style={{
                        marginBottom: 24,
                        padding: 8,
                        borderRadius: 4,
                        background: token.colorBgContainerDisabled,
                    }}
                >
                    {contentDetails}
                </div>
            )}
        </StyledModal>
    );
};

export default ConfirmationDialog;
