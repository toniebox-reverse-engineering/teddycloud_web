import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Button, Flex, Typography, Divider } from "antd";
import {
    CloudSyncOutlined,
    PlayCircleOutlined,
    EditOutlined,
    InfoCircleOutlined,
    DownloadOutlined,
    RetweetOutlined,
} from "@ant-design/icons";

interface HelpModalProps {
    isHelpModalOpen: boolean;
    onClose: () => void;
}

const { Title, Text } = Typography;

const HelpModal: React.FC<HelpModalProps> = ({ isHelpModalOpen, onClose }) => {
    const { t } = useTranslation();

    const modelImageItems = [
        {
            key: 1,
            title: t("tonies.help.modelImage.bigImage.title"),
            text: t("tonies.help.modelImage.bigImage.text"),
            description: t("tonies.help.modelImage.bigImage.description"),
        },
        {
            key: 2,
            title: t("tonies.help.modelImage.smallImage.title"),
            text: t("tonies.help.modelImage.smallImage.text"),
            description: t("tonies.help.modelImage.smallImage.description"),
        },
    ];

    const infoIconActions = [
        {
            key: 1,
            icon: <InfoCircleOutlined />,
            title: t("tonies.help.actionItems.infoIcon.valid.title"),
            text: t("tonies.help.actionItems.infoIcon.valid.text"),
            description: t("tonies.help.actionItems.infoIcon.valid.description"),
        },
        {
            key: 2,
            icon: <InfoCircleOutlined />,
            title: t("tonies.help.actionItems.infoIcon.exists.title"),
            text: t("tonies.help.actionItems.infoIcon.exists.text"),
            description: t("tonies.help.actionItems.infoIcon.exists.description"),
        },
        {
            key: 3,
            icon: <DownloadOutlined />,
            title: t("tonies.help.actionItems.infoIcon.download.title"),
            text: t("tonies.help.actionItems.infoIcon.download.text"),
            description: t("tonies.help.actionItems.infoIcon.download.description"),
        },
        {
            key: 4,
            icon: <RetweetOutlined />,
            title: t("tonies.help.actionItems.infoIcon.hide.title"),
            text: t("tonies.help.actionItems.infoIcon.hide.text"),
            description: t("tonies.help.actionItems.infoIcon.hide.description"),
        },
    ];

    const editIconActions = [
        {
            key: 1,
            icon: <EditOutlined />,
            title: t("tonies.help.actionItems.editIcon.source.title"),
            text: t("tonies.help.actionItems.editIcon.source.text"),
            description: t("tonies.help.actionItems.editIcon.source.description"),
        },
        {
            key: 2,
            icon: <EditOutlined />,
            title: t("tonies.help.actionItems.editIcon.radioStreamSearch.title"),
            text: t("tonies.help.actionItems.editIcon.radioStreamSearch.text"),
            description: t("tonies.help.actionItems.editIcon.radioStreamSearch.description"),
        },
        {
            key: 3,
            icon: <EditOutlined />,
            title: t("tonies.help.actionItems.editIcon.model.title"),
            text: t("tonies.help.actionItems.editIcon.model.text"),
            description: t("tonies.help.actionItems.editIcon.model.description"),
        },
        {
            key: 4,
            icon: <EditOutlined />,
            title: t("tonies.help.actionItems.editIcon.createNewModel.title"),
            text: t("tonies.help.actionItems.editIcon.createNewModel.text"),
            description: t("tonies.help.actionItems.editIcon.createNewModel.description"),
        },
    ];

    const renderSubItems = (items: typeof modelImageItems | typeof infoIconActions | typeof editIconActions) => (
        <Flex vertical>
            {items.map((item, index) => (
                <div key={item.key}>
                    <Flex gap={8} align="flex-start" style={{ marginTop: 8 }}>
                        {"icon" in item && item.icon && <span style={{ marginTop: 4 }}>{item.icon}</span>}
                        <div>
                            <Text strong>{item.title}</Text>
                            <div>{item.text}</div>
                            {item.description && <div>{item.description}</div>}
                        </div>
                    </Flex>
                    {index < items.length - 1 && <Divider style={{ margin: "8px 0" }} />}
                </div>
            ))}
        </Flex>
    );

    const sections = [
        {
            key: 1,
            icon: null,
            title: t("tonies.help.modelImage.title"),
            content: (
                <>
                    <div>{t("tonies.help.modelImage.text")}</div>
                    {renderSubItems(modelImageItems)}
                </>
            ),
        },
        {
            key: 2,
            icon: null,
            title: t("tonies.help.blueTopBorder.title"),
            content: <div>{t("tonies.help.blueTopBorder.text")}</div>,
        },
        {
            key: 3,
            icon: <InfoCircleOutlined />,
            title: t("tonies.help.actionItems.infoIcon.title"),
            content: (
                <>
                    <div style={{ marginBottom: 4 }}>{t("tonies.help.actionItems.infoIcon.text")}</div>
                    {renderSubItems(infoIconActions)}
                </>
            ),
        },
        {
            key: 4,
            icon: <EditOutlined />,
            title: t("tonies.help.actionItems.editIcon.title"),
            content: (
                <>
                    <div style={{ marginBottom: 4 }}>{t("tonies.help.actionItems.editIcon.text")}</div>
                    {renderSubItems(editIconActions)}
                </>
            ),
        },
        {
            key: 5,
            icon: <DownloadOutlined />,
            title: t("tonies.help.actionItems.downloadIcon.title"),
            content: <div>{t("tonies.help.actionItems.downloadIcon.text")}</div>,
        },
        {
            key: 6,
            icon: <PlayCircleOutlined />,
            title: t("tonies.help.actionItems.playIcon.title"),
            content: <div>{t("tonies.help.actionItems.playIcon.text")}</div>,
        },
        {
            key: 7,
            icon: <CloudSyncOutlined />,
            title: t("tonies.help.actionItems.cloudIcon.title"),
            content: <div>{t("tonies.help.actionItems.cloudIcon.text")}</div>,
        },
        {
            key: 8,
            icon: <RetweetOutlined />,
            title: t("tonies.help.actionItems.liveIcon.title"),
            content: <div>{t("tonies.help.actionItems.liveIcon.text")}</div>,
        },
    ];

    return (
        <Modal
            className="help-viewer"
            width={800}
            title={t("tonies.help.title")}
            open={isHelpModalOpen}
            onOk={onClose}
            onCancel={onClose}
            footer={[
                <Button key="close" type="primary" onClick={onClose}>
                    {t("tonies.help.closeButton")}
                </Button>,
            ]}
        >
            <Flex vertical gap={8}>
                {sections.map((section, index) => (
                    <div key={section.key}>
                        <Flex gap={8} align="center">
                            {section.icon && <span>{section.icon}</span>}
                            <Title level={5} style={{ margin: 0 }}>
                                {section.title}
                            </Title>
                        </Flex>
                        <div style={{ marginTop: 8 }}>{section.content}</div>
                        {index < sections.length - 1 && <Divider style={{ margin: "16px 0" }} />}
                    </div>
                ))}
            </Flex>
        </Modal>
    );
};

export default HelpModal;
