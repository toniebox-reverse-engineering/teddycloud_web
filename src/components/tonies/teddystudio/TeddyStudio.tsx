import React, { useState } from "react";
import { Button, Collapse, Divider, Typography } from "antd";
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
import { LabelOverridesById, LabelOverrides } from "./types/labelOverrides";

const { Paragraph } = Typography;

export const TeddyStudio: React.FC = () => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();

    const { handleSearch } = useData();
    const [editIndex, setEditIndex] = useState<number | null>(null);

    const { customItems, mergedResults, addResult, addCustomImage, removeByMergedIndex, editByMergedIndex, clearAll } =
        useCustomItems();

    const settingsStore = useSettings();

    const { state: settings, paperOptions, actions } = settingsStore;

    const [labelOverridesById, setLabelOverridesById] = useState<LabelOverridesById>({});

    const setLabelOverride = (id: string, patch: LabelOverrides) => {
        setLabelOverridesById((prev) => ({
            ...prev,
            [id]: { ...(prev[id] ?? {}), ...patch },
        }));
    };

    const clearLabelOverride = (id: string) => {
        setLabelOverridesById((prev) => {
            const { [id]: _removed, ...rest } = prev;
            return rest;
        });
    };

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

    const labelSettingsSummary = `${
        settings.labelShape === "round"
            ? `${t("tonies.teddystudio.round")} ${settings.diameter}`
            : `${settings.width} x ${settings.height}`
    }`;

    const printModeSummary = t(
        `tonies.teddystudio.printMode${settings.printMode.charAt(0).toUpperCase() + settings.printMode.slice(1)}`
    );

    const paperSizeSummary =
        settings.paperSize === "Custom"
            ? `${settings.paperSize} (${settings.customPaperWidth} x ${settings.customPaperHeight})`
            : settings.paperSize;

    return (
        <>
            <h1>{t("tonies.teddystudio.title")}</h1>
            <Paragraph>{t("tonies.teddystudio.intro")}</Paragraph>

            <ToniesJsonSearchWrapper onSelectDataset={addResult} />

            <CustomImages customItems={customItems} onAddImage={addCustomImage} />

            <Collapse
                className="settingsPanel"
                bordered={false}
                items={[
                    {
                        key: "1",
                        label: `${t("tonies.teddystudio.settings")}: ${labelSettingsSummary} | ${t(
                            "tonies.teddystudio.printMode"
                        )}: ${printModeSummary} | ${t("tonies.teddystudio.paperSize")}: ${paperSizeSummary}`,
                        children: [
                            <SettingsPanel
                                settings={settings}
                                paperOptions={paperOptions}
                                actions={actions}
                                onPaperSelect={actions.applyPaperPreset}
                                onSave={handleSaveSettings}
                                onClear={handleClearSettings}
                            />,
                        ],
                    },
                ]}
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
                onRemoveItem={handleRemoveResult}
                onEditItem={handleEditResult}
                labelOverridesById={labelOverridesById}
                onClearLocalOverrides={(id) => clearLabelOverride(id)}
            />

            <EditLabelModal
                open={editIndex !== null}
                item={currentItem}
                onCancel={handleCloseModal}
                onSave={handleSaveLabelElements}
                onPrev={handlePrevLabel}
                onNext={handleNextLabel}
                canGoPrev={canGoPrev}
                canGoNext={canGoNext}
                currentIndex={editIndex ?? undefined}
                totalItems={mergedResults.length}
                settingsStore={settingsStore}
                labelOverridesById={labelOverridesById}
                setLabelOverride={setLabelOverride}
                clearLabelOverride={clearLabelOverride}
            />
        </>
    );
};
