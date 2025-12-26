import React from "react";
import { Button, Collapse, ColorPicker, Input, Select, Switch } from "antd";
import { stripUnit } from "../../../../utils/helper";
import { LabelOverrides } from "../types/labelOverrides";
import { SettingsState } from "../hooks/useSettings";
import { useTranslation } from "react-i18next";
import { ClearOutlined } from "@ant-design/icons";

interface LocalOverrideSettingsProps {
    itemId: string;
    localOverride: LabelOverrides;
    settings: SettingsState;
    setLabelOverride: (id: string, patch: LabelOverrides) => void;
    clearLabelOverride: (id: string) => void;
}

export const LocalOverrideSettings: React.FC<LocalOverrideSettingsProps> = ({
    itemId,
    localOverride,
    settings,
    setLabelOverride,
    clearLabelOverride,
}) => {
    const { t } = useTranslation();
    const showSeriesOnImageLabel = localOverride.showSeriesOnImageLabel ?? settings.showSeriesOnImageLabel;
    const hasLocalOverrides = !!localOverride && Object.keys(localOverride).length > 0;
    return (
        <Collapse
            style={{ marginTop: 12 }}
            items={[
                {
                    key: "local",
                    label: (
                        <div style={{ display: "flex", width: "100%", justifyContent: "space-between", gap: 8 }}>
                            {t("tonies.teddystudio.labelSettings")} ({t("tonies.teddystudio.currentLabel")})
                            <Button
                                className="clearOverridesButton"
                                size="small"
                                icon={<ClearOutlined />}
                                disabled={!hasLocalOverrides}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearLabelOverride(itemId);
                                }}
                            />
                        </div>
                    ),
                    children: (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                                    gap: 8,
                                }}
                            >
                                <div>
                                    <div>{t("tonies.teddystudio.labelBackgroundColor")}</div>
                                    <ColorPicker
                                        value={localOverride.labelBackgroundColor ?? settings.labelBackgroundColor}
                                        onChange={(_, hex) => setLabelOverride(itemId, { labelBackgroundColor: hex })}
                                        showText
                                        disabledAlpha
                                        disabledFormat
                                        format="hex"
                                    />
                                </div>

                                <div>
                                    <div>{t("tonies.teddystudio.imagePosition")}</div>
                                    <Select
                                        value={localOverride.imagePosition ?? settings.imagePosition ?? "center"}
                                        onChange={(v) => setLabelOverride(itemId, { imagePosition: v })}
                                        options={[
                                            { value: "center", label: "center" },
                                            { value: "top", label: "top" },
                                            { value: "bottom", label: "bottom" },
                                            { value: "left", label: "left" },
                                            { value: "right", label: "right" },
                                            { value: "top left", label: "top left" },
                                            { value: "top right", label: "top right" },
                                            { value: "bottom left", label: "bottom left" },
                                            { value: "bottom right", label: "bottom right" },
                                        ]}
                                    />
                                </div>

                                <div>
                                    <div>{t("tonies.teddystudio.showLanguageFlag")}</div>
                                    <Switch
                                        checked={localOverride.showLanguageFlag ?? settings.showLanguageFlag}
                                        onChange={(checked) => setLabelOverride(itemId, { showLanguageFlag: checked })}
                                    />
                                </div>

                                <div>
                                    <div>{t("tonies.teddystudio.showModelNo")}</div>
                                    <Switch
                                        checked={localOverride.showModelNo ?? settings.showModelNo}
                                        onChange={(checked) => setLabelOverride(itemId, { showModelNo: checked })}
                                    />
                                </div>

                                <div>
                                    <div>{t("tonies.teddystudio.textFontSize")}</div>
                                    <Input
                                        size="small"
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={parseFloat(
                                            (localOverride.textFontSize ?? settings.textFontSize) || "12"
                                        )}
                                        onChange={(e) => {
                                            const val = stripUnit(e.target.value, "px");
                                            if (!isNaN(Number(val)) && Number(val) >= 0) {
                                                setLabelOverride(itemId, { textFontSize: `${Number(val || 0)}px` });
                                            }
                                        }}
                                        suffix="px"
                                        style={{ width: 100 }}
                                    />
                                </div>

                                <div>
                                    <div>{t("tonies.teddystudio.showSeriesOnImageLabel")}</div>
                                    <Switch
                                        checked={showSeriesOnImageLabel}
                                        onChange={(checked) =>
                                            setLabelOverride(itemId, { showSeriesOnImageLabel: checked })
                                        }
                                    />
                                </div>

                                {showSeriesOnImageLabel && (
                                    <div>
                                        <div>{t("tonies.teddystudio.seriesOnImageLabelRotationDeg")}</div>
                                        <Input
                                            size="small"
                                            type="number"
                                            step={15}
                                            min={0}
                                            max={360}
                                            value={
                                                (localOverride.seriesOnImageLabelRotationDeg ??
                                                    settings.seriesOnImageLabelRotationDeg) ||
                                                0
                                            }
                                            onChange={(e) => {
                                                const val = stripUnit(e.target.value, "°");
                                                if (!isNaN(Number(val)) && Number(val) >= 0) {
                                                    setLabelOverride(itemId, {
                                                        seriesOnImageLabelRotationDeg: Number(val) || 0,
                                                    });
                                                }
                                            }}
                                            suffix="°"
                                            style={{ width: 100 }}
                                        />
                                    </div>
                                )}

                                {showSeriesOnImageLabel && (
                                    <div>
                                        <div>{t("tonies.teddystudio.seriesOnImageLabelFontSize")}</div>
                                        <Input
                                            size="small"
                                            type="number"
                                            min={1}
                                            max={20}
                                            value={parseFloat(
                                                (localOverride.seriesOnImageLabelFontSize ??
                                                    settings.seriesOnImageLabelFontSize) ||
                                                    "12"
                                            )}
                                            onChange={(e) => {
                                                const val = stripUnit(e.target.value, "px");
                                                if (!isNaN(Number(val)) && Number(val) >= 0) {
                                                    setLabelOverride(itemId, {
                                                        seriesOnImageLabelFontSize: `${Number(val || 0)}px`,
                                                    });
                                                }
                                            }}
                                            suffix="px"
                                            style={{ width: 100 }}
                                        />
                                    </div>
                                )}

                                <div>
                                    <div>{t("tonies.teddystudio.printTrackListInsteadTitle")}</div>
                                    <Switch
                                        checked={
                                            localOverride.printTrackListInsteadTitle ??
                                            settings.printTrackListInsteadTitle
                                        }
                                        onChange={(checked) =>
                                            setLabelOverride(itemId, { printTrackListInsteadTitle: checked })
                                        }
                                    />
                                </div>

                                <div>
                                    <div>{t("tonies.teddystudio.contentPadding")}</div>
                                    <Input
                                        size="small"
                                        type="number"
                                        min={1}
                                        max={
                                            settings.width && settings.height
                                                ? Math.min(parseFloat(settings.width), parseFloat(settings.height)) / 3
                                                : 100
                                        }
                                        value={parseFloat(localOverride.contentPadding ?? settings.contentPadding)}
                                        onChange={(e) => {
                                            const val = stripUnit(e.target.value, "mm");
                                            if (!isNaN(Number(val)) && Number(val) >= 0) {
                                                setLabelOverride(itemId, { contentPadding: `${Number(val || 0)}mm` });
                                            }
                                        }}
                                        suffix="mm"
                                        style={{ width: 100 }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: 8, alignItems: "end", justifyContent: "flex-end" }}>
                                <Button onClick={() => clearLabelOverride(itemId)}>
                                    {t("tonies.teddystudio.restoreCommonSettings")}
                                </Button>
                            </div>
                        </div>
                    ),
                },
            ]}
        />
    );
};
