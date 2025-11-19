import { t } from "i18next";
import { List, Modal, Button } from "antd";
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

const HelpModal: React.FC<HelpModalProps> = ({ isHelpModalOpen, onClose }) => {
    const infoIconActions = [
        {
            key: 1,
            title: t("tonies.help.actionItems.infoIcon.valid.title"),
            text: t("tonies.help.actionItems.infoIcon.valid.text"),
            description: t("tonies.help.actionItems.infoIcon.valid.description"),
        },
        {
            key: 2,
            title: t("tonies.help.actionItems.infoIcon.exists.title"),
            text: t("tonies.help.actionItems.infoIcon.exists.text"),
            description: t("tonies.help.actionItems.infoIcon.exists.description"),
        },
        {
            key: 3,
            title: t("tonies.help.actionItems.infoIcon.download.title"),
            text: t("tonies.help.actionItems.infoIcon.download.text"),
            description: t("tonies.help.actionItems.infoIcon.download.description"),
        },
        {
            key: 4,
            title: t("tonies.help.actionItems.infoIcon.hide.title"),
            text: t("tonies.help.actionItems.infoIcon.hide.text"),
            description: t("tonies.help.actionItems.infoIcon.hide.description"),
        },
    ];

    const editIconActions = [
        {
            key: 1,
            title: t("tonies.help.actionItems.editIcon.source.title"),
            text: t("tonies.help.actionItems.editIcon.source.text"),
            description: t("tonies.help.actionItems.editIcon.source.description"),
        },
        {
            key: 2,
            title: t("tonies.help.actionItems.editIcon.radioStreamSearch.title"),
            text: t("tonies.help.actionItems.editIcon.radioStreamSearch.text"),
            description: t("tonies.help.actionItems.editIcon.radioStreamSearch.description"),
        },
        {
            key: 3,
            title: t("tonies.help.actionItems.editIcon.model.title"),
            text: t("tonies.help.actionItems.editIcon.model.text"),
            description: t("tonies.help.actionItems.editIcon.model.description"),
        },
        {
            key: 4,
            title: t("tonies.help.actionItems.editIcon.createNewModel.title"),
            text: t("tonies.help.actionItems.editIcon.createNewModel.text"),
            description: t("tonies.help.actionItems.editIcon.createNewModel.description"),
        },
    ];

    const modelImage = [
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
    const tonieCardItems = [
        {
            key: 1,
            title: t("tonies.help.modelImage.title"),
            text: (
                <>
                    {t("tonies.help.modelImage.text")}
                    <List
                        size="small"
                        dataSource={modelImage}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    title={item.title}
                                    description={
                                        <>
                                            <div>{item.text}</div>
                                            {item.description && <div>{item.description}</div>}
                                        </>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </>
            ),
        },
        {
            key: 2,
            title: t("tonies.help.blueTopBorder.title"),
            text: t("tonies.help.blueTopBorder.text"),
        },
        {
            key: 3,
            avatar: <InfoCircleOutlined />,
            title: t("tonies.help.actionItems.infoIcon.title"),
            text: (
                <>
                    {t("tonies.help.actionItems.infoIcon.text")}
                    <List
                        size="small"
                        dataSource={infoIconActions}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    title={item.title}
                                    description={
                                        <>
                                            <div>{item.text}</div>
                                            {item.description && <div>{item.description}</div>}
                                        </>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </>
            ),
        },
        {
            key: 4,
            avatar: <EditOutlined />,
            title: t("tonies.help.actionItems.editIcon.title"),
            text: (
                <>
                    {t("tonies.help.actionItems.editIcon.text")}
                    <List
                        size="small"
                        dataSource={editIconActions}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    title={item.title}
                                    description={
                                        <>
                                            <div>{item.text}</div>
                                            {item.description && <div>{item.description}</div>}
                                        </>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </>
            ),
        },
        {
            key: 5,
            avatar: <DownloadOutlined />,
            title: t("tonies.help.actionItems.downloadIcon.title"),
            text: t("tonies.help.actionItems.downloadIcon.text"),
        },
        {
            key: 6,
            avatar: <PlayCircleOutlined />,
            title: t("tonies.help.actionItems.playIcon.title"),
            text: t("tonies.help.actionItems.playIcon.text"),
        },
        {
            key: 7,
            avatar: <CloudSyncOutlined />,
            title: t("tonies.help.actionItems.cloudIcon.title"),
            text: t("tonies.help.actionItems.cloudIcon.text"),
        },
        {
            key: 8,
            avatar: <RetweetOutlined />,
            title: t("tonies.help.actionItems.liveIcon.title"),
            text: t("tonies.help.actionItems.liveIcon.text"),
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
            <List
                size="small"
                dataSource={tonieCardItems}
                renderItem={(item) => (
                    <List.Item>
                        <List.Item.Meta avatar={item.avatar} title={item.title} description={item.text} />
                    </List.Item>
                )}
            />
        </Modal>
    );
};

export default HelpModal;
