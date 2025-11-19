import { t } from "i18next";
import { List, Modal, Button, Typography } from "antd";
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

const { Paragraph } = Typography;

interface HelpModalProps {
    isHelpModalOpen: boolean;
    onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isHelpModalOpen, onClose }) => {
    const actionItemsMulti = [
        {
            key: 1,
            avatar: <NodeExpandOutlined />,
            title: t("fileBrowser.help.actionItemsMulti.moveSelectedFiles.title"),
            text: t("fileBrowser.help.actionItemsMulti.moveSelectedFiles.text"),
        },
        {
            key: 2,
            avatar: <DeleteOutlined />,
            title: t("fileBrowser.help.actionItemsMulti.deleteSelectedFiles.title"),
            text: t("fileBrowser.help.actionItemsMulti.deleteSelectedFiles.text"),
        },
        {
            key: 3,
            avatar: <CloudSyncOutlined />,
            title: t("fileBrowser.help.actionItemsMulti.encodeFilesToTAF.title"),
            text: t("fileBrowser.help.actionItemsMulti.encodeFilesToTAF.text"),
        },
    ];

    const actionItems = [
        {
            key: 1,
            avatar: <PlayCircleOutlined />,
            title: t("fileBrowser.help.actionItems.playAudioFile.title"),
            text: t("fileBrowser.help.actionItems.playAudioFile.text"),
        },
        {
            key: 2,
            avatar: <CloudServerOutlined />,
            title: t("fileBrowser.help.actionItems.migrateToLibraryRoot.title"),
            text: t("fileBrowser.help.actionItems.migrateToLibraryRoot.text"),
        },
        {
            key: 3,
            avatar: <TruckOutlined />,
            title: t("fileBrowser.help.actionItems.migrateToAudioIdFolder.title"),
            text: t("fileBrowser.help.actionItems.migrateToAudioIdFolder.text"),
        },
        {
            key: 4,
            avatar: <EditOutlined />,
            title: t("fileBrowser.help.actionItems.editTAFMetadata.title"),
            text: t("fileBrowser.help.actionItems.editTAFMetadata.text"),
        },
        {
            key: 5,
            avatar: <EditOutlined />,
            title: t("fileBrowser.help.actionItems.editTAPPlaylist.title"),
            text: t("fileBrowser.help.actionItems.editTAPPlaylist.text"),
        },
        {
            key: 6,
            avatar: <FormOutlined />,
            title: t("fileBrowser.help.actionItems.renameFile.title"),
            text: t("fileBrowser.help.actionItems.renameFile.text"),
        },
        {
            key: 7,
            avatar: <NodeExpandOutlined />,
            title: t("fileBrowser.help.actionItems.moveFile.title"),
            text: t("fileBrowser.help.actionItems.moveFile.text"),
        },
        {
            key: 8,
            avatar: <DeleteOutlined />,
            title: t("fileBrowser.help.actionItems.deleteFileFolder.title"),
            text: t("fileBrowser.help.actionItems.deleteFileFolder.text"),
        },
        {
            key: 9,
            avatar: <CopyOutlined />,
            title: t("fileBrowser.help.actionItems.duplicateTAPFile.title"),
            text: t("fileBrowser.help.actionItems.duplicateTAPFile.text"),
        },
    ];

    const instructions = [
        {
            key: 1,
            title: t("fileBrowser.help.instructions.openDirectory.title"),
            text: t("fileBrowser.help.instructions.openDirectory.text"),
        },
        {
            key: 2,
            title: t("fileBrowser.help.instructions.openTAFViewer.title"),
            text: t("fileBrowser.help.instructions.openTAFViewer.text"),
        },
        {
            key: 3,
            title: t("fileBrowser.help.instructions.openTAPJSONViewer.title"),
            text: t("fileBrowser.help.instructions.openTAPJSONViewer.text"),
        },
        {
            key: 4,
            title: t("fileBrowser.help.instructions.viewTonieInfoModal.title"),
            text: t("fileBrowser.help.instructions.viewTonieInfoModal.text"),
        },
        {
            key: 5,
            title: t("fileBrowser.help.instructions.multiSelection.title"),
            text: (
                <>
                    {t("fileBrowser.help.instructions.multiSelection.text")}
                    <List
                        size="small"
                        dataSource={actionItemsMulti}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta avatar={item.avatar} title={item.title} description={item.text} />
                            </List.Item>
                        )}
                    />
                </>
            ),
        },
        {
            key: 6,
            title: t("fileBrowser.help.instructions.fileActions.title"),
            description: (
                <List
                    size="small"
                    dataSource={actionItems}
                    renderItem={(item) => (
                        <List.Item>
                            <List.Item.Meta avatar={item.avatar} title={item.title} description={item.text} />
                        </List.Item>
                    )}
                />
            ),
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
            <List
                size="small"
                dataSource={instructions}
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
        </Modal>
    );
};

export default HelpModal;
