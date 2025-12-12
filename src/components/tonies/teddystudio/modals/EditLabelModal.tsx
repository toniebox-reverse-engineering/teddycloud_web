import React, { useEffect, useMemo, useState } from "react";
import { Modal, Input, Form, Upload, Typography, Col, Row, Button } from "antd";
import { ArrowLeftOutlined, ArrowRightOutlined, InboxOutlined } from "@ant-design/icons";
import { MergedItem } from "../hooks/useCustomItems";
import { useTranslation } from "react-i18next";
import { LabelGrid } from "../grid/LabelGrid";
import Checkbox from "antd/es/checkbox/Checkbox";
import { LabelOverridesById, LabelOverrides, buildEffectiveSettings } from "../types/labelOverrides";
import { LocalOverrideSettings } from "../settingspanel/LocalOverridesSettingsPanel";

const { TextArea } = Input;
const { Dragger } = Upload;
const { Paragraph } = Typography;

type SettingsStore = ReturnType<typeof import("../hooks/useSettings").useSettings>;

interface EditLabelModalProps {
    open: boolean;
    item: MergedItem | null;
    onCancel: () => void;
    onSave: (values: { text: string; episodes: string; trackTitles: string[]; picture: string }) => void;
    onPrev?: () => void;
    onNext?: () => void;
    canGoPrev?: boolean;
    canGoNext?: boolean;
    currentIndex?: number;
    totalItems?: number;

    settingsStore: SettingsStore;

    labelOverridesById: LabelOverridesById;
    setLabelOverride: (id: string, patch: LabelOverrides) => void;
    clearLabelOverride: (id: string) => void;
}

