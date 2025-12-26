import React, { useEffect } from "react";
import { Button, theme, Typography } from "antd";
import { ClearOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";

import { LanguageFlagIcon } from "../../../common/icons/LanguageFlagIcon";
import type { SettingsState } from "../hooks/useSettings";
import "./../styles/print.css";
import { useTranslation } from "react-i18next";
import { CircleText } from "../elements/CircleText";
import { buildEffectiveSettings, LabelOverridesById } from "../types/labelOverrides";
import { getContrastTextColor, mmToPx } from "../../../../utils/helper";

const { Paragraph } = Typography;

export interface LabelGridProps {
    mergedResults: any[];
    settings: SettingsState;
    previewMode?: boolean;
    onRemoveItem?: (index: number) => void;
    onEditItem?: (index: number) => void;

    labelOverridesById?: LabelOverridesById;
    onClearLocalOverrides?: (id: string) => void;
}

export const LabelGrid: React.FC<LabelGridProps> = ({
    mergedResults,
    settings,
    previewMode = false,
    onRemoveItem,
    onEditItem,
    labelOverridesById,
    onClearLocalOverrides,
}) => {
    const { token } = theme.useToken();
    const { t } = useTranslation();

    const {
        labelShape,
        diameter,
        width,
        height,
        labelSpacingX,
        labelSpacingY,
        printMode,
        showLabelBorder,
        paperSize,
        customPaperWidth,
        customPaperHeight,
        paperMarginTop,
        paperMarginLeft,
        paperLabelImageBleed,
    } = settings;

    useEffect(() => {
        const root = document.documentElement;
        const paperSizeValue = paperSize === "Custom" ? `${customPaperWidth} ${customPaperHeight}` : paperSize;

        root.style.setProperty("--paper-size", paperSizeValue);
        root.style.setProperty("--paper-margin-top", paperMarginTop);
        root.style.setProperty("--paper-margin-left", paperMarginLeft);
    }, [paperSize, customPaperWidth, customPaperHeight, paperMarginTop, paperMarginLeft]);

    return (
        <div
            id="resultContainer"
            style={{
                display: "flex",
                flexWrap: "wrap",
                gap: `${labelSpacingY} ${labelSpacingX}`,

                ["--labelElement-width" as any]:
                    labelShape === "square" ? `${parseFloat(width)}mm` : `${parseFloat(diameter)}mm`,
                ["--labelElement-height" as any]:
                    labelShape === "square" ? `${parseFloat(height)}mm` : `${parseFloat(diameter)}mm`,
                ["--labelElement-radius" as any]: labelShape === "square" ? "0" : "50%",

                ["--paper-label-image-bleed" as any]: paperLabelImageBleed,

                ["--label-border-width" as any]: showLabelBorder ? "1px" : "0",
                ["--traveltonie-border-color" as any]: token.colorBorderSecondary,
            }}
        >
            {mergedResults.map((dataset: any, index: number) => {
                const id = dataset.id ?? String(index);

                const localOverride = labelOverridesById?.[id];
                const hasLocalOverrides = !!localOverride && Object.keys(localOverride).length > 0;

                const effectiveSettings = buildEffectiveSettings(settings, localOverride);

                const {
                    labelBackgroundColor,
                    textFontSize,
                    imagePosition,
                    showLanguageFlag,
                    showModelNo,
                    showSeriesOnImageLabel,
                    seriesOnImageLabelRotationDeg,
                    seriesOnImageLabelFontSize,
                    printTrackListInsteadTitle,
                    contentPadding,
                } = effectiveSettings;

                const effectiveTextColor = getContrastTextColor(labelBackgroundColor || "#ffffff");

                return (
                    <div
                        key={id}
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: `${labelSpacingY} ${labelSpacingX}`,
                            justifyContent: previewMode ? "center" : "unset",
                            flexDirection: "row",
                            padding: 10,
                            ["--label-border-color" as any]: effectiveTextColor,
                            ["--text-color" as any]: effectiveTextColor,
                        }}
                        className="traveltonieCouple"
                    >
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {previewMode && (
                                <Paragraph type="secondary" style={{ marginBottom: 0, height: 40, width: "100%" }}>
                                    {t("tonies.teddystudio.labelImagePreview")}:
                                </Paragraph>
                            )}

                            <div
                                className="labelElement imageLabel"
                                style={{
                                    display:
                                        printMode === "ImageAndText" || printMode === "OnlyImage" ? "flex" : "none",
                                    ["--label-background-color" as any]: labelBackgroundColor,
                                    ["--image-position" as any]: imagePosition,
                                    ["--text-font-size" as any]: textFontSize !== "" ? textFontSize : "14px",
                                }}
                            >
                                <div className="labelBg" />

                                <div className="labelImageBleed">
                                    <img className="labelImage" src={dataset.pic} alt="" />
                                </div>

                                <div className="labelClip">
                                    {showSeriesOnImageLabel && (
                                        <div className="labelOverlay">
                                            {labelShape == "round" ? (
                                                <CircleText
                                                    text={dataset.text}
                                                    size={150}
                                                    fontSize={parseFloat(seriesOnImageLabelFontSize || textFontSize)}
                                                    rotateDeg={seriesOnImageLabelRotationDeg || 0}
                                                    color={effectiveTextColor}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        height: "100%",
                                                        width: "100%",
                                                        overflow: "hidden",
                                                        whiteSpace: "nowrap",
                                                        fontSize: parseFloat(
                                                            seriesOnImageLabelFontSize || textFontSize
                                                        ),
                                                        minWidth: 0,
                                                        color: effectiveTextColor,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        padding: 4,
                                                    }}
                                                >
                                                    {dataset.text}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {(!printTrackListInsteadTitle || previewMode) && (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {previewMode && (
                                    <Paragraph type="secondary" style={{ marginBottom: 0, height: 40, width: "100%" }}>
                                        {t("tonies.teddystudio.labelTitle")}:
                                    </Paragraph>
                                )}

                                <div
                                    className={`labelElement ${labelShape === "round" ? "roundFade" : "squareFade"}`}
                                    style={{
                                        display:
                                            printMode === "ImageAndText" || printMode === "OnlyText" ? "flex" : "none",
                                        fontSize: textFontSize,
                                        color: effectiveTextColor,
                                        ["--label-background-color" as any]: labelBackgroundColor,
                                        ["--image-position" as any]: imagePosition,
                                        ["--text-font-size" as any]: textFontSize !== "" ? textFontSize : "14px",
                                    }}
                                >
                                    <div className="labelTintBleed" />

                                    <div className="labelClip" />

                                    <div className="labelContentBleed" style={{ padding: contentPadding }}>
                                        <div
                                            style={{
                                                color: effectiveTextColor,
                                                padding: "4px 8px 8px 8px",
                                                width: "100%",
                                                height: "100%",
                                                boxSizing: "border-box",
                                                textAlign: "center",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: "smaller",
                                                    height: 12,
                                                    marginTop: 2 + mmToPx(parseFloat(paperLabelImageBleed)),
                                                }}
                                            >
                                                {showLanguageFlag && dataset.language ? (
                                                    <LanguageFlagIcon
                                                        name={dataset.language.toUpperCase().split("-")[1]}
                                                        height={textFontSize}
                                                    />
                                                ) : (
                                                    "   "
                                                )}
                                            </div>

                                            <div style={{ display: "flex", gap: 4, flexDirection: "column" }}>
                                                {dataset.series && (
                                                    <div style={{ fontWeight: "bold" }}>{dataset.series}</div>
                                                )}
                                                {dataset.text && (
                                                    <div
                                                        style={{
                                                            whiteSpace: "pre-wrap",
                                                            wordBreak: "break-word",
                                                        }}
                                                    >
                                                        {dataset.text}
                                                    </div>
                                                )}
                                                {dataset.episodes && <div>{dataset.episodes}</div>}
                                            </div>

                                            <div style={{ fontSize: "smaller", height: 12, marginBottom: 4 }}>
                                                {showModelNo ? dataset.model : "   "}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(printTrackListInsteadTitle || previewMode) && (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {previewMode && (
                                    <Paragraph type="secondary" style={{ marginBottom: 0, height: 40, width: "100%" }}>
                                        {t("tonies.teddystudio.labelTracklist")}:
                                    </Paragraph>
                                )}

                                <div
                                    className={`labelElement ${labelShape === "round" ? "roundFade" : "squareFade"}`}
                                    style={{
                                        display:
                                            printMode === "ImageAndText" || printMode === "OnlyText" ? "flex" : "none",
                                        fontSize: textFontSize,
                                        color: effectiveTextColor,
                                        textAlign: "center",
                                        ["--label-background-color" as any]: labelBackgroundColor,
                                        ["--image-position" as any]: imagePosition,
                                        ["--text-font-size" as any]: textFontSize !== "" ? textFontSize : "14px",
                                    }}
                                >
                                    <div className="labelTintBleed" />

                                    <div className="labelClip" />

                                    <div className="labelContentBleed" style={{ padding: contentPadding }}>
                                        <div
                                            style={{
                                                color: effectiveTextColor,
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                textAlign: "center",
                                                width: "100%",
                                                height: "100%",
                                                padding: "4px 8px 8px 8px",
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                                {dataset.trackTitles.join("\n")}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!previewMode && (onRemoveItem || onEditItem || onClearLocalOverrides) && (
                            <div className="control" style={{ display: "flex", gap: 8, margin: "8px 8px 0 8px" }}>
                                {onEditItem && (
                                    <Button
                                        className="editButton"
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() => onEditItem(index)}
                                    />
                                )}
                                {onClearLocalOverrides && (
                                    <Button
                                        className="clearOverridesButton"
                                        size="small"
                                        icon={<ClearOutlined />}
                                        disabled={!hasLocalOverrides}
                                        onClick={() => onClearLocalOverrides(id)}
                                    />
                                )}
                                {onRemoveItem && (
                                    <Button
                                        className="deleteButton"
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={() => onRemoveItem(index)}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
