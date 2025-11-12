import { useEffect, useState, useRef } from "react";
import {
    Typography,
    Input,
    Button,
    Divider,
    theme,
    Checkbox,
    Radio,
    RadioChangeEvent,
    ColorPicker,
    Upload,
    Tooltip,
    Collapse,
    Select,
} from "antd";
import {
    ClearOutlined,
    DeleteOutlined,
    PlusOutlined,
    PrinterOutlined,
    SaveOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { useTeddyCloud } from "../../TeddyCloudContext";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { LanguageFlagIcon } from "../../utils/languageUtil";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";
import { Link } from "react-router-dom";

const { Paragraph } = Typography;

const api = new TeddyCloudApi(defaultAPIConfig());

const stripUnit = (value: string, unit: string) =>
    value.toLowerCase().endsWith(unit) ? value.slice(0, -unit.length) : value;

interface PaperSettings {
    marginTopBottom: string;
    marginLeftRight: string;
    imageBleed: string;
    spacingX: string;
    spacingY: string;
    paperFormat: "A4" | "A5" | "Letter" | "Custom";
    labelForm: "round" | "square";
    labelBorder: boolean;
}

export const TeddyStudioPage = () => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const { addNotification } = useTeddyCloud();

    const [jsonData, setJsonData] = useState<any>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [autocompleteList, setAutocompleteList] = useState([]);
    const [results, setResults] = useState<any[]>([]);
    const [diameter, setDiameter] = useState("40mm");
    const [labelShape, setLabelShape] = useState<"round" | "square">("round");
    const [printMode, setPrintMode] = useState<"ImageAndText" | "OnlyImage" | "OnlyText">("ImageAndText");
    const [width, setWidth] = useState("50mm");
    const [height, setHeight] = useState("30mm");
    const [labelSpacingX, setLabelSpacingX] = useState<string>("5mm");
    const [labelSpacingY, setLabelSpacingY] = useState<string>("5mm");
    const [labelBackgroundColor, setLabelBackgroundColor] = useState<string>("#ffffff");

    const [paperSize, setPaperSize] = useState<"A4" | "A5" | "Letter" | "Custom">("A4");
    const [customPaperWidth, setCustomPaperWidth] = useState("210mm");
    const [customPaperHeight, setCustomPaperHeight] = useState("297mm");
    const [paperMarginVertical, setPaperMarginVertical] = useState("10mm");
    const [paperMarginHorizontal, setPaperMarginHorizontal] = useState("10mm");
    const [paperLabelImageBleed, setPaperLabelImageBleed] = useState("0mm");

    const [textFontSize, setTextFontSize] = useState("14px");
    const [textColor, setTextColor] = useState(getContrastTextColor(labelBackgroundColor));
    const [showLanguageFlag, setShowLanguageFlag] = useState<boolean>(false);
    const [showModelNo, setShowModelNo] = useState<boolean>(false);
    const [showLabelBorder, setShowLabelBorder] = useState<boolean>(true);

    const [selectedPaper, setSelectedPaper] = useState<string | undefined>();

    const [customItems, setCustomItems] = useState<{ image?: string; text?: string }[]>([]);

    const mergedResults = [
        ...results,
        ...customItems.map((item) => ({
            custom: true,
            text: item.text,
            pic: item.image,
            episodes: "",
            model: "",
            language: "",
        })),
    ];

    const paperOptions: { label: string; value: string; settings: PaperSettings }[] = [
        {
            label: "Avery 5080",
            value: "avery5080",
            settings: {
                marginTopBottom: "5mm",
                marginLeftRight: "8mm",
                imageBleed: "1mm",
                spacingX: "10mm",
                spacingY: "7mm",
                paperFormat: "A4",
                labelForm: "round",
                labelBorder: false,
            },
        },
        {
            label: "Avery 5160",
            value: "avery5160",
            settings: {
                marginTopBottom: "5mm",
                marginLeftRight: "8mm",
                imageBleed: "1mm",
                spacingX: "12mm",
                spacingY: "8mm",
                paperFormat: "A4",
                labelForm: "square",
                labelBorder: false,
            },
        },
        // add more if new one are available
    ];

    const autocompleteRef = useRef(null);

    useEffect(() => {
        loadJSONData();
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem("labelSettings");
        if (saved) {
            const data = JSON.parse(saved);
            setDiameter(data.diameter || "40mm");
            setWidth(data.width || "50mm");
            setHeight(data.height || "30mm");
            setTextFontSize(data.textFontSize || "14px");
            setLabelShape(data.labelShape || "round");
            setShowLanguageFlag(data.showLanguageFlag || false);
            setShowModelNo(data.showModelNo || false);
            setLabelSpacingX(data.labelSpacingX || "5mm");
            setLabelSpacingY(data.labelSpacingY || "5mm");
            setLabelBackgroundColor(data.labelBackgroundColor || "#ffffff");
            setPrintMode(data.printMode || "ImageAndText");
            setPaperSize(data.paperSize || "A4");
            setCustomPaperWidth(data.customPaperWidth || "210mm");
            setCustomPaperHeight(data.customPaperHeight || "297mm");
            setPaperMarginVertical(data.paperMarginVertical || "10mm");
            setPaperMarginHorizontal(data.paperMarginHorizontal || "10mm");
            setShowLabelBorder(data.showLabelBorder ?? true);
        }
    }, []);

    useEffect(() => {
        setTextColor(getContrastTextColor(labelBackgroundColor));
    }, [labelBackgroundColor]);

    const handlePaperSelect = (value: string) => {
        const paper = paperOptions.find((p) => p.value === value);
        if (paper) {
            setLabelSpacingX(paper.settings.spacingX);
            setLabelSpacingY(paper.settings.spacingY);
            setPaperMarginVertical(paper.settings.marginTopBottom);
            setPaperMarginHorizontal(paper.settings.marginLeftRight);
            setLabelShape(paper.settings.labelForm);
            setPaperSize(paper.settings.paperFormat);
            setPaperLabelImageBleed(paper.settings.imageBleed);
            setShowLabelBorder(paper.settings.labelBorder);
        }
        setSelectedPaper(value);
    };

    const handleSave = () => {
        const values = {
            diameter,
            width,
            height,
            textFontSize,
            labelShape,
            showLanguageFlag,
            showModelNo,
            labelSpacingX,
            labelSpacingY,
            labelBackgroundColor,
            printMode,
            paperSize,
            customPaperWidth,
            customPaperHeight,
            paperMarginVertical,
            paperMarginHorizontal,
            showLabelBorder,
        };
        localStorage.setItem("labelSettings", JSON.stringify(values));
        addNotification(
            NotificationTypeEnum.Success,
            t("tonies.teddystudio.settingsSavedSuccessful"),
            t("tonies.teddystudio.settingsSavedSuccessful"),
            t("tonies.teddystudio.navigationTitle")
        );
    };

    const handleClear = () => {
        localStorage.removeItem("labelSettings");
        setDiameter("40mm");
        setWidth("50mm");
        setHeight("30mm");
        setTextFontSize("14px");
        setLabelShape("round");
        setShowLanguageFlag(false);
        setShowModelNo(false);
        setLabelSpacingX("5mm");
        setLabelSpacingY("5mm");
        setLabelBackgroundColor("#ffffff");
        setPrintMode("ImageAndText");
        setPaperSize("A4");
        setCustomPaperWidth("210mm");
        setCustomPaperHeight("297mm");
        setPaperMarginVertical("10mm");
        setPaperMarginHorizontal("10mm");
        setShowLabelBorder(true);
    };

    const loadJSONData = async () => {
        try {
            const [defaultResponse, customResponse] = await Promise.all([
                api.apiGetTeddyCloudApiRaw(`/api/toniesJson`),
                api.apiGetTeddyCloudApiRaw(`/api/toniesCustomJson`),
            ]);

            const [defaultData, customData] = await Promise.all([defaultResponse.json(), customResponse.json()]);

            const mergedData = [...defaultData, ...customData];
            setJsonData(mergedData);
        } catch (err) {
            console.error("Error loading json files:", err);
        }
    };

    const handleSearch = (value: string) => {
        const query = value.toLowerCase();
        setSearchTerm(value);

        if (query === "") {
            setAutocompleteList([]);
            return;
        }

        const filtered = jsonData.filter(
            (item: any) => item.title?.toLowerCase().includes(query) || item.series?.toLowerCase().includes(query)
        );
        setAutocompleteList(filtered);
    };

    const handleCustomTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
        const newText = e.target.value;
        setCustomItems((prev) => prev.map((item, i) => (i === index ? { ...item, text: newText } : item)));
    };

    const handleRemoveCustomItem = (index: number) => {
        setCustomItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAddCustomImage = (file: File) => {
        const url = URL.createObjectURL(file);
        setCustomItems((prev) => [...prev, { image: url, text: "" }]);
        return false;
    };

    const handleLabelShapeChange = (e: RadioChangeEvent) => {
        setLabelShape(e.target.value);
        setSelectedPaper(undefined);
    };

    const handleDiameterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(rawValue)) && Number(rawValue) > 0) {
            setDiameter(`${rawValue}mm`);
        } else {
            setDiameter("");
        }
        setSelectedPaper(undefined);
    };

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(rawValue)) && Number(rawValue) > 0) {
            setWidth(`${rawValue}mm`);
        } else {
            setWidth("");
        }
        setSelectedPaper(undefined);
    };

    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(rawValue)) && Number(rawValue) > 0) {
            setHeight(`${rawValue}mm`);
        } else {
            setHeight("");
        }
        setSelectedPaper(undefined);
    };

    const handleSpacingChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(rawValue)) && Number(rawValue) >= 0) {
            setter(`${rawValue}mm`);
        } else {
            setter("");
        }
        setSelectedPaper(undefined);
    };

    const handlePaperSizeChange = (e: any) => {
        setPaperSize(e.target.value);
        setSelectedPaper(undefined);
    };

    const handleCustomPaperWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(val)) && Number(val) > 0) setCustomPaperWidth(`${val}mm`);
        setSelectedPaper(undefined);
    };

    const handleCustomPaperHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(val)) && Number(val) > 0) setCustomPaperHeight(`${val}mm`);
        setSelectedPaper(undefined);
    };

    const handlePaperMarginVerticalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(val)) && Number(val) >= 0) setPaperMarginVertical(`${val}mm`);
        setSelectedPaper(undefined);
    };

    const handlePaperMarginHorizontalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(val)) && Number(val) >= 0) setPaperMarginHorizontal(`${val}mm`);
        setSelectedPaper(undefined);
    };

    const handlePaperLabelImageBleedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(val)) && Number(val) >= 0) setPaperLabelImageBleed(`${val}mm`);
    };

    const handleTextFontsizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTextFontsize = e.target.value;
        if (!isNaN(Number(newTextFontsize)) && Number(newTextFontsize) > 0) {
            setTextFontSize(`${newTextFontsize}px`);
        } else {
            setTextFontSize("");
        }
    };

    const handleSuggestionClick = (dataset: any) => {
        setResults((prev) => [...prev, dataset]);
        setSearchTerm("");
        setAutocompleteList([]);
    };

    const removeResult = (indexToRemove: number) => {
        if (indexToRemove < results.length) {
            setResults((prev) => prev.filter((_, index) => index !== indexToRemove));
        } else {
            const customIndex = indexToRemove - results.length;
            setCustomItems((prev) => prev.filter((_, index) => index !== customIndex));
        }
    };

    function getContrastTextColor(bgColor: string): string {
        let r: number, g: number, b: number;
        if (bgColor.startsWith("#")) {
            const hex = bgColor.slice(1);
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        } else if (bgColor.startsWith("rgb")) {
            const values = bgColor.match(/\d+/g)?.map(Number);
            if (!values) return "black";
            [r, g, b] = values;
        } else {
            return "black";
        }

        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? "black" : "white";
    }

    return (
        <>
            <StyledSider>
                <ToniesSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                        { title: <Link to="/tonies">{t("tonies.navigationTitle")}</Link> },
                        { title: t("tonies.teddystudio.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("tonies.teddystudio.title")}</h1>
                    <Paragraph>{t("tonies.teddystudio.intro")}</Paragraph>
                    <div style={{ position: "relative", marginBottom: 8 }}>
                        <Input
                            placeholder={t("tonies.teddystudio.placeholder")}
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            onPressEnter={() => handleSearch(searchTerm)}
                            allowClear
                            style={{ width: "100%" }}
                            suffix={
                                <SearchOutlined
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSearch(searchTerm)}
                                    style={{ cursor: "pointer" }}
                                />
                            }
                        />
                        {autocompleteList.length > 0 && (
                            <div
                                ref={autocompleteRef}
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    background: token.colorBgContainer,
                                    color: token.colorText,
                                    border: `1px solid ${token.colorBorder}`,
                                    zIndex: 1000,
                                    maxHeight: 200,
                                    overflowY: "auto",
                                    borderRadius: "4px",
                                }}
                            >
                                {autocompleteList.map((item: any, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            padding: 10,
                                            cursor: "pointer",
                                            background: token.colorBgElevated,
                                            borderRadius: "4px",
                                        }}
                                        onMouseOver={(e) =>
                                            (e.currentTarget.style.backgroundColor = token.colorBgTextHover)
                                        }
                                        onMouseOut={(e) =>
                                            (e.currentTarget.style.backgroundColor = token.colorBgElevated)
                                        }
                                        onClick={() => handleSuggestionClick(item)}
                                    >
                                        {item.title}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <Divider>{t("tonies.teddystudio.customImage")}</Divider>
                    <Paragraph style={{ fontSize: "small" }}>{t("tonies.teddystudio.customImageHint")}</Paragraph>
                    <div style={{ display: "flex", gap: 16, flexDirection: "column", marginBottom: 16 }}>
                        {customItems.map((item, idx) => (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {item.image && (
                                    <img
                                        src={item.image}
                                        alt="preview"
                                        style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }}
                                    />
                                )}

                                <Input.TextArea
                                    placeholder={t("tonies.teddystudio.customImageTitle")}
                                    value={item.text}
                                    onChange={(e) => handleCustomTextChange(e, idx)}
                                    style={{ flex: 1 }}
                                />

                                <Button icon={<DeleteOutlined />} onClick={() => handleRemoveCustomItem(idx)} />
                            </div>
                        ))}

                        <div style={{ alignSelf: "end" }}>
                            <Upload showUploadList={false} maxCount={1} beforeUpload={handleAddCustomImage}>
                                <Button icon={<PlusOutlined />}>{t("tonies.teddystudio.customImageUpload")}</Button>
                            </Upload>
                        </div>
                    </div>
                    <Collapse
                        items={[
                            {
                                key: "1",
                                label: `${t("tonies.teddystudio.settings")}: ${
                                    labelShape === "round"
                                        ? `${t("tonies.teddystudio.round")} ${diameter}`
                                        : `${width} x ${height}`
                                } | ${t("tonies.teddystudio.printMode")}: ${t(
                                    `tonies.teddystudio.printMode${
                                        printMode.charAt(0).toUpperCase() + printMode.slice(1)
                                    }`
                                )} | ${t("tonies.teddystudio.paperSize")}: ${paperSize}${
                                    paperSize === "Custom" ? ` (${customPaperWidth} x ${customPaperHeight})` : ""
                                } `,
                                children: (
                                    <Paragraph style={{ marginBottom: 0 }}>
                                        <Divider style={{ marginTop: 0 }}>
                                            {t("tonies.teddystudio.labelSettings")}
                                        </Divider>

                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "8px 16px",
                                                flexWrap: "wrap",
                                                marginBottom: 8,
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "baseline" }}>
                                                <label style={{ marginRight: 8 }}>
                                                    {t("tonies.teddystudio.labelShape")}
                                                </label>
                                                <Radio.Group
                                                    size="small"
                                                    optionType="button"
                                                    buttonStyle="solid"
                                                    value={labelShape}
                                                    onChange={handleLabelShapeChange}
                                                >
                                                    <Radio.Button value="round">
                                                        {t("tonies.teddystudio.round")}
                                                    </Radio.Button>
                                                    <Radio.Button value="square">
                                                        {t("tonies.teddystudio.square")}
                                                    </Radio.Button>
                                                </Radio.Group>
                                            </div>

                                            {labelShape === "round" ? (
                                                <div style={{ display: "flex", alignItems: "baseline" }}>
                                                    <label style={{ marginRight: 8 }}>
                                                        {t("tonies.teddystudio.diameter")}
                                                    </label>
                                                    <Input
                                                        size="small"
                                                        type="number"
                                                        value={parseFloat(diameter)}
                                                        onChange={handleDiameterChange}
                                                        min={1}
                                                        max={240}
                                                        style={{ width: 120 }}
                                                        suffix="mm"
                                                        placeholder={t("tonies.teddystudio.diameter")}
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    <div style={{ display: "flex", alignItems: "baseline" }}>
                                                        <label style={{ marginRight: 8 }}>
                                                            {t("tonies.teddystudio.width")}
                                                        </label>
                                                        <Input
                                                            size="small"
                                                            type="number"
                                                            value={parseFloat(width)}
                                                            onChange={handleWidthChange}
                                                            min={1}
                                                            max={240}
                                                            style={{ width: 120 }}
                                                            suffix="mm"
                                                            placeholder={t("tonies.teddystudio.width")}
                                                        />
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "baseline" }}>
                                                        <label style={{ marginRight: 8 }}>
                                                            {t("tonies.teddystudio.height")}
                                                        </label>
                                                        <Input
                                                            size="small"
                                                            type="number"
                                                            value={parseFloat(height)}
                                                            onChange={handleHeightChange}
                                                            min={1}
                                                            max={240}
                                                            style={{ width: 120 }}
                                                            suffix="mm"
                                                            placeholder={t("tonies.teddystudio.height")}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                            <div style={{ display: "flex", alignItems: "baseline", gap: "8px 16px" }}>
                                                <label style={{ marginRight: 8, wordBreak: "keep-all" }}>
                                                    {t("tonies.teddystudio.labelSpacing")}
                                                </label>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "baseline",
                                                        gap: 8,
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <div style={{ display: "flex", alignItems: "baseline" }}>
                                                        <label style={{ marginRight: 8 }}>
                                                            {t("tonies.teddystudio.labelSpacingX")}
                                                        </label>
                                                        <Input
                                                            size="small"
                                                            type="number"
                                                            value={parseFloat(labelSpacingY)}
                                                            onChange={handleSpacingChange(setLabelSpacingY)}
                                                            min={0}
                                                            max={100}
                                                            style={{ width: 120, marginRight: 8 }}
                                                            suffix="mm"
                                                            placeholder={t("tonies.teddystudio.labelSpacingY")}
                                                        />
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "baseline" }}>
                                                        <label style={{ marginRight: 8 }}>
                                                            {t("tonies.teddystudio.labelSpacingY")}
                                                        </label>
                                                        <Input
                                                            size="small"
                                                            type="number"
                                                            value={parseFloat(labelSpacingX)}
                                                            onChange={handleSpacingChange(setLabelSpacingX)}
                                                            min={0}
                                                            max={100}
                                                            style={{ width: 120 }}
                                                            suffix="mm"
                                                            placeholder={t("tonies.teddystudio.labelSpacingX")}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "8px 16px",
                                                flexWrap: "wrap",
                                                marginBottom: 8,
                                            }}
                                        >
                                            <div>
                                                <label style={{ marginRight: 8 }}>
                                                    {t("tonies.teddystudio.printMode")}
                                                </label>
                                                <Radio.Group
                                                    size="small"
                                                    value={printMode}
                                                    onChange={(e) => setPrintMode(e.target.value)}
                                                    optionType="button"
                                                    buttonStyle="solid"
                                                >
                                                    <Radio.Button value="ImageAndText">
                                                        <Tooltip
                                                            title={t("tonies.teddystudio.printModeImageAndTextTooltip")}
                                                        >
                                                            {t("tonies.teddystudio.printModeImageAndText")}
                                                        </Tooltip>
                                                    </Radio.Button>
                                                    <Radio.Button value="OnlyImage">
                                                        <Tooltip
                                                            title={t("tonies.teddystudio.printModeOnlyImageTooltip")}
                                                        >
                                                            {t("tonies.teddystudio.printModeOnlyImage")}
                                                        </Tooltip>
                                                    </Radio.Button>
                                                    <Radio.Button value="OnlyText">
                                                        <Tooltip
                                                            title={t("tonies.teddystudio.printModeOnlyTextTooltip")}
                                                        >
                                                            {t("tonies.teddystudio.printModeOnlyText")}
                                                        </Tooltip>
                                                    </Radio.Button>
                                                </Radio.Group>
                                            </div>
                                            {printMode != "OnlyImage" ? (
                                                <div style={{ display: "flex", alignItems: "baseline" }}>
                                                    <label style={{ marginRight: 8 }}>
                                                        {t("tonies.teddystudio.textFontSize")}
                                                    </label>
                                                    <Input
                                                        size="small"
                                                        type="number"
                                                        value={parseFloat(textFontSize)}
                                                        onChange={handleTextFontsizeChange}
                                                        min={1}
                                                        max={90}
                                                        style={{ width: 120 }}
                                                        suffix="px"
                                                        placeholder={t("tonies.teddystudio.textFontSize")}
                                                    />
                                                </div>
                                            ) : (
                                                ""
                                            )}
                                            {printMode != "OnlyImage" ? (
                                                <Checkbox
                                                    style={{ display: "flex", alignItems: "center" }}
                                                    checked={showLanguageFlag}
                                                    onChange={(e) => setShowLanguageFlag(e.target.checked)}
                                                >
                                                    {t("tonies.teddystudio.showLanguageFlag")}
                                                </Checkbox>
                                            ) : (
                                                ""
                                            )}
                                            {printMode != "OnlyImage" ? (
                                                <Checkbox
                                                    style={{ display: "flex", alignItems: "center" }}
                                                    checked={showModelNo}
                                                    onChange={(e) => setShowModelNo(e.target.checked)}
                                                >
                                                    {t("tonies.teddystudio.showModelNo")}
                                                </Checkbox>
                                            ) : (
                                                ""
                                            )}
                                            <Checkbox
                                                style={{ display: "flex", alignItems: "center" }}
                                                checked={showLabelBorder}
                                                onChange={(e) => {
                                                    setShowLabelBorder(e.target.checked);
                                                    setSelectedPaper(undefined);
                                                }}
                                            >
                                                {t("tonies.teddystudio.showLabelBorder")}
                                            </Checkbox>

                                            <div style={{ display: "flex", alignItems: "center" }}>
                                                <span style={{ marginRight: 8 }}>
                                                    {t("tonies.teddystudio.labelBackgroundColor")}
                                                </span>
                                                <ColorPicker
                                                    size="small"
                                                    value={labelBackgroundColor}
                                                    onChange={(_, hex) => setLabelBackgroundColor(hex)}
                                                    showText
                                                    disabledAlpha
                                                    disabledFormat
                                                    format="hex"
                                                ></ColorPicker>
                                            </div>
                                        </div>
                                        <Divider>{t("tonies.teddystudio.paperSettings")}</Divider>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "baseline",
                                                gap: "8px 16px",
                                                flexWrap: "wrap",
                                                marginBottom: 16,
                                            }}
                                        >
                                            <div>
                                                <label style={{ marginRight: 8 }}>
                                                    {t("tonies.teddystudio.paperSize")}
                                                </label>
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
                                                    <Radio.Button value="Custom">
                                                        {t("tonies.teddystudio.custom")}
                                                    </Radio.Button>
                                                </Radio.Group>
                                            </div>

                                            {paperSize === "Custom" && (
                                                <>
                                                    <div style={{ display: "flex", alignItems: "baseline" }}>
                                                        <label style={{ marginRight: 8 }}>
                                                            {t("tonies.teddystudio.paperWidth")}
                                                        </label>
                                                        <Input
                                                            size="small"
                                                            type="number"
                                                            value={parseFloat(customPaperWidth)}
                                                            onChange={handleCustomPaperWidthChange}
                                                            min={1}
                                                            max={500}
                                                            style={{ width: 120 }}
                                                            suffix="mm"
                                                        />
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "baseline" }}>
                                                        <label style={{ marginRight: 8 }}>
                                                            {t("tonies.teddystudio.paperHeight")}
                                                        </label>
                                                        <Input
                                                            size="small"
                                                            type="number"
                                                            value={parseFloat(customPaperHeight)}
                                                            onChange={handleCustomPaperHeightChange}
                                                            min={1}
                                                            max={500}
                                                            style={{ width: 120 }}
                                                            suffix="mm"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "baseline",
                                                    gap: 16,
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "baseline" }}>
                                                    <label style={{ marginRight: 8 }}>
                                                        {t("tonies.teddystudio.paperMarginVertical")}
                                                    </label>
                                                    <Input
                                                        size="small"
                                                        type="number"
                                                        value={parseFloat(paperMarginVertical)}
                                                        onChange={handlePaperMarginVerticalChange}
                                                        min={0}
                                                        max={50}
                                                        style={{ width: 120 }}
                                                        suffix="mm"
                                                    />
                                                </div>
                                                <div style={{ display: "flex", alignItems: "baseline" }}>
                                                    <label style={{ marginRight: 8 }}>
                                                        {t("tonies.teddystudio.paperMarginHorizontal")}
                                                    </label>
                                                    <Input
                                                        size="small"
                                                        type="number"
                                                        value={parseFloat(paperMarginHorizontal)}
                                                        onChange={handlePaperMarginHorizontalChange}
                                                        min={0}
                                                        max={50}
                                                        style={{ width: 120 }}
                                                        suffix="mm"
                                                    />
                                                </div>
                                                <div style={{ display: "flex", alignItems: "baseline" }}>
                                                    <label style={{ marginRight: 8 }}>
                                                        {t("tonies.teddystudio.paperLabelImageBleed")}
                                                    </label>
                                                    <Input
                                                        size="small"
                                                        type="number"
                                                        value={parseFloat(paperLabelImageBleed)}
                                                        onChange={handlePaperLabelImageBleedChange}
                                                        min={0}
                                                        max={50}
                                                        style={{ width: 120 }}
                                                        suffix="mm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <Divider />
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 8,
                                                flexWrap: "wrap",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "baseline", width: 350 }}>
                                                <label style={{ marginRight: 8 }}>
                                                    {t("tonies.teddystudio.predefinedPaperOptions")}
                                                </label>
                                                <Select
                                                    placeholder={t("tonies.teddystudio.selectPredefinedPaperOptions")}
                                                    value={selectedPaper}
                                                    onChange={handlePaperSelect}
                                                    options={paperOptions.map((p) => ({
                                                        label: p.label,
                                                        value: p.value,
                                                    }))}
                                                    style={{ maxWidth: 200 }}
                                                />
                                            </div>
                                            <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                                                <Button icon={<ClearOutlined />} onClick={handleClear}>
                                                    {t("tonies.teddystudio.clearSettings")}
                                                </Button>
                                                <Button icon={<SaveOutlined />} onClick={handleSave}>
                                                    {t("tonies.teddystudio.saveSettings")}
                                                </Button>
                                            </div>
                                        </div>
                                    </Paragraph>
                                ),
                            },
                        ]}
                    />
                    <Divider>{t("tonies.teddystudio.printSheet")}</Divider>
                    {mergedResults.length > 0 ? (
                        <Paragraph style={{ marginBottom: 16 }}>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                <Button
                                    icon={<ClearOutlined />}
                                    onClick={() => {
                                        setResults([]);
                                        setCustomItems([]);
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
                        <Paragraph style={{ marginBottom: 16, color: token.colorTextDisabled }}>
                            {t("tonies.teddystudio.empty")}
                        </Paragraph>
                    )}
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
                                        display:
                                            printMode == "ImageAndText" || printMode == "OnlyImage" ? "flex" : "none",
                                        ["--label-bg-image" as any]: `url("${dataset.pic}")`,
                                    }}
                                />
                                <div
                                    className="labelElement"
                                    style={{
                                        display:
                                            printMode == "ImageAndText" || printMode == "OnlyText" ? "flex" : "none",
                                        justifyContent: "space-between",
                                        fontSize: textFontSize,
                                        padding: "4px 8px 8px 8px",
                                        flexDirection: "column",
                                        color: `${textColor}`,
                                    }}
                                >
                                    <div
                                        style={{
                                            height: 12,
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
                                        <div
                                            style={{
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {dataset.series}
                                        </div>
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
                                    onClick={() => removeResult(index)}
                                    style={{ margin: "8px 8px 0 8px" }}
                                />
                            </div>
                        ))}
                    </div>
                </StyledContent>
            </StyledLayout>

            <style>
                {`

                .labelElement {
                    position: relative;
                    width: var(--labelElement-width);
                    height: var(--labelElement-height);
                    border-radius: var(--labelElement-radius);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    margin: 10px;
                    overflow: visible;
                    font-size: var(--text-font-size, 14px);
                    color: black;
                    z-index: 0;
                }

                .labelElement::before {
                    content: "";
                    position: absolute;
                    top: -${paperLabelImageBleed};
                    left: -${paperLabelImageBleed};
                    right: -${paperLabelImageBleed};
                    bottom: -${paperLabelImageBleed};
                    background-image: var(--label-bg-image);
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    background-color: ${labelBackgroundColor};
                    border-radius: var(--labelElement-radius);
                    z-index: -1; 
                }

                    
                .labelElement::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    border: ${showLabelBorder ? "1px" : "0"} solid ${textColor};
                    border-radius: var(--labelElement-radius);
                    box-sizing: border-box;
                    z-index: 1;
                }

                .traveltonieCouple {
                    border-radius: 16px;
                    border: 1px dashed ${token.colorBorderSecondary};
                }

                @media print {
                    @page {
                        size: ${paperSize === "Custom" ? `${customPaperWidth} ${customPaperHeight}` : paperSize};
                        margin: ${paperMarginVertical} ${paperMarginHorizontal};
                    }

                    * {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    html * {
                        background-color: white !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #resultContainer, #resultContainer * {
                        visibility: visible;
                    }
                    #resultContainer {
                        position: absolute;
                        left: 0;
                        top: 0;
                        gap: 0;
                    }
                    .labelElement {
                        border-color: lightgray;
                        margin: 0;
                        background-color: ${labelBackgroundColor} !important;
                    }
                        
                    .labelElement * {
                        background-color: ${labelBackgroundColor} !important;
                    }
                    .traveltonieCouple {
                        border: none;
                    }
                    .deleteButton {
                        display: none;
                    }
                }
                `}
            </style>
        </>
    );
};
