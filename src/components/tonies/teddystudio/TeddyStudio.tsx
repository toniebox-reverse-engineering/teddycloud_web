import React from "react";
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

const { Paragraph } = Typography;

export const TeddyStudio: React.FC = () => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const { addNotification } = useTeddyCloud();

    const { searchTerm, autocompleteList, handleSearch } = useData();

    const {
        customItems,
        mergedResults,
        addResult,
        addCustomImage,
        updateCustomText,
        removeCustomItem,
        removeByMergedIndex,
        clearAll,
    } = useCustomItems();

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

    return (
        <>
            <h1>{t("tonies.teddystudio.title")}</h1>
            <Paragraph>{t("tonies.teddystudio.intro")}</Paragraph>

            <ToniesJsonSearchWrapper onSelectDataset={addResult} />

            <CustomImages
                customItems={customItems}
                onTextChange={updateCustomText}
                onRemoveItem={removeCustomItem}
                onAddImage={addCustomImage}
            />

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
                <Paragraph style={{ marginBottom: 16 }}>
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
            />
        </>
    );
};
