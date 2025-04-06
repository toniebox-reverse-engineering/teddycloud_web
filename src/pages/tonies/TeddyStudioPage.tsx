import { useEffect, useState, useRef } from "react";
import { Typography, Input, Button, Divider, theme } from "antd";
import { useTranslation } from "react-i18next";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { ClearOutlined, DeleteOutlined, PrinterOutlined } from "@ant-design/icons";

const { Paragraph } = Typography;
const { Search } = Input;

const api = new TeddyCloudApi(defaultAPIConfig());

export const TeddyStudioPage = () => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const [jsonData, setJsonData] = useState<any>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [autocompleteList, setAutocompleteList] = useState([]);
    const [results, setResults] = useState<any[]>([]);
    const [diameter, setDiameter] = useState("40mm");
    const [textFontSize, setTextFontSize] = useState("14px");

    const autocompleteRef = useRef(null);

    useEffect(() => {
        loadJSONData();
    }, []);

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

    const handleDiameterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDiameter = e.target.value;
        if (!isNaN(Number(newDiameter)) && Number(newDiameter) > 0) {
            setDiameter(`${newDiameter}mm`);
        }
    };

    const handleTextFontsizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTextFontsize = e.target.value;
        if (!isNaN(Number(newTextFontsize)) && Number(newTextFontsize) > 0) {
            setTextFontSize(`${newTextFontsize}px`);
        }
    };

    const handleSuggestionClick = (dataset: any) => {
        setResults((prev) => [...prev, dataset]);
        setSearchTerm("");
        setAutocompleteList([]);
    };

    const removeResult = (indexToRemove: number) => {
        setResults((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
        <>
            <StyledSider>
                <ToniesSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("tonies.navigationTitle") },
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
                    <Divider>{t("tonies.teddystudio.settings")}</Divider>
                    <Paragraph style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <div style={{ display: "flex", alignItems: "baseline" }}>
                                <label style={{ marginRight: 8 }}>{t("tonies.teddystudio.diameter")}</label>
                                <Input
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
                            <div style={{ display: "flex", alignItems: "baseline" }}>
                                <label style={{ marginRight: 8 }}>{t("tonies.teddystudio.textFontSize")}</label>
                                <Input
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
                        </div>
                    </Paragraph>
                    <Divider>{t("tonies.teddystudio.printSheet")}</Divider>
                    {results.length > 0 ? (
                        <Paragraph style={{ marginBottom: 16 }}>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <Button icon={<ClearOutlined />} onClick={() => setResults([])}>
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
                            gap: "10px",
                            ["--coin-size" as any]: diameter,
                            ["--text-font-size" as any]: textFontSize,
                        }}
                    >
                        {results.map((dataset: any, index: number) => (
                            <div
                                key={index}
                                style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
                                className="traveltonieCouple"
                            >
                                <div className="coin">
                                    <img src={dataset.pic} alt={dataset.title} style={{ height: "100%" }} />
                                </div>
                                <div className="coin" style={{ position: "relative", fontSize: `${textFontSize}` }}>
                                    <div style={{ fontWeight: "bold" }}>{dataset.series}</div>
                                    <div>{dataset.episodes}</div>
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
                .coin {
                    width: var(--coin-size);
                    height: var(--coin-size);
                    border-radius: 50%;
                    background-color: white;
                    border: 1px solid ${token.colorBorder};
                    color: black;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    margin: 10px;
                    overflow: hidden;
                    font-size: var(--text-font-size);
                }
                .traveltonieCouple {
                    border-radius: 16px;
                    border: 1px dashed ${token.colorBorderSecondary};
                }

                @media print {
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
                    }
                    .coin {
                        border-color: lightgray;
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