export const EditLabelModal: React.FC<EditLabelModalProps> = ({
    open,
    item,
    onCancel,
    onSave,
    onPrev,
    onNext,
    canGoPrev = false,
    canGoNext = false,
    currentIndex,
    totalItems,

    settingsStore,
    labelOverridesById,
    setLabelOverride,
    clearLabelOverride,
}) => {
    const { t } = useTranslation();

    const [text, setText] = useState("");
    const [episodes, setEpisodes] = useState("");
    const [trackTitlesText, setTrackTitlesText] = useState("");

    const [originalPicture, setOriginalPicture] = useState("");
    const [picture, setPicture] = useState("");

    const [saveOnNavigate, setSaveOnNavigate] = useState<boolean>(true);

    const { state: settings } = settingsStore;

    const itemId = item?.id;
    const localOverride = (itemId ? labelOverridesById[itemId] : undefined) ?? {};
    const effectiveSettingsForPreview = useMemo(
        () => buildEffectiveSettings(settings, itemId ? labelOverridesById[itemId] : undefined),
        [settings, itemId, labelOverridesById]
    );

    useEffect(() => {
        if (!item) {
            setText("");
            setEpisodes("");
            setTrackTitlesText("");
            setOriginalPicture("");
            setPicture("");
            return;
        }

        setText(item.text ?? "");
        setEpisodes(item.episodes ?? "");
        setTrackTitlesText((item.trackTitles ?? []).join("\n"));

        const pic = (item as any).pic ?? "";
        setOriginalPicture(pic);
        setPicture(pic);
    }, [item]);

    const hasChanges = () => {
        if (!item) return false;

        const normalizedTrackTitles = trackTitlesText
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0);

        const originalTrackTitles = (item.trackTitles ?? []).map((l) => l.trim()).filter((l) => l.length > 0);

        return (
            text !== (item.text ?? "") ||
            episodes !== (item.episodes ?? "") ||
            picture !== originalPicture ||
            JSON.stringify(normalizedTrackTitles) !== JSON.stringify(originalTrackTitles)
        );
    };

    const handleOk = () => {
        const trackTitles = trackTitlesText
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        onSave({
            text,
            episodes,
            trackTitles,
            picture,
        });
    };

    const handleNext = () => {
        if (saveOnNavigate && hasChanges()) handleOk();
        onNext?.();
    };

    const handlePrev = () => {
        if (saveOnNavigate && hasChanges()) handleOk();
        onPrev?.();
    };

    const mergedPreviewItem = {
        ...item,
        id: item?.id, // wichtig: ID behalten
        text,
        episodes,
        pic: picture,
        trackTitles: trackTitlesText
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0),
    };

    const handleFileToDataUrl = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => setPicture(reader.result as string);
        reader.readAsDataURL(file);
    };

    return (
        <Modal
            open={open}
            width="80%"
            style={{ maxWidth: 900 }}
            title={t("tonies.teddystudio.labelEditTitle")}
            okText={t("tonies.teddystudio.save")}
            cancelText={t("tonies.teddystudio.cancel")}
            onCancel={onCancel}
            footer={
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                    }}
                >
                    <Checkbox
                        key="saveOnNavigate"
                        checked={saveOnNavigate}
                        onChange={(e) => setSaveOnNavigate(e.target.checked)}
                        style={{ marginRight: "auto" }}
                    >
                        {t("tonies.teddystudio.saveOnNavigate")}
                    </Checkbox>

                    <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 8 }}>
                        <Button key="prev" onClick={handlePrev} disabled={!canGoPrev}>
                            <ArrowLeftOutlined />
                        </Button>
                        <Button key="cancel" onClick={onCancel}>
                            {t("tonies.teddystudio.cancel")}
                        </Button>
                        <Button key="close" onClick={onCancel}>
                            {t("tonies.teddystudio.close")}
                        </Button>
                        <Button key="save" type="primary" onClick={handleOk} disabled={!hasChanges()}>
                            {t("tonies.teddystudio.save")}
                        </Button>
                        <Button key="next" onClick={handleNext} disabled={!canGoNext}>
                            <ArrowRightOutlined />
                        </Button>
                    </div>
                </div>
            }
        >
            <Row gutter={[8, 8]}>
                <Col xs={24} md={24} lg={Number(settings.width.replace("mm", "")) > 60 ? 24 : 16}>
                    <Form layout="vertical">
                        <Form.Item label={t("tonies.teddystudio.labelImage")}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <Dragger
                                    name="file"
                                    multiple={false}
                                    showUploadList={false}
                                    accept="image/*"
                                    beforeUpload={(file) => {
                                        handleFileToDataUrl(file);
                                        return false;
                                    }}
                                    style={{ padding: 8 }}
                                >
                                    <p className="ant-upload-drag-icon">
                                        {picture ? (
                                            <img
                                                src={picture}
                                                alt="preview"
                                                style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 16 }}
                                            />
                                        ) : (
                                            <InboxOutlined />
                                        )}
                                    </p>
                                    <p className="ant-upload-text">{t("tonies.teddystudio.replaceLabelImage")}</p>
                                </Dragger>
                            </div>
                        </Form.Item>

                        <Form.Item label={t("tonies.teddystudio.series")}>
                            <Input value={text} onChange={(e) => setText(e.target.value)} />
                        </Form.Item>

                        <Form.Item label={t("tonies.teddystudio.episodes")}>
                            <Input value={episodes} onChange={(e) => setEpisodes(e.target.value)} />
                        </Form.Item>

                        <Form.Item label={t("tonies.teddystudio.trackTitles")}>
                            <TextArea
                                rows={8}
                                value={trackTitlesText}
                                onChange={(e) => setTrackTitlesText(e.target.value)}
                            />
                        </Form.Item>
                    </Form>

                    {itemId && (
                        <LocalOverrideSettings
                            itemId={itemId}
                            localOverride={localOverride}
                            settings={settings}
                            setLabelOverride={setLabelOverride}
                            clearLabelOverride={clearLabelOverride}
                        />
                    )}
                </Col>

                <Col
                    xs={24}
                    md={24}
                    lg={Number(settings.width.replace("mm", "")) > 60 ? 24 : 8}
                    style={{ overflowX: "auto" }}
                >
                    <div className="resultcontainer">
                        <Paragraph style={{ width: "100" }}>{t("tonies.teddystudio.preview")}:</Paragraph>

                        <LabelGrid
                            mergedResults={[mergedPreviewItem]}
                            settings={effectiveSettingsForPreview}
                            previewMode={true}
                            labelOverridesById={labelOverridesById}
                            onClearLocalOverrides={(id) => clearLabelOverride(id)}
                        />
                    </div>
                </Col>
            </Row>
        </Modal>
    );
};
