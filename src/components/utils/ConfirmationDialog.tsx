import React from "react";
import { Modal } from "antd";
import { WarningOutlined } from "@ant-design/icons";

interface ConfirmationDialogProps {
    title: string;
    okText: string;
    cancelText: string;
    content: string;
    open: boolean;
    handleOk: () => void;
    handleCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    title,
    okText,
    cancelText,
    content,
    open,
    handleOk,
    handleCancel,
}) => {
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
        </Modal>
    );
};

export default ConfirmationDialog;
