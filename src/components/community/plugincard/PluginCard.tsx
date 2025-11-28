import { Card, Typography, Badge, Tooltip, theme } from "antd";
import { DesktopOutlined, HomeOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Paragraph } = Typography;
const { useToken } = theme;

export interface TeddyCloudPlugin {
    pluginId: string;
    pluginName: string;
    description?: string;
    author?: string;
    version?: string;
    teddyCloudSection?: string;
    pluginHomepage?: string;
    [key: string]: any;
}

interface PluginCardProps {
    plugin: TeddyCloudPlugin;
    onOpen: (pluginId: string) => void;
    onOpenHomepage: (url: string) => void;
    onDelete: (pluginId: string) => void;
}

export const PluginCard: React.FC<PluginCardProps> = ({ plugin, onOpen, onOpenHomepage, onDelete }) => {
    const { t } = useTranslation();
    const { token } = useToken();

    const sectionLabel = plugin.teddyCloudSection
        ? plugin.teddyCloudSection.charAt(0).toUpperCase() + plugin.teddyCloudSection.slice(1)
        : "";

    const titleContent = plugin.teddyCloudSection ? (
        <Badge.Ribbon placement="start" text={sectionLabel} style={{ marginLeft: 8 }}>
            <div style={{ marginTop: 28, marginLeft: 16 }}>
                <h3>
                    <strong>{plugin.pluginName}</strong>
                </h3>
            </div>
        </Badge.Ribbon>
    ) : (
        <h3>
            <strong>{plugin.pluginName}</strong>
        </h3>
    );

    return (
        <Card
            hoverable={false}
            size="small"
            key={plugin.pluginId}
            style={{
                width: "100%",
                margin: 8,
                borderRadius: 8,
                background: token.colorBgContainerDisabled,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
            }}
            title={
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: 100,
                    }}
                >
                    {titleContent}
                </div>
            }
            actions={[
                <Tooltip title={t("community.plugins.open")} key="details">
                    <DesktopOutlined style={{ cursor: "pointer" }} onClick={() => onOpen(plugin.pluginId)} />
                </Tooltip>,
                plugin.pluginHomepage && (
                    <Tooltip title={t("community.plugins.visitHomepage")} key="homepage">
                        <HomeOutlined
                            style={{ cursor: "pointer" }}
                            onClick={() => onOpenHomepage(plugin.pluginHomepage!)}
                        />
                    </Tooltip>
                ),
                <Tooltip title={t("community.plugins.delete")} key="delete">
                    <DeleteOutlined
                        style={{ cursor: "pointer", color: token.colorError }}
                        onClick={() => onDelete(plugin.pluginId)}
                    />
                </Tooltip>,
            ]}
        >
            <img
                style={{
                    maxHeight: 180,
                    maxWidth: "100%",
                    width: "auto",
                    height: "auto",
                    borderRadius: 0,
                }}
                alt={`${plugin.pluginName} preview`}
                src={`/web/plugins/${plugin.pluginId}/preview.png`}
                onError={(e) => {
                    e.currentTarget.style.display = "none";
                }}
            />
            <Paragraph type="secondary" style={{ marginBottom: 8 }}>
                {plugin.author && `${t("community.plugins.by")} ${plugin.author}`}
                {plugin.version && ` - v${plugin.version}`}
            </Paragraph>
            {plugin.description && <Paragraph style={{ marginBottom: 8 }}>{plugin.description}</Paragraph>}
        </Card>
    );
};
