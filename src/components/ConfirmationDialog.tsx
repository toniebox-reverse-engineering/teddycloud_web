import React from "react";
import { Modal, Typography } from "antd";
import { WarningOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface ConfirmationDialogProps {
    title: string;
    okText: string;
    cancelText: string;
    content: string;
    isVisible: boolean;
    handleOk: () => void;
    handleCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    title,
    okText,
    cancelText,
    content,
    isVisible,
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
            open={isVisible}
            onOk={handleOk}
            onCancel={handleCancel}
            okText={okText}
            cancelText={cancelText}
            className="warning"
        >
            <Text>{content}</Text>
        </Modal>
    );
};

export default ConfirmationDialog;
