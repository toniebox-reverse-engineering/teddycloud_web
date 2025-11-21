// TeddyStudio/grid/TeddyLabelGrid.tsx
import React, { useEffect } from "react";
import { Button, theme } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

import { LanguageFlagIcon } from "../../../../utils/languageUtil";
import type { SettingsState } from "../hooks/useSettings";
import "./../styles/print.css";

export interface LabelGridProps {
    mergedResults: any[];
    settings: SettingsState;
    textColor: string;
    onRemoveItem: (index: number) => void;
}

export const LabelGrid: React.FC<LabelGridProps> = ({ mergedResults, settings, textColor, onRemoveItem }) => {
    const { token } = theme.useToken();

    const {
        labelShape,
        diameter,
        width,
        height,
        labelSpacingX,
        labelSpacingY,
        textFontSize,
        printMode,
        labelBackgroundColor,
        showLanguageFlag,
        showModelNo,
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
            }}
        >
            {mergedResults.map((dataset: any, index: number) => (
                <div
                    key={index}
                    style={{ display: "flex", flexWrap: "wrap", gap: `${labelSpacingY} ${labelSpacingX}` }}
                    className="traveltonieCouple"
                >
                    <div
                        className="labelElement"
                        style={{
                            display: printMode === "ImageAndText" || printMode === "OnlyImage" ? "flex" : "none",
                            ["--label-bg-image" as any]: `url("${dataset.pic}")`,
                        }}
                    />
                    <div
                        className="labelElement"
                        style={{
                            display: printMode === "ImageAndText" || printMode === "OnlyText" ? "flex" : "none",
                            justifyContent: "space-between",
                            fontSize: textFontSize,
                            padding: "4px 8px 8px 8px",
                            flexDirection: "column",
                            color: `${textColor}`,
                        }}
                    >
                        <div style={{ height: 12 }}>
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
                            <div style={{ fontWeight: "bold" }}>{dataset.series}</div>
                            <div
                                style={{
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                }}
                            >
                                {dataset.text}
                            </div>
                            <div>{dataset.episodes}</div>
                        </div>
                        <div style={{ fontSize: "smaller", height: 12, marginBottom: 4 }}>
                            {showModelNo ? dataset.model : "   "}
                        </div>
                    </div>
                    <Button
                        className="deleteButton"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => onRemoveItem(index)}
                        style={{ margin: "8px 8px 0 8px" }}
                    />
                </div>
            ))}
        </div>
    );
};
