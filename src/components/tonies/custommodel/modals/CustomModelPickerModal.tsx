import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, Empty, Input, Modal, Space, Typography, theme } from "antd";
import { PictureOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";

import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../../../api";
import ToniesCustomJsonEditor from "../../ToniesCustomJsonEditor";
import { TonieCardProps } from "../../../../types/tonieTypes";
import { toImageSrc, toPreviewableImageUrl } from "../../common/utils/imagePathUtils";

const api = new TeddyCloudApi(defaultAPIConfig());

type CustomEntry = {
    model: string;
    series: string;
    pic?: string;
    /** Cache-resolved URL for display when tonie_json.cache_images is enabled */
    cachePic?: string;
    title?: string;
};

const normalizeText = (value?: string) => (value || "").trim();
const toModelKey = (model?: string) => normalizeText(model).toLowerCase();

export interface CustomModelPickerModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (model: string) => void;
    initialSelectedModel?: string;
    tonieCardProps?: TonieCardProps;
}

export const CustomModelPickerModal: React.FC<CustomModelPickerModalProps> = ({
    open,
    onClose,
    onSelect,
    initialSelectedModel = "",
    tonieCardProps,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const [entries, setEntries] = useState<CustomEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [showCreateEditor, setShowCreateEditor] = useState(false);

    const loadModels = async () => {
        setLoading(true);
        try {
            const response = await api.apiGetTeddyCloudApiRaw("/api/toniesCustomJson");
            const data = await response.json();
            const list = Array.isArray(data) ? data : [];
            setEntries(list);
        } catch {
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            void loadModels();
            setSearchText("");
        }
    }, [open]);

    const initialKey = toModelKey(initialSelectedModel);
    const filteredEntries = entries.filter((entry) => {
        const q = searchText.trim().toLowerCase();
        if (!q) return true;
        const model = toModelKey(entry.model);
        const series = (entry.series || "").toLowerCase();
        const title = (entry.title || "").toLowerCase();
        return model.includes(q) || series.includes(q) || title.includes(q);
    });

    const handleSelect = (model: string) => {
        const trimmed = model.trim();
        if (trimmed) {
            onSelect(trimmed);
        }
        onClose();
    };

    const handleModelCreated = (model: string) => {
        handleSelect(model);
        setShowCreateEditor(false);
    };

    return (
        <>
            <Modal
                title={t("tonies.customModelPicker.title")}
                open={open && !showCreateEditor}
                onCancel={onClose}
                width={Math.max(Math.min(window.innerWidth * 0.85, 900), 500)}
                footer={null}
                destroyOnClose
            >
                <Space direction="vertical" style={{ width: "100%" }} size="middle">
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Input
                            allowClear
                            placeholder={t("tonies.customModelPicker.searchPlaceholder")}
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ flex: 1, minWidth: 200 }}
                        />
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setShowCreateEditor(true)}
                        >
                            {t("tonies.customModelPicker.addNew")}
                        </Button>
                    </div>

                    {loading ? (
                        <div style={{ padding: 48, textAlign: "center" }}>
                            <Typography.Text type="secondary">
                                {t("tonies.customModelPicker.loading")}
                            </Typography.Text>
                        </div>
                    ) : filteredEntries.length === 0 ? (
                        <Empty
                            description={t("tonies.customModelPicker.noModels")}
                            style={{ padding: 32 }}
                        >
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreateEditor(true)}>
                                {t("tonies.customModelPicker.addNew")}
                            </Button>
                        </Empty>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                                gap: 12,
                                maxHeight: 400,
                                overflowY: "auto",
                            }}
                        >
                            {filteredEntries.map((entry) => {
                                const url = toPreviewableImageUrl(entry.cachePic ?? entry.pic);
                                const isSelected = toModelKey(entry.model) === initialKey;
                                return (
                                    <Card
                                        key={entry.model}
                                        hoverable
                                        size="small"
                                        onClick={() => handleSelect(entry.model)}
                                        style={{
                                            cursor: "pointer",
                                            borderColor: isSelected ? token.colorPrimary : undefined,
                                            borderWidth: isSelected ? 2 : 1,
                                        }}
                                        bodyStyle={{ padding: 8 }}
                                    >
                                        <div
                                            style={{
                                                width: "100%",
                                                aspectRatio: 1,
                                                background: token.colorFillQuaternary,
                                                borderRadius: 4,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                marginBottom: 6,
                                                overflow: "hidden",
                                            }}
                                        >
                                            {url ? (
                                                <img
                                                    src={toImageSrc(url)}
                                                    alt=""
                                                    referrerPolicy="no-referrer"
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                    }}
                                                />
                                            ) : (
                                                <PictureOutlined style={{ fontSize: 24, color: token.colorTextPlaceholder }} />
                                            )}
                                        </div>
                                        <Typography.Text
                                            strong
                                            ellipsis
                                            style={{ display: "block", fontSize: 12 }}
                                        >
                                            {entry.model}
                                        </Typography.Text>
                                        <Typography.Text
                                            type="secondary"
                                            ellipsis
                                            style={{ display: "block", fontSize: 11 }}
                                        >
                                            {entry.series || "—"}
                                        </Typography.Text>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </Space>
            </Modal>

            <ToniesCustomJsonEditor
                open={showCreateEditor}
                onClose={() => setShowCreateEditor(false)}
                tonieCardProps={tonieCardProps}
                startInCreateMode
                onModelCreated={handleModelCreated}
            />
        </>
    );
};
