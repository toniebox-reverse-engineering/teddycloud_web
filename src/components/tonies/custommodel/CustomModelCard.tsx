import React from "react";
import { useTranslation } from "react-i18next";
import { Card, Popconfirm, theme } from "antd";
import { CopyOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { toImageSrc, toPreviewableImageUrl } from "../common/utils/imagePathUtils";

export interface CustomModelCardEntry {
    model: string;
    series?: string;
    episodes?: string;
    pic?: string;
}

export interface CustomModelCardProps {
    idx: number;
    entry: CustomModelCardEntry;
    gridColumns: number;
    onEdit: (idx: number) => void;
    onDuplicate: (idx: number) => void;
    onDelete: (idx: number) => void;
    onPreviewClick: (url: string) => void;
}

export const CustomModelCard: React.FC<CustomModelCardProps> = ({
    idx,
    entry,
    gridColumns,
    onEdit,
    onDuplicate,
    onDelete,
    onPreviewClick,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const previewUrl = toPreviewableImageUrl(entry.pic);
    return (
        <div
            style={{
                flex: `0 0 calc(${100 / gridColumns}% - 16px)`,
                maxWidth: `calc(${100 / gridColumns}% - 16px)`,
            }}
        >
            <Card
                hoverable={false}
                size="small"
                style={{
                    background: token.colorBgContainerDisabled,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                }}
                title={
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        {entry.series || entry.model || "-"}
                    </div>
                }
                cover={
                    <div
                        style={{ position: "relative" }}
                        onClick={() => {
                            if (previewUrl) onPreviewClick(previewUrl);
                        }}
                    >
                        {previewUrl ? (
                            <img
                                src={toImageSrc(previewUrl)}
                                alt={entry.series || entry.model || ""}
                                style={{ padding: 8, width: "100%" }}
                            />
                        ) : (
                            <img
                                src={toImageSrc("/img_unknown.png")}
                                alt=""
                                style={{ padding: 8, paddingTop: 10, width: "100%" }}
                            />
                        )}
                    </div>
                }
                actions={[
                    <span
                        key="edit"
                        onClick={() => onEdit(idx)}
                        style={{ cursor: "pointer" }}
                        onKeyDown={(e) => e.key === "Enter" && onEdit(idx)}
                        role="button"
                        tabIndex={0}
                        aria-label={t("tonies.customEditor.actions.edit")}
                    >
                        <EditOutlined />
                    </span>,
                    <span
                        key="dup"
                        onClick={() => onDuplicate(idx)}
                        style={{ cursor: "pointer" }}
                        onKeyDown={(e) => e.key === "Enter" && onDuplicate(idx)}
                        role="button"
                        tabIndex={0}
                        aria-label={t("tonies.customEditor.actions.duplicate")}
                    >
                        <CopyOutlined />
                    </span>,
                    <Popconfirm
                        key="del"
                        title={t("tonies.customEditor.deleteConfirm.title")}
                        description={t("tonies.customEditor.deleteConfirm.description", {
                            model: entry.model,
                        })}
                        onConfirm={() => void onDelete(idx)}
                        okText={t("tonies.customEditor.deleteConfirm.confirm")}
                        cancelText={t("tonies.customEditor.deleteConfirm.abort")}
                    >
                        <span
                            style={{ cursor: "pointer", color: token.colorError }}
                            role="button"
                            tabIndex={0}
                            aria-label={t("tonies.customEditor.actions.delete")}
                        >
                            <DeleteOutlined />
                        </span>
                    </Popconfirm>,
                ]}
            >
                {(() => {
                    const metaTitle = (entry.episodes || "").trim() || undefined;
                    const displayName = (entry.series || entry.model || "").trim();
                    const metaDescription =
                        entry.model && entry.model.trim() !== displayName ? entry.model : undefined;
                    if (!metaTitle && !metaDescription) return null;
                    return <Card.Meta title={metaTitle} description={metaDescription} />;
                })()}
            </Card>
        </div>
    );
};
