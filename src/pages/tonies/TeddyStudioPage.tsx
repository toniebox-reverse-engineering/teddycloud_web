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
} from "antd";
import { ClearOutlined, DeleteOutlined, PlusOutlined, PrinterOutlined, SaveOutlined } from "@ant-design/icons";
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
const { Search } = Input;

const api = new TeddyCloudApi(defaultAPIConfig());

const stripUnit = (value: string, unit: string) =>
    value.toLowerCase().endsWith(unit) ? value.slice(0, -unit.length) : value;

export const TeddyStudioPage = () => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const { addNotification } = useTeddyCloud();

    const [jsonData, setJsonData] = useState<any>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [autocompleteList, setAutocompleteList] = useState([]);
    const [results, setResults] = useState<any[]>([]);
    const [diameter, setDiameter] = useState("40mm");
    const [textFontSize, setTextFontSize] = useState("14px");
    const [showLanguageFlag, setShowLanguageFlag] = useState<boolean>(false);
    const [showModelNo, setShowModelNo] = useState<boolean>(false);
    const [labelShape, setLabelShape] = useState("round"); // or "square"
    const [printMode, setPrintMode] = useState<"both" | "image" | "text">("both");
    const [width, setWidth] = useState("50mm");
    const [height, setHeight] = useState("30mm");
    const [labelSpacingX, setLabelSpacingX] = useState<string>("5mm");
    const [labelSpacingY, setLabelSpacingY] = useState<string>("5mm");
    const [labelBackgroundColor, setLabelBackgroundColor] = useState<string>("#ffffff");
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

    const autocompleteRef = useRef(null);

    useEffect(() => {
        loadJSONData();
    }, []);

    useEffect(() => {
        const saved = sessionStorage.getItem("labelSettings");
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
            setPrintMode(data.printMode || "both");
        }
    }, []);

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
        };
        sessionStorage.setItem("labelSettings", JSON.stringify(values));
        addNotification(
            NotificationTypeEnum.Success,
            t("tonies.teddystudio.settingsSavedSuccessful"),
            t("tonies.teddystudio.settingsSavedSuccessful"),
            t("tonies.teddystudio.navigationTitle")
        );
    };

    const handleClear = () => {
        sessionStorage.removeItem("labelSettings");
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
        setPrintMode("both");
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
    };

    const handleDiameterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(rawValue)) && Number(rawValue) > 0) {
            setDiameter(`${rawValue}mm`);
        } else {
            setDiameter("");
        }
    };

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(rawValue)) && Number(rawValue) > 0) {
            setWidth(`${rawValue}mm`);
        } else {
            setWidth("");
        }
    };

    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(rawValue)) && Number(rawValue) > 0) {
            setHeight(`${rawValue}mm`);
        } else {
            setHeight("");
        }
    };

    const handleSpacingChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = stripUnit(e.target.value, "mm");
        if (!isNaN(Number(rawValue)) && Number(rawValue) >= 0) {
            setter(`${rawValue}mm`);
        } else {
            setter("");
        }
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
                        <Search
                            placeholder={t("tonies.teddystudio.placeholder")}
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            onSearch={handleSearch}
                            allowClear
                            style={{ width: "100%" }}
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

                        <Upload showUploadList={false} maxCount={1} beforeUpload={handleAddCustomImage}>
                            <Button icon={<PlusOutlined />}>{t("tonies.teddystudio.customImageUpload")}</Button>
                        </Upload>
                    </div>
                    <Divider>{t("tonies.teddystudio.settings")}</Divider>
                    <Paragraph style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                            <div>
                                <label style={{ marginRight: 8 }}>{t("tonies.teddystudio.printMode")}</label>
                                <Radio.Group
                                    size="small"
                                    value={printMode}
                                    onChange={(e) => setPrintMode(e.target.value)}
                                    optionType="button"
                                    buttonStyle="solid"
                                >
                                    <Radio.Button value="both">
                                        <Tooltip title={t("tonies.teddystudio.printModeImageAndTextTooltip")}>
                                            {t("tonies.teddystudio.printModeImageAndText")}
                                        </Tooltip>
                                    </Radio.Button>
                                    <Radio.Button value="image">
                                        <Tooltip title={t("tonies.teddystudio.printModeOnlyImageTooltip")}>
                                            {t("tonies.teddystudio.printModeOnlyImage")}
                                        </Tooltip>
                                    </Radio.Button>
                                    <Radio.Button value="text">
                                        <Tooltip title={t("tonies.teddystudio.printModeOnlyTextTooltip")}>
                                            {t("tonies.teddystudio.printModeOnlyText")}
                                        </Tooltip>
                                    </Radio.Button>
                                </Radio.Group>
                            </div>
                            {printMode != "image" ? (
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
                            {printMode != "image" ? (
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
                        </div>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                            <div style={{ display: "flex", alignItems: "baseline" }}>
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
                                <div style={{ display: "flex", alignItems: "baseline" }}>
                                    <label style={{ marginRight: 8 }}>{t("tonies.teddystudio.diameter")}</label>
                                    <Input
                                        size="small"
                                        type="number"
                                        value={parseFloat(diameter)}
                                        onChange={handleDiameterChange}
                                        min={1}
                                        max={240}
                                        style={{ width: 120 }}
                                        addonAfter="mm"
                                        placeholder={t("tonies.teddystudio.diameter")}
                                    />
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: "flex", alignItems: "baseline" }}>
                                        <label style={{ marginRight: 8 }}>{t("tonies.teddystudio.width")}</label>
                                        <Input
                                            size="small"
                                            type="number"
                                            value={parseFloat(width)}
                                            onChange={handleWidthChange}
                                            min={1}
                                            max={240}
                                            style={{ width: 120 }}
                                            addonAfter="mm"
                                            placeholder={t("tonies.teddystudio.width")}
                                        />
                                    </div>
                                    <div style={{ display: "flex", alignItems: "baseline" }}>
                                        <label style={{ marginRight: 8 }}>{t("tonies.teddystudio.height")}</label>
                                        <Input
                                            size="small"
                                            type="number"
                                            value={parseFloat(height)}
                                            onChange={handleHeightChange}
                                            min={1}
                                            max={240}
                                            style={{ width: 120 }}
                                            addonAfter="mm"
                                            placeholder={t("tonies.teddystudio.height")}
                                        />
                                    </div>
                                </>
                            )}
                            <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                                <label style={{ marginRight: 8, wordBreak: "keep-all" }}>
                                    {t("tonies.teddystudio.labelSpacing")}
                                </label>
                                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
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
                                            addonAfter="mm"
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
                                            addonAfter="mm"
                                            placeholder={t("tonies.teddystudio.labelSpacingX")}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "baseline" }}>
                                <label style={{ marginRight: 8 }}>{t("tonies.teddystudio.textFontSize")}</label>
                                <Input
                                    size="small"
                                    type="number"
                                    value={parseFloat(textFontSize)}
                                    onChange={handleTextFontsizeChange}
                                    min={1}
                                    max={90}
                                    style={{ width: 120 }}
                                    addonAfter="px"
                                    placeholder={t("tonies.teddystudio.textFontSize")}
                                />
                            </div>
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <span style={{ marginRight: 8 }}>{t("tonies.teddystudio.labelBackgroundColor")}</span>
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
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                            <Button icon={<ClearOutlined />} onClick={handleClear}>
                                {t("tonies.teddystudio.clearSettings")}
                            </Button>
                            <Button icon={<SaveOutlined />} onClick={handleSave}>
                                {t("tonies.teddystudio.saveSettings")}
                            </Button>
                        </div>
                    </Paragraph>
                    <Divider>{t("tonies.teddystudio.printSheet")}</Divider>
                    {mergedResults.length > 0 ? (
                        <Paragraph style={{ marginBottom: 16 }}>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                            ["--labelElement-radius" as any]: labelShape === "square" ? "4px" : "50%",
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
                                    style={{ display: printMode == "both" || printMode == "image" ? "flex" : "none" }}
                                >
                                    <img src={dataset.pic} alt={dataset.title} style={{ height: "100%" }} />
                                </div>
                                <div
                                    className="labelElement"
                                    style={{
                                        display: printMode == "both" || printMode == "text" ? "flex" : "none",
                                        justifyContent: "space-between",
                                        fontSize: `${textFontSize}`,
                                        padding: "4px 8px 8px 8px",
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
                    width: var(--labelElement-width);
                    height: var(--labelElement-height);
                    border-radius: var(--labelElement-radius);
                    background-color: ${labelBackgroundColor};
                    border: 1px solid ${token.colorBorder};
                    color: black;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    margin: 10px;
                    overflow: hidden;
                    font-size: var(--text-font-size, 14px);
                }
                .traveltonieCouple {
                    border-radius: 16px;
                    border: 1px dashed ${token.colorBorderSecondary};
                }

                @media print {
                    * {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;  /* Standardname, wo unterstützt */
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
