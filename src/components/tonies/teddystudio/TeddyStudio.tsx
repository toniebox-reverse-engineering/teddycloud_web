import React, { useState } from "react";
import { Button, Divider, Typography, theme } from "antd";
import { ClearOutlined, PrinterOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { useTeddyCloud } from "../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../types/teddyCloudNotificationTypes";

import { useData } from "./hooks/useData";
import { useCustomItems } from "./hooks/useCustomItems";
import { useSettings } from "./hooks/useSettings";
import { SettingsPanel } from "./settingspanel/SettingsPanel";
import { LabelGrid } from "./grid/LabelGrid";
import { ToniesJsonSearchWrapper } from "./input/ToniesJsonSearchWrapper";
import { CustomImages } from "./input/CustomImages";
import { EditLabelModal } from "./modals/EditLabelModal";

const { Paragraph } = Typography;

export const TeddyStudio: React.FC = () => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();

    const { handleSearch } = useData();
    const [editIndex, setEditIndex] = useState<number | null>(null);

    const { customItems, mergedResults, addResult, addCustomImage, removeByMergedIndex, editByMergedIndex, clearAll } =
        useCustomItems();

    const { state: settings, textColor, paperOptions, actions } = useSettings();

    const handleSuggestionClick = (dataset: any) => {
        addResult(dataset);
        handleSearch("");
    };

    const handleSave = () => {
        actions.save();
        addNotification(
            NotificationTypeEnum.Success,
            t("tonies.teddystudio.settingsSavedSuccessful"),
            t("tonies.teddystudio.settingsSavedSuccessful"),
            t("tonies.teddystudio.navigationTitle")
        );
    };

    const handleClear = () => {
        actions.clear();
    };

    const handleRemoveResult = (indexToRemove: number) => {
        removeByMergedIndex(indexToRemove);
    };

    const handleEditResult = (indexToEdit: number) => {
        setEditIndex(indexToEdit);
    };

    const handleCloseModal = () => {
        setEditIndex(null);
    };

    const handleSaveLabelText = (values: {
        text: string;
        episodes: string;
        trackTitles: string[];
        picture: string;
    }) => {
        if (editIndex === null) return;
        editByMergedIndex(editIndex, values.trackTitles, values.episodes, values.text, values.picture);
        setEditIndex(null);
    };

    const currentItem = editIndex !== null ? mergedResults[editIndex] : null;

    return (
        <>
            <h1>{t("tonies.teddystudio.title")}</h1>
            <Paragraph>{t("tonies.teddystudio.intro")}</Paragraph>

            <ToniesJsonSearchWrapper onSelectDataset={addResult} />

            <CustomImages customItems={customItems} onAddImage={addCustomImage} />

            <SettingsPanel
                settings={settings}
                paperOptions={paperOptions}
                actions={actions}
                onPaperSelect={actions.applyPaperPreset}
                onSave={handleSave}
                onClear={handleClear}
            />

            <Divider>{t("tonies.teddystudio.printSheet")}</Divider>

            {mergedResults.length > 0 ? (
                <Paragraph
                    style={{
                        marginBottom: 16,
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                    }}
                >
                    <div>{t("tonies.teddystudio.adaptLabelsHint")}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <Button
                            icon={<ClearOutlined />}
                            onClick={() => {
                                clearAll();
                            }}
                        >
                            {t("tonies.teddystudio.clear")}
                        </Button>
                        <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
                            {t("tonies.teddystudio.printPage")}
                        </Button>
                    </div>
                </Paragraph>
            ) : (
                <Paragraph style={{ marginBottom: 16 }}>{t("tonies.teddystudio.empty")}</Paragraph>
            )}

            <LabelGrid
                mergedResults={mergedResults}
                settings={settings}
                textColor={textColor}
                onRemoveItem={handleRemoveResult}
                onEditItem={handleEditResult}
            />

            <EditLabelModal
                open={editIndex !== null}
                item={currentItem}
                onCancel={handleCloseModal}
                onSave={handleSaveLabelText}
            />
        </>
    );
};
