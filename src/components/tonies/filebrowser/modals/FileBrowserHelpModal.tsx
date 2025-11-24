import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Button, Flex, Typography, Divider } from "antd";
import {
    NodeExpandOutlined,
    DeleteOutlined,
    CloudSyncOutlined,
    PlayCircleOutlined,
    CloudServerOutlined,
    TruckOutlined,
    EditOutlined,
    FormOutlined,
    CopyOutlined,
} from "@ant-design/icons";

interface HelpModalProps {
    isHelpModalOpen: boolean;
    onClose: () => void;
}

const { Title, Text } = Typography;

const HelpModal: React.FC<HelpModalProps> = ({ isHelpModalOpen, onClose }) => {
    const { t } = useTranslation();

    const actionItemsMulti = [
        {
            key: 1,
            icon: <NodeExpandOutlined />,
            title: t("fileBrowser.help.actionItemsMulti.moveSelectedFiles.title"),
            text: t("fileBrowser.help.actionItemsMulti.moveSelectedFiles.text"),
        },
        {
            key: 2,
            icon: <DeleteOutlined />,
            title: t("fileBrowser.help.actionItemsMulti.deleteSelectedFiles.title"),
            text: t("fileBrowser.help.actionItemsMulti.deleteSelectedFiles.text"),
        },
        {
            key: 3,
            icon: <CloudSyncOutlined />,
            title: t("fileBrowser.help.actionItemsMulti.encodeFilesToTAF.title"),
            text: t("fileBrowser.help.actionItemsMulti.encodeFilesToTAF.text"),
        },
    ];

    const actionItems = [
        {
            key: 1,
            icon: <PlayCircleOutlined />,
            title: t("fileBrowser.help.actionItems.playAudioFile.title"),
            text: t("fileBrowser.help.actionItems.playAudioFile.text"),
        },
        {
            key: 2,
            icon: <CloudServerOutlined />,
            title: t("fileBrowser.help.actionItems.migrateToLibraryRoot.title"),
            text: t("fileBrowser.help.actionItems.migrateToLibraryRoot.text"),
        },
        {
            key: 3,
            icon: <TruckOutlined />,
            title: t("fileBrowser.help.actionItems.migrateToAudioIdFolder.title"),
            text: t("fileBrowser.help.actionItems.migrateToAudioIdFolder.text"),
        },
        {
            key: 4,
            icon: <EditOutlined />,
            title: t("fileBrowser.help.actionItems.editTAFMetadata.title"),
            text: t("fileBrowser.help.actionItems.editTAFMetadata.text"),
        },
        {
            key: 5,
            icon: <EditOutlined />,
            title: t("fileBrowser.help.actionItems.editTAPPlaylist.title"),
            text: t("fileBrowser.help.actionItems.editTAPPlaylist.text"),
        },
        {
            key: 6,
            icon: <FormOutlined />,
            title: t("fileBrowser.help.actionItems.renameFile.title"),
            text: t("fileBrowser.help.actionItems.renameFile.text"),
        },
        {
            key: 7,
            icon: <NodeExpandOutlined />,
            title: t("fileBrowser.help.actionItems.moveFile.title"),
            text: t("fileBrowser.help.actionItems.moveFile.text"),
        },
        {
            key: 8,
            icon: <DeleteOutlined />,
            title: t("fileBrowser.help.actionItems.deleteFileFolder.title"),
            text: t("fileBrowser.help.actionItems.deleteFileFolder.text"),
        },
        {
            key: 9,
            icon: <CopyOutlined />,
            title: t("fileBrowser.help.actionItems.duplicateTAPFile.title"),
            text: t("fileBrowser.help.actionItems.duplicateTAPFile.text"),
        },
    ];

    const renderActionItems = (items: typeof actionItems) => (
        <Flex vertical>
            {items.map((item, index) => (
                <div key={item.key}>
                    <Flex gap={8} align="flex-start" style={{ marginTop: 8 }}>
                        <span>{item.icon}</span>
                        <div>
                            <Text strong>{item.title}</Text>
                            <div>{item.text}</div>
                        </div>
                    </Flex>

                    {index < items.length - 1 && <Divider style={{ margin: "8px 0" }} />}
                </div>
            ))}
        </Flex>
    );

    const instructions = [
        {
            key: 1,
            title: t("fileBrowser.help.instructions.openDirectory.title"),
            content: <div>{t("fileBrowser.help.instructions.openDirectory.text")}</div>,
        },
        {
            key: 2,
            title: t("fileBrowser.help.instructions.openTAFViewer.title"),
            content: <div>{t("fileBrowser.help.instructions.openTAFViewer.text")}</div>,
        },
        {
            key: 3,
            title: t("fileBrowser.help.instructions.openTAPJSONViewer.title"),
            content: <div>{t("fileBrowser.help.instructions.openTAPJSONViewer.text")}</div>,
        },
        {
            key: 4,
            title: t("fileBrowser.help.instructions.viewTonieInfoModal.title"),
            content: <div>{t("fileBrowser.help.instructions.viewTonieInfoModal.text")}</div>,
        },
        {
            key: 5,
            title: t("fileBrowser.help.instructions.multiSelection.title"),
            content: (
                <>
                    <div>{t("fileBrowser.help.instructions.multiSelection.text")}</div>
                    {renderActionItems(actionItemsMulti)}
                </>
            ),
        },
        {
            key: 6,
            title: t("fileBrowser.help.instructions.fileActions.title"),
            content: renderActionItems(actionItems),
        },
    ];

    return (
        <Modal
            className="help-viewer"
            width={800}
            title={t("fileBrowser.help.title")}
            open={isHelpModalOpen}
            onOk={onClose}
            onCancel={onClose}
            footer={[
                <Button key="close" type="primary" onClick={onClose}>
                    {t("fileBrowser.help.closeButton")}
                </Button>,
            ]}
        >
            <Flex vertical gap={8}>
                {instructions.map((item, index) => (
                    <div key={item.key}>
                        <Title level={5} style={{ marginTop: 0 }}>
                            {item.title}
                        </Title>
                        {item.content}
                        {index < instructions.length - 1 && <Divider style={{ margin: "16px 0px" }} />}
                    </div>
                ))}
            </Flex>
        </Modal>
    );
};

export default HelpModal;
