import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Col, Form, Input, Row, Typography, Image, Tabs, TabsProps, theme, Tooltip } from "antd";

import { CloseOutlined, CodeOutlined } from "@ant-design/icons";
import pcb3235Image from "../../../assets/boxSetup/3235_pcb.png";
import pcb3235ImagePreview from "../../../assets/boxSetup/3235_pcb_preview.png";
import pcb3200Image from "../../../assets/boxSetup/3200_pcb.png";
import pcb3200ImagePreview from "../../../assets/boxSetup/3200_pcb_preview.png";
import chip3200Image from "../../../assets/boxSetup/cc3200.jpg";
import chip3235Image from "../../../assets/boxSetup/cc3235.jpg";
import pcbesp32Image from "../../../assets/boxSetup/esp32_pcb.png";
import pcbesp32ImagePreview from "../../../assets/boxSetup/esp32_pcb_preview.png";
import chipesp32Image from "../../../assets/boxSetup/esp32.jpg";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../components/StyledComponents";
import { TonieboxesSubNav } from "../../../components/tonieboxes/TonieboxesSubNav";

const { Paragraph } = Typography;
const { useToken } = theme;

export const IdentifyBoxVersionPage = () => {
    const { t } = useTranslation();
    const { token } = useToken();
    const navigate = useNavigate();
    const [boxMac, setBoxMac] = useState<string>("");
    const [warningTextMac, setWarningTextMac] = useState<string>("");
    const [vendor, setVendor] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const sanitizeMac = (input: string) => {
        return input.replace(/[^a-zA-Z0-9-:]/g, "").trim();
    };

    const checkMac = async () => {
        // Reset states
        setVendor(null);
        setError(null);

        try {
            const response = await fetch(`https://api.macvendors.com/${encodeURIComponent(boxMac)}`);

            if (!response.ok) {
                throw new Error("MAC address not found or invalid");
            }

            const data = await response.text();
            setVendor(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const [activeKey, setActiveKey] = useState(vendor?.toLowerCase().includes("espressif") ? "esp32" : "cc3200");

    useEffect(() => {
        if (vendor?.toLowerCase().includes("espressif")) {
            setActiveKey("esp32");
        } else {
            setActiveKey("cc3200");
        }
    }, [vendor]);

    const cc3200Tab = (
        <>
            <Paragraph>{t("tonieboxes.boxSetup.identifyVersion.cc3200text")}</Paragraph>
            <Paragraph
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    flexWrap: "wrap",
                    gap: 16,
                }}
            >
                <Image.PreviewGroup>
                    <Paragraph style={{ maxWidth: 400 }}>
                        <Image
                            src={pcb3200Image}
                            alt="PCB CC3200"
                            placeholder={<Image preview={false} src={pcb3200ImagePreview} />}
                        ></Image>
                    </Paragraph>
                    <Paragraph style={{ maxWidth: "100%" }}>
                        <Image src={chip3200Image} style={{ height: 300, width: "auto" }} alt="Chip CC3200"></Image>
                    </Paragraph>
                </Image.PreviewGroup>
            </Paragraph>
        </>
    );

    const cc3235Tab = (
        <>
            <Paragraph>{t("tonieboxes.boxSetup.identifyVersion.cc3235text")}</Paragraph>
            <Paragraph
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    flexWrap: "wrap",
                    gap: 16,
                }}
            >
                <Image.PreviewGroup>
                    <Paragraph style={{ maxWidth: 400 }}>
                        <Image
                            src={pcb3235Image}
                            alt="PCB CC3235"
                            placeholder={<Image preview={false} src={pcb3235ImagePreview} />}
                        ></Image>
                    </Paragraph>
                    <Paragraph style={{ maxWidth: "100%" }}>
                        <Image src={chip3235Image} style={{ height: 300, width: "auto" }} alt="Chip CC3235"></Image>
                    </Paragraph>
                </Image.PreviewGroup>
            </Paragraph>
        </>
    );

    const esp32Tab = (
        <>
            <Paragraph>{t("tonieboxes.boxSetup.identifyVersion.esp32text")}</Paragraph>
            <Paragraph
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    flexWrap: "wrap",
                    gap: 16,
                }}
            >
                <Image.PreviewGroup>
                    <Paragraph style={{ maxWidth: 400 }}>
                        <Image
                            src={pcbesp32Image}
                            alt="PCB ESP32"
                            placeholder={<Image preview={false} src={pcbesp32ImagePreview} />}
                        ></Image>
                    </Paragraph>
                    <Paragraph style={{ maxWidth: "100%" }}>
                        <Image src={chipesp32Image} style={{ height: 300, width: "auto" }} alt="Chip ESP32"></Image>
                    </Paragraph>
                </Image.PreviewGroup>
            </Paragraph>
        </>
    );

    const versionItems: TabsProps["items"] = [
        { key: "cc3200", label: "CC3200", children: cc3200Tab },
        { key: "cc3235", label: "CC3235", children: cc3235Tab },
        { key: "esp32", label: "ESP32", children: esp32Tab },
    ];

    const versionTabs = (
        <>
            <Tabs
                activeKey={activeKey}
                onChange={(newKey) => setActiveKey(newKey)}
                defaultActiveKey={vendor?.toLowerCase().includes("espressif") ? "esp32" : "cc3200"}
                items={versionItems.filter(
                    (item) =>
                        ((vendor?.toLowerCase().includes("texas") || !vendor) && item.key === "cc3200") ||
                        ((vendor?.toLowerCase().includes("texas") || !vendor) && item.key === "cc3235") ||
                        ((vendor?.toLowerCase().includes("espressif") || !vendor) && item.key === "esp32")
                )}
                indicator={{ size: (origin) => origin - 20, align: "center" }}
            />
            <Paragraph>{t("tonieboxes.boxSetup.identifyVersion.proceedToFlash1")} </Paragraph>
            <Paragraph style={{ marginTop: 16 }}>
                <Button type="primary" onClick={() => navigate(`../tonieboxes/boxsetup/${activeKey}/flashing`)}>
                    {`${activeKey.toUpperCase()} ${t("tonieboxes.boxSetup.identifyVersion.proceedToFlashLinkText")}`}
                </Button>
            </Paragraph>
        </>
    );

    const handleClear = () => {
        setBoxMac("");
        setVendor(null);
        setWarningTextMac("");
        setError(null);
    };

    return (
        <>
            <StyledSider>
                <TonieboxesSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <TonieboxesSubNav />
                </HiddenDesktop>
                <BreadcrumbWrapper
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("tonieboxes.navigationTitle") },
                        { title: t("tonieboxes.boxSetup.identifyVersion.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t(`tonieboxes.boxSetup.identifyVersion.title`)}</h1>
                    <Form>
                        <Paragraph>{t("tonieboxes.boxSetup.identifyVersion.identifyUsingMac")} </Paragraph>
                        <Form.Item>
                            <Row align="middle" style={{ display: "flex", alignItems: "center" }}>
                                <Col style={{ flex: "0 0 250px", color: warningTextMac ? "#CC3010" : "unset" }}>
                                    <label>{t("tonieboxes.boxSetup.identifyVersion.mac")}</label>
                                </Col>
                                <Col style={{ flex: "1 1 auto" }}>
                                    <Input
                                        type="text"
                                        value={boxMac}
                                        onChange={(e) => {
                                            let value = sanitizeMac(e.target.value);
                                            let warningText = "";
                                            if (value.length > 17) {
                                                warningText = t("tonieboxes.boxSetup.identifyVersion.boxMacTooLong");
                                            } else {
                                                warningText = "";
                                            }
                                            setBoxMac(value);
                                            setWarningTextMac(warningText);
                                        }}
                                        addonBefore={
                                            <CloseOutlined
                                                onClick={handleClear}
                                                style={{
                                                    color: boxMac ? token.colorText : token.colorTextDisabled,
                                                    cursor: boxMac ? "pointer" : "default",
                                                }}
                                            />
                                        }
                                    />
                                </Col>
                            </Row>
                            {warningTextMac && <p style={{ color: "#CC3010" }}>{warningTextMac}</p>}
                        </Form.Item>
                        <Button
                            icon={<CodeOutlined />}
                            disabled={boxMac.length > 17 || boxMac.length === 0}
                            type="primary"
                            onClick={checkMac}
                        >
                            {t("tonieboxes.boxSetup.identifyVersion.identify")}
                        </Button>
                        <Paragraph style={{ fontSize: "small", marginTop: 16 }}>
                            {t("tonieboxes.boxSetup.identifyVersion.macvendors")}{" "}
                            <Link to="https://macvendors.com/" target="_blank">
                                {t("tonieboxes.boxSetup.identifyVersion.macvendorsLink")}
                            </Link>
                        </Paragraph>
                    </Form>
                    {vendor ? (
                        <>
                            <Alert
                                style={{ marginTop: 16 }}
                                type="success"
                                description={
                                    <>
                                        {t("tonieboxes.boxSetup.identifyVersion.vendor")}: <b>{vendor}</b>{" "}
                                        {t("tonieboxes.boxSetup.identifyVersion.boxVersion")}
                                        {vendor.includes("Espressif") ? (
                                            <b> ESP32</b>
                                        ) : (
                                            <>
                                                <b> CC3200</b> {t("tonieboxes.boxSetup.identifyVersion.or")}
                                                <b> CC3235</b>
                                            </>
                                        )}{" "}
                                        {t("tonieboxes.boxSetup.identifyVersion.version")}.
                                    </>
                                }
                            />

                            {vendor.toLowerCase().includes("texas") ? (
                                <Paragraph style={{ marginTop: 16 }}>
                                    {t("tonieboxes.boxSetup.identifyVersion.tiInstruction")}
                                </Paragraph>
                            ) : (
                                ""
                            )}
                        </>
                    ) : error ? (
                        <Alert
                            style={{ marginTop: 16 }}
                            type="error"
                            description={<>{t("tonieboxes.boxSetup.identifyVersion.errorMac")}</>}
                        />
                    ) : (
                        ""
                    )}
                    <Paragraph style={{ marginTop: 16 }}>
                        {!vendor ? (
                            <>
                                {t("tonieboxes.boxSetup.identifyVersion.generalInstruction1")}{" "}
                                <Tooltip title={t("tonieboxes.boxSetup.openBoxGuide.linkTooltip")}>
                                    <Link to="/tonieboxes/boxsetup/openboxguide">
                                        {t("tonieboxes.boxSetup.identifyVersion.generalInstructionLinkText")}
                                    </Link>
                                </Tooltip>{" "}
                                {t("tonieboxes.boxSetup.identifyVersion.generalInstruction2")}
                            </>
                        ) : (
                            ""
                        )}
                        {versionTabs}
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
