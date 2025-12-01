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

    const canGoPrev = editIndex !== null && editIndex > 0;
    const canGoNext = editIndex !== null && editIndex < mergedResults.length - 1;

    const handlePrevLabel = () => {
        if (editIndex === null || editIndex <= 0) return;
        setEditIndex(editIndex - 1);
    };

    const handleNextLabel = () => {
        if (editIndex === null || editIndex >= mergedResults.length - 1) return;
        setEditIndex(editIndex + 1);
    };

    const handleSuggestionClick = (dataset: any) => {
        addResult(dataset);
        handleSearch("");
    };

    const handleSaveSettings = () => {
        actions.save();
        addNotification(
            NotificationTypeEnum.Success,
            t("tonies.teddystudio.settingsSavedSuccessful"),
            t("tonies.teddystudio.settingsSavedSuccessful"),
            t("tonies.teddystudio.navigationTitle")
        );
    };

    const handleClearSettings = () => {
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

    const handleSaveLabelElements = (values: {
        text: string;
        episodes: string;
        trackTitles: string[];
        picture: string;
    }) => {
        if (editIndex === null) return;
        editByMergedIndex(editIndex, values.trackTitles, values.episodes, values.text, values.picture);

        addNotification(
            NotificationTypeEnum.Success,
            t("tonies.teddystudio.labelSavedSuccesful"),
            t("tonies.teddystudio.labelSavedSuccesfulDetails", { title: values.text }),
            t("tonies.teddystudio.navigationTitle"),
            undefined,
            false
        );
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
                onSave={handleSaveSettings}
                onClear={handleClearSettings}
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
                settings={settings}
                textColor={textColor}
                onCancel={handleCloseModal}
                onSave={handleSaveLabelElements}
                onPrev={handlePrevLabel}
                onNext={handleNextLabel}
                canGoPrev={canGoPrev}
                canGoNext={canGoNext}
                currentIndex={editIndex ?? undefined}
                totalItems={mergedResults.length}
            />
        </>
    );
};
