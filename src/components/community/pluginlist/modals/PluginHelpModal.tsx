import { Modal, List, Typography, Button } from "antd";
import { useTranslation } from "react-i18next";
import CodeSnippet from "../../../common/elements/CodeSnippet";
import PluginTemplateDownloadButton from "../../../common/buttons/PluginTemplateDownloadButton";

const { Paragraph } = Typography;

interface PluginHelpModalProps {
    open: boolean;
    onClose: () => void;
}

export const PluginHelpModal: React.FC<PluginHelpModalProps> = ({ open, onClose }) => {
    const { t } = useTranslation();

    const fields: [string, string][] = [
        ["pluginName", t("community.plugins.help.fields.pluginName")],
        ["description", t("community.plugins.help.fields.description")],
        ["author", t("community.plugins.help.fields.author")],
        ["version", t("community.plugins.help.fields.version")],
        ["pluginHomepage", t("community.plugins.help.fields.pluginHomepage")],
        ["teddyCloudSection", t("community.plugins.help.fields.teddyCloudSection")],
        ["icon", t("community.plugins.help.fields.icon")],
    ];

    return (
        <Modal
            width="auto"
            open={open}
            title={t("community.plugins.help.popoverTitle")}
            onCancel={onClose}
            footer={[
                <PluginTemplateDownloadButton key="template" />,
                <Button key="ok" onClick={onClose}>
                    {t("community.plugins.ok")}
                </Button>,
            ]}
        >
            <Paragraph>
                <strong>{t("community.plugins.help.title")}</strong>
                <Paragraph>{t("community.plugins.help.intro")}</Paragraph>

                <strong>{t("community.plugins.help.folderStructureTitle")}</strong>
                <CodeSnippet
                    language="plain"
                    code={`your-plugin-name/
    ├── plugin.json
    ├── index.html
    ├── preview.png
    └── (other plugin files)`}
                />

                <strong>{t("community.plugins.help.descriptionTitle")}</strong>
                <Paragraph>{t("community.plugins.help.descriptionIntro")}</Paragraph>

                <strong>{t("community.plugins.help.exampleTitle")}</strong>
                <CodeSnippet
                    language="json"
                    code={`{
  "pluginName": "Awesome Plugin",
  "description": "A short summary of what this plugin does.",
  "author": "Authors name",
  "version": "Version of the plugin",
  "pluginHomepage": "Homepage of the plugin",
  "teddyCloudSection": "tonies",
  "icon": "TrophyOutlined"
}`}
                />

                <strong>{t("community.plugins.help.fieldsTitle")}</strong>
                <List
                    size="small"
                    dataSource={fields}
                    renderItem={([field, desc]) => (
                        <List.Item>
                            <strong>{field}</strong>: {desc}
                        </List.Item>
                    )}
                />
            </Paragraph>
        </Modal>
    );
};
