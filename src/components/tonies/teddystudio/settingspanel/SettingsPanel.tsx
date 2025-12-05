import React from "react";
import { Button, Card, Checkbox, Collapse, ColorPicker, Input, Radio, Select, Tooltip, Typography } from "antd";
import { ClearOutlined, CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { LabelShape, PaperSize, PrintMode, SettingsActions, SettingsState } from "../hooks/useSettings";

const { Paragraph } = Typography;

export const stripUnit = (value: string, unit: string) =>
    value.toLowerCase().endsWith(unit) ? value.slice(0, -unit.length) : value;

export interface SettingsPanelProps {
    settings: SettingsState;
    paperOptions: { label: string; value: string }[];
    actions: SettingsActions;
    onPaperSelect: (value: string) => void;
    onSave: () => void;
    onClear: () => void;
    onClose?: () => void;
    inModal?: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    settings,
    paperOptions,
    actions,
    onPaperSelect,
    onSave,
    onClear,
    onClose,
    inModal = false,
}) => {
    const { t } = useTranslation();

    const {
        labelShape,
        diameter,
        width,
        height,
        labelSpacingX,
        labelSpacingY,
        labelBackgroundColor,
        printMode,
        textFontSize,
        imagePosition,
        showLanguageFlag,
        showModelNo,
        printTrackListInsteadTitle,
        showLabelBorder,
        paperSize,
        customPaperWidth,
        customPaperHeight,
        paperMarginTop,
        paperMarginLeft,
        paperLabelImageBleed,
        selectedPaper,
    } = settings;

    const handleLabelShapeChange = (e: any) => {
        actions.setLabelShape(e.target.value as LabelShape);
        actions.setSelectedPaper(undefined);
    };

    const handleDiameterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(rawValue)) && Number(rawValue) > 0) {
            actions.setDiameter(`${rawValue}mm`);
        } else {
            actions.setDiameter("");
        }
        actions.setSelectedPaper(undefined);
    };

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(rawValue)) && Number(rawValue) > 0) {
            actions.setWidth(`${rawValue}mm`);
        } else {
            actions.setWidth("");
        }
        actions.setSelectedPaper(undefined);
    };

    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(rawValue)) && Number(rawValue) > 0) {
            actions.setHeight(`${rawValue}mm`);
        } else {
            actions.setHeight("");
        }
        actions.setSelectedPaper(undefined);
    };

    const handleSpacingChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(rawValue)) && Number(rawValue) >= 0) {
            setter(`${rawValue}mm`);
            (parseFloat(paperLabelImageBleed) || 0) * 2 > Number(rawValue) &&
                actions.setPaperLabelImageBleed(`${Number(rawValue) / 2}mm`);
        } else {
            setter("");
        }

        actions.setSelectedPaper(undefined);
    };

    const handlePaperSizeChange = (e: any) => {
        actions.setPaperSize(e.target.value as PaperSize);
        actions.setSelectedPaper(undefined);
    };

    const handleCustomPaperWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(val)) && Number(val) > 0) actions.setCustomPaperWidth(`${val}mm`);
        actions.setSelectedPaper(undefined);
    };

    const handleCustomPaperHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(val)) && Number(val) > 0) actions.setCustomPaperHeight(`${val}mm`);
        actions.setSelectedPaper(undefined);
    };

    const handlePaperMarginTopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(val)) && Number(val) >= 0) actions.setPaperMarginTop(`${val}mm`);
        actions.setSelectedPaper(undefined);
    };

    const handlePaperMarginLeftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(val)) && Number(val) >= 0) actions.setPaperMarginLeft(`${val}mm`);
        actions.setSelectedPaper(undefined);
    };

    const handlePaperLabelImageBleedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(val)) && Number(val) >= 0) actions.setPaperLabelImageBleed(`${val}mm`);
    };

    const handleTextFontsizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTextFontsize = e.target.value;
        if (!isNaN(Number(newTextFontsize)) && Number(newTextFontsize) > 0) {
            actions.setTextFontSize(`${newTextFontsize}px`);
        } else {
            actions.setTextFontSize("");
        }
    };

    const handleImagePositionChange = (e: string) => {
        actions.setImagePosition(e);
    };

    return (
        <Paragraph style={{ marginBottom: 0 }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                    flexWrap: "wrap",
                    gap: 8,
                }}
            >
                <h3 style={{ margin: 0 }}>{t("tonies.teddystudio.settings")}</h3>

                <Select
                    className="selectPredefinedPaperOptions"
                    placeholder={t("tonies.teddystudio.selectPredefinedPaperOptions")}
                    value={selectedPaper}
                    onChange={onPaperSelect}
                    options={paperOptions}
                    style={{ maxWidth: 250, marginRight: inModal ? 24 : 0 }}
                />
            </div>

            <Card size="small" title={t("tonies.teddystudio.labelSettings")} style={{ marginBottom: 8 }}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                        gap: 16,
                        marginBottom: 8,
                        alignItems: "end",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "baseline",
                            gap: 4,
                        }}
                    >
                        <label style={{ marginRight: 8 }}>{t("tonies.teddystudio.labelShape")}</label>
                        <Radio.Group
                            size="small"
                            optionType="button"
                            buttonStyle="solid"
                            value={labelShape}
                            onChange={handleLabelShapeChange}
                        >
                            <Radio.Button value="round">{t("tonies.teddystudio.round")}</Radio.Button>
                            <Radio.Button value="square">{t("tonies.teddystudio.square")}</Radio.Button>
                        </Radio.Group>
                    </div>

                    {labelShape === "round" ? (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "baseline",
                                gap: 4,
                            }}
                        >
                            <label style={{ marginRight: 8 }}>{t("tonies.teddystudio.diameter")}</label>
                            <Input
                                size="small"
                                type="number"
                                value={parseFloat(diameter)}
                                onChange={handleDiameterChange}
                                min={1}
                                max={240}
                                style={{ width: 100 }}
                                suffix="mm"
                                placeholder={t("tonies.teddystudio.diameter")}
                            />
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "baseline",
                                gap: 4,
                            }}
                        >
                            <label style={{ marginRight: 8, wordBreak: "keep-all" }}>
                                {t("tonies.teddystudio.labelSize")}
                            </label>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "baseline",
                                    gap: 8,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Input
                                    size="small"
                                    type="number"
                                    value={parseFloat(width)}
                                    onChange={handleWidthChange}
                                    min={1}
                                    max={240}
                                    style={{ width: 100 }}
                                    suffix="mm"
                                    placeholder={t("tonies.teddystudio.width")}
                                />
                                <Input
                                    size="small"
                                    type="number"
                                    value={parseFloat(height)}
                                    onChange={handleHeightChange}
                                    min={1}
                                    max={240}
                                    style={{ width: 100 }}
                                    suffix="mm"
                                    placeholder={t("tonies.teddystudio.height")}
                                />
                            </div>
                        </div>
                    )}

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "baseline",
                            gap: 4,
                        }}
                    >
                        <label style={{ marginRight: 8, wordBreak: "keep-all" }}>
                            {t("tonies.teddystudio.labelSpacing")} X/Y
                        </label>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: 8,
                                flexWrap: "wrap",
                            }}
                        >
                            <Input
                                size="small"
                                type="number"
                                value={parseFloat(labelSpacingX)}
                                onChange={handleSpacingChange(actions.setLabelSpacingX)}
                                min={0}
                                max={100}
                                style={{ width: 100 }}
                                suffix="mm"
                                placeholder={t("tonies.teddystudio.labelSpacingX")}
                            />
                            <Input
                                size="small"
                                type="number"
                                value={parseFloat(labelSpacingY)}
                                onChange={handleSpacingChange(actions.setLabelSpacingY)}
                                min={0}
                                max={100}
                                style={{ width: 100 }}
                                suffix="mm"
                                placeholder={t("tonies.teddystudio.labelSpacingY")}
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "baseline",
                            gap: 4,
                        }}
                    >
                        <label style={{ marginRight: 8 }}>{t("tonies.teddystudio.labelBackgroundColor")}</label>
                        <ColorPicker
                            size="small"
                            value={labelBackgroundColor}
                            onChange={(_, hex) => actions.setLabelBackgroundColor(hex)}
                            showText
                            disabledAlpha
                            disabledFormat
                            format="hex"
                        />
                    </div>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                        gap: 16,
                        alignItems: "end",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "baseline",
                            gap: 4,
                        }}
                    >
                        <label style={{ marginRight: 8 }}>{t("tonies.teddystudio.printMode")}</label>
                        <Radio.Group
                            size="small"
                            value={printMode}
                            onChange={(e) => actions.setPrintMode(e.target.value as PrintMode)}
                            optionType="button"
                            buttonStyle="solid"
                        >
                            <Radio.Button value="ImageAndText">
                                <Tooltip title={t("tonies.teddystudio.printModeImageAndTextTooltip")}>
                                    {t("tonies.teddystudio.printModeImageAndText")}
                                </Tooltip>
                            </Radio.Button>
                            <Radio.Button value="OnlyImage">
                                <Tooltip title={t("tonies.teddystudio.printModeOnlyImageTooltip")}>
                                    {t("tonies.teddystudio.printModeOnlyImage")}
                                </Tooltip>
                            </Radio.Button>
                            <Radio.Button value="OnlyText">
                                <Tooltip title={t("tonies.teddystudio.printModeOnlyTextTooltip")}>
                                    {t("tonies.teddystudio.printModeOnlyText")}
                                </Tooltip>
                            </Radio.Button>
                        </Radio.Group>
                    </div>
                    {printMode !== "OnlyText" && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "baseline",
                                gap: 4,
                            }}
                        >
                            <label style={{ marginRight: 8 }}>{t("tonies.teddystudio.imagePosition")}</label>
                            <Select
                                size="small"
                                value={imagePosition || "center"}
                                onChange={handleImagePositionChange}
                                style={{ width: 150 }}
                                placeholder={t("tonies.teddystudio.imagePosition")}
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
                    )}
                    {printMode !== "OnlyImage" && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "baseline",
                                gap: 4,
                            }}
                        >
                            <label style={{ marginRight: 8 }}>{t("tonies.teddystudio.textFontSize")}</label>
                            <Input
                                size="small"
                                type="number"
                                value={parseFloat(textFontSize)}
                                onChange={handleTextFontsizeChange}
                                min={1}
                                max={90}
                                style={{ width: 100 }}
                                suffix="px"
                                placeholder={t("tonies.teddystudio.textFontSize")}
                            />
                        </div>
                    )}

                    {printMode !== "OnlyImage" && (
                        <Checkbox
                            style={{ display: "flex", alignItems: "center" }}
                            checked={showLanguageFlag}
                            onChange={(e) => actions.setShowLanguageFlag(e.target.checked)}
                        >
                            {t("tonies.teddystudio.showLanguageFlag")}
                        </Checkbox>
                    )}

                    {printMode !== "OnlyImage" && (
                        <Checkbox
                            style={{ display: "flex", alignItems: "center" }}
                            checked={showModelNo}
                            onChange={(e) => actions.setShowModelNo(e.target.checked)}
                        >
                            {t("tonies.teddystudio.showModelNo")}
                        </Checkbox>
                    )}
                    {printMode !== "OnlyImage" && (
                        <Checkbox
                            style={{ display: "flex", alignItems: "center" }}
                            checked={printTrackListInsteadTitle}
                            onChange={(e) => actions.setPrintTrackListInsteadTitle(e.target.checked)}
                        >
                            {t("tonies.teddystudio.printTrackListInsteadTitle")}
                        </Checkbox>
                    )}
                    <Checkbox
                        style={{ display: "flex", alignItems: "center" }}
                        checked={showLabelBorder}
                        onChange={(e) => {
                            actions.setShowLabelBorder(e.target.checked);
                            actions.setSelectedPaper(undefined);
                        }}
                    >
                        {t("tonies.teddystudio.showLabelBorder")}
                    </Checkbox>
                </div>
            </Card>

            <Card size="small" title={t("tonies.teddystudio.paperSettings")} style={{ marginBottom: 8 }}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                        gap: 16,
                        marginBottom: 8,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "baseline",
                            gap: 4,
                        }}
                    >
                        <label style={{ marginRight: 8 }}>{t("tonies.teddystudio.paperSize")}</label>
                        <Radio.Group
                            size="small"
                            value={paperSize}
                            onChange={handlePaperSizeChange}
                            optionType="button"
                            buttonStyle="solid"
                        >
                            <Radio.Button value="A4">A4</Radio.Button>
                            <Radio.Button value="A5">A5</Radio.Button>
                            <Radio.Button value="Letter">Letter</Radio.Button>
                            <Radio.Button value="Custom">{t("tonies.teddystudio.custom")}</Radio.Button>
                        </Radio.Group>
                    </div>

                    {paperSize === "Custom" && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "baseline",
                                gap: 4,
                            }}
                        >
                            <label style={{ marginRight: 8 }}>{t("tonies.teddystudio.paperCustomSize")}</label>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "baseline",
                                    gap: 8,
                                }}
                            >
                                <Input
                                    size="small"
                                    type="number"
                                    value={parseFloat(customPaperWidth)}
                                    onChange={handleCustomPaperWidthChange}
                                    min={1}
                                    max={500}
                                    style={{ width: 100 }}
                                    suffix="mm"
                                />
                                <Input
                                    size="small"
                                    type="number"
                                    value={parseFloat(customPaperHeight)}
                                    onChange={handleCustomPaperHeightChange}
                                    min={1}
                                    max={500}
                                    style={{ width: 100 }}
                                    suffix="mm"
                                />
                            </div>
                        </div>
                    )}

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "baseline",
                            gap: 4,
                        }}
                    >
                        <label style={{ marginRight: 8 }}>{t("tonies.teddystudio.paperMargin")}</label>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: 8,
                            }}
                        >
                            <Input
                                size="small"
                                type="number"
                                value={parseFloat(paperMarginTop)}
                                onChange={handlePaperMarginTopChange}
                                min={0}
                                max={50}
                                style={{ width: 100 }}
                                suffix="mm"
                            />
                            <Input
                                size="small"
                                type="number"
                                value={parseFloat(paperMarginLeft)}
                                onChange={handlePaperMarginLeftChange}
                                min={0}
                                max={50}
                                style={{ width: 100 }}
                                suffix="mm"
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "baseline",
                            gap: 4,
                        }}
                    >
                        <label style={{ marginRight: 8 }}>{t("tonies.teddystudio.paperLabelImageBleed")}</label>
                        <Input
                            size="small"
                            type="number"
                            value={parseFloat(paperLabelImageBleed)}
                            onChange={handlePaperLabelImageBleedChange}
                            min={0}
                            max={Math.min(parseFloat(labelSpacingX) / 2 || 0, parseFloat(labelSpacingY) / 2 || 0)}
                            style={{ width: 100 }}
                            suffix="mm"
                        />
                    </div>
                </div>
            </Card>

            <div
                style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                }}
            >
                {inModal && (
                    <Button icon={<CloseOutlined />} onClick={onClose}>
                        {t("tonies.teddystudio.close")}
                    </Button>
                )}
                <Button icon={<ClearOutlined />} onClick={onClear}>
                    {t("tonies.teddystudio.clearSettings")}
                </Button>
                <Button icon={<SaveOutlined />} onClick={onSave}>
                    {t("tonies.teddystudio.saveSettings")}
                </Button>
            </div>
        </Paragraph>
    );
};
