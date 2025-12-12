import React, { useEffect } from "react";
import { Button, theme, Typography } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

import { LanguageFlagIcon } from "../../../common/icons/LanguageFlagIcon";
import type { SettingsState } from "../hooks/useSettings";
import "./../styles/print.css";
import { useTranslation } from "react-i18next";
import { CircleText } from "../elements/CircleText";
import { SquareTextLabel } from "../elements/SquareTextLabel";
import { mmToPx } from "../../../../utils/helper";

const { Paragraph } = Typography;

export interface LabelGridProps {
    mergedResults: any[];
    settings: SettingsState;
    textColor: string;
    previewMode?: boolean;
    onRemoveItem?: (index: number) => void;
    onEditItem?: (index: number) => void;
}

export const LabelGrid: React.FC<LabelGridProps> = ({
    mergedResults,
    settings,
    textColor,
    previewMode = false,
    onRemoveItem,
    onEditItem,
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
        textFontSize,
        imagePosition,
        printMode,
        labelBackgroundColor,
        showLanguageFlag,
        showModelNo,
        showSeriesOnImageLabel,
        seriesOnImageLabelRotationDeg,
        seriesOnImageLabelFontSize,
        printTrackListInsteadTitle,
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
                ["--text-font-size" as any]: textFontSize !== "" ? textFontSize : "14px",
                ["--paper-label-image-bleed" as any]: paperLabelImageBleed,
                ["--label-background-color" as any]: labelBackgroundColor,
                ["--label-border-width" as any]: showLabelBorder ? "1px" : "0",
                ["--label-border-color" as any]: textColor,
                ["--traveltonie-border-color" as any]: token.colorBorderSecondary,
                ["--image-position" as any]: imagePosition,
            }}
        >
            {mergedResults.map((dataset: any, index: number) => (
                <div
                    key={index}
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: previewMode ? 4 : `${labelSpacingY} ${labelSpacingX}`,
                        justifyContent: previewMode ? "center" : "unset",
                        flexDirection: "row",
                        padding: 10,
                    }}
                    className="traveltonieCouple"
                >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {previewMode && (
                            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                                {t("tonies.teddystudio.labelImagePreview")}:
                            </Paragraph>
                        )}
                        <div
                            className="labelElement"
                            style={{
                                display: printMode === "ImageAndText" || printMode === "OnlyImage" ? "flex" : "none",
                                ["--label-bg-image" as any]: `url("${dataset.pic}")`,
                            }}
                        >
                            {labelShape == "round" && showSeriesOnImageLabel && (
                                <CircleText
                                    text={dataset.text}
                                    size={mmToPx(parseFloat(diameter))}
                                    fontSize={parseFloat(seriesOnImageLabelFontSize)}
                                    minFontSize={6}
                                    color={textColor}
                                    rotateDeg={seriesOnImageLabelRotationDeg}
                                />
                            )}
                            {labelShape == "square" && showSeriesOnImageLabel && (
                                <SquareTextLabel
                                    text={dataset.text}
                                    color={textColor}
                                    maxFontSizePx={parseFloat(seriesOnImageLabelFontSize)}
                                    minFontSizePx={6}
                                />
                            )}
                        </div>
                    </div>
                    {(!printTrackListInsteadTitle || previewMode) && (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {previewMode && (
                                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                                    {t("tonies.teddystudio.labelTitle")}:
                                </Paragraph>
                            )}
                            <div
                                className="labelElement"
                                style={{
                                    display: printMode === "ImageAndText" || printMode === "OnlyText" ? "flex" : "none",
                                    fontSize: textFontSize,
                                    color: textColor,
                                }}
                            >
                                <div
                                    className="labelElementText"
                                    style={{
                                        display:
                                            printMode === "ImageAndText" || printMode === "OnlyText" ? "flex" : "none",
                                        justifyContent: "space-between",
                                        fontSize: textFontSize,
                                        flexDirection: "column",
                                        color: `${textColor}`,
                                        overflow: "hidden",
                                    }}
                                >
                                    <div style={{ fontSize: "smaller", height: 12, marginTop: 4 }}>
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
                                        {dataset.series && <div style={{ fontWeight: "bold" }}>{dataset.series}</div>}
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
                    )}
                    {(printTrackListInsteadTitle || previewMode) && (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {previewMode && (
                                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                                    {t("tonies.teddystudio.labelTracklist")}:
                                </Paragraph>
                            )}
                            <div
                                className="labelElement"
                                style={{
                                    display: printMode === "ImageAndText" || printMode === "OnlyText" ? "flex" : "none",
                                    fontSize: textFontSize,
                                    color: textColor,
                                }}
                            >
                                <div
                                    className="labelElementText"
                                    style={{
                                        display:
                                            printMode === "ImageAndText" || printMode === "OnlyText" ? "flex" : "none",
                                        fontSize: textFontSize,
                                        padding: "4px 8px 8px 8px",
                                        flexDirection: "column",
                                        color: `${textColor}`,
                                        overflow: "hidden",
                                    }}
                                >
                                    <div style={{ display: "flex", gap: 4, flexDirection: "column" }}>
                                        <div
                                            style={{
                                                whiteSpace: "pre-wrap",
                                                wordBreak: "break-word",
                                            }}
                                        >
                                            {dataset.trackTitles.join("\n")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {(onRemoveItem || onEditItem) && (
                        <div className="control" style={{ display: "flex", gap: 8, margin: "8px 8px 0 8px" }}>
                            {onEditItem && (
                                <Button
                                    className="editButton"
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => onEditItem(index)}
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
            ))}
        </div>
    );
};
function useAutoFitFontSize(arg0: { text: any; maxFontSize: number; minFontSize: number }): {
    ref: any;
    fontSize: any;
} {
    throw new Error("Function not implemented.");
}
