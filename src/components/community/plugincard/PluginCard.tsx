import { Card, Typography, Badge, Tooltip, theme, Tag } from "antd";
import { DesktopOutlined, HomeOutlined, DeleteOutlined, TagFilled } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { canHover } from "../../../utils/browser/browserUtils";
import { withBase } from "../../../utils/basePath";

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

export const PluginCard: React.FC<PluginCardProps> = ({
    plugin,
    onOpen,
    onOpenHomepage,
    onDelete,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();

    const sectionLabel = plugin.teddyCloudSection
        ? plugin.teddyCloudSection.charAt(0).toUpperCase() + plugin.teddyCloudSection.slice(1)
        : "";

    const titleContent = plugin.teddyCloudSection ? (
        <Badge.Ribbon placement="start" text={sectionLabel} style={{ marginLeft: 8 }}>
            <div
                style={{
                    paddingTop: 28,
                    width: "auto",
                    minWidth: 0,
                    overflow: "hidden",
                }}
            >
                <h3
                    style={{
                        margin: 0,
                        marginLeft: 12,
                        width: "calc(100%-16px)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {plugin.pluginName}
                </h3>
            </div>
        </Badge.Ribbon>
    ) : (
        <h3
            style={{
                margin: 0,
                paddingTop: 28,
                marginLeft: 12,
                width: "calc(100%-8px)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
            }}
        >
            {plugin.pluginName}
        </h3>
    );

    return (
        <Card
            hoverable={false}
            size="small"
            key={plugin.pluginId}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 0,
                borderRadius: 8,
                background: token.colorBgContainerDisabled,
                display: "flex",
                flexDirection: "column",
            }}
            styles={{
                body: {
                    flex: 1,
                },
            }}
            title={
                <div
                    style={{
                        width: "100%",
                        minWidth: 0,
                        overflow: "hidden",
                    }}
                >
                    {titleContent}
                </div>
            }
            actions={[
                <Tooltip
                    open={!canHover ? false : undefined}
                    title={t("community.plugins.open")}
                    key="details"
                >
                    <DesktopOutlined
                        style={{ cursor: "pointer" }}
                        onClick={() => onOpen(plugin.pluginId)}
                    />
                </Tooltip>,
                plugin.pluginHomepage && (
                    <Tooltip
                        open={!canHover ? false : undefined}
                        title={t("community.plugins.visitHomepage")}
                        key="homepage"
                    >
                        <HomeOutlined
                            style={{ cursor: "pointer" }}
                            onClick={() => onOpenHomepage(plugin.pluginHomepage!)}
                        />
                    </Tooltip>
                ),
                <Tooltip
                    open={!canHover ? false : undefined}
                    title={t("community.plugins.delete")}
                    key="delete"
                >
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
                src={withBase(`/plugins/${plugin.pluginId}/preview.png`)}
                onError={(e) => {
                    e.currentTarget.style.display = "none";
                }}
            />
            {plugin.hideInNav && (
                <Paragraph style={{ textAlign: "center" }}>
                    <Tag color="warning" variant="filled" style={{ marginTop: 8 }}>
                        {t("community.plugins.hidden")}
                    </Tag>
                </Paragraph>
            )}
            <Paragraph type="secondary" style={{ marginBottom: 8 }}>
                {plugin.author && `${t("community.plugins.by")} ${plugin.author}`}
                {plugin.version && ` - v${plugin.version}`}
            </Paragraph>
            {plugin.description && (
                <Paragraph style={{ marginBottom: 8 }}>{plugin.description}</Paragraph>
            )}
        </Card>
    );
};
