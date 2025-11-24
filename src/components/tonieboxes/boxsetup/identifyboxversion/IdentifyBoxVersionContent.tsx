import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Col, Form, Input, Row, Typography, Image, Tabs, TabsProps, theme, Tooltip } from "antd";
import { CloseOutlined, CodeOutlined } from "@ant-design/icons";

import pcb3235Image from "../../../../assets/boxSetup/3235_pcb.png";
import pcb3235ImagePreview from "../../../../assets/boxSetup/3235_pcb_preview.png";
import pcb3200Image from "../../../../assets/boxSetup/3200_pcb.png";
import pcb3200ImagePreview from "../../../../assets/boxSetup/3200_pcb_preview.png";
import chip3200Image from "../../../../assets/boxSetup/cc3200.jpg";
import chip3235Image from "../../../../assets/boxSetup/cc3235.jpg";
import pcbesp32Image from "../../../../assets/boxSetup/esp32_pcb.png";
import pcbesp32ImagePreview from "../../../../assets/boxSetup/esp32_pcb_preview.png";
import chipesp32Image from "../../../../assets/boxSetup/esp32.jpg";

import { useMacVendorLookup } from "./hooks/useMacVendorLookup";
import { useBoxVersionActiveKey } from "./hooks/useBoxVersionActiveKey";

const { Paragraph } = Typography;
const { useToken } = theme;

export const IdentifyBoxVersionContent: React.FC = () => {
    const { t } = useTranslation();
    const { token } = useToken();
    const navigate = useNavigate();

    const { boxMac, warningTextMac, vendor, error, handleMacChange, handleClear, checkMac } = useMacVendorLookup();

    const { activeKey, setActiveKey } = useBoxVersionActiveKey(vendor);

    return (
        <>
            <h1>{t("tonieboxes.boxSetup.identifyVersion.title")}</h1>

            <MacIdentifyForm
                boxMac={boxMac}
                warningTextMac={warningTextMac}
                onMacChange={handleMacChange}
                onClear={handleClear}
                onIdentify={checkMac}
                disabled={boxMac.length > 17 || boxMac.length === 0}
                tokenColorText={token.colorText}
                tokenColorTextDisabled={token.colorTextDisabled}
            />

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
                    ) : null}
                </>
            ) : error ? (
                <Alert
                    style={{ marginTop: 16 }}
                    type="error"
                    description={<>{t("tonieboxes.boxSetup.identifyVersion.errorMac")}</>}
                />
            ) : null}

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
                ) : null}
            </Paragraph>

            <BoxVersionTabs
                vendor={vendor}
                activeKey={activeKey}
                onActiveKeyChange={setActiveKey}
                onProceed={(key) => navigate(`../tonieboxes/boxsetup/${key}/flashing`)}
            />
        </>
    );
};

interface MacIdentifyFormProps {
    boxMac: string;
    warningTextMac: string;
    onMacChange: (value: string) => void;
    onClear: () => void;
    onIdentify: () => void;
    disabled: boolean;
    tokenColorText: string;
    tokenColorTextDisabled: string;
}

const MacIdentifyForm: React.FC<MacIdentifyFormProps> = ({
    boxMac,
    warningTextMac,
    onMacChange,
    onClear,
    onIdentify,
    disabled,
    tokenColorText,
    tokenColorTextDisabled,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();

    return (
        <Form>
            <Paragraph>{t("tonieboxes.boxSetup.identifyVersion.identifyUsingMac")} </Paragraph>
            <Form.Item>
                <Row align="middle" style={{ display: "flex", alignItems: "center" }}>
                    <Col
                        style={{
                            flex: "0 0 250px",
                            color: warningTextMac ? token.colorErrorText : "unset",
                        }}
                    >
                        <label>{t("tonieboxes.boxSetup.identifyVersion.mac")}</label>
                    </Col>
                    <Col style={{ flex: "1 1 auto" }}>
                        <Input
                            type="text"
                            value={boxMac}
                            onChange={(e) => onMacChange(e.target.value)}
                            suffix={
                                <CloseOutlined
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={onClear}
                                    style={{
                                        color: boxMac ? tokenColorText : tokenColorTextDisabled,
                                        cursor: boxMac ? "pointer" : "default",
                                    }}
                                />
                            }
                        />
                    </Col>
                </Row>
                {warningTextMac && <p style={{ color: token.colorErrorText }}>{warningTextMac}</p>}
            </Form.Item>
            <Button icon={<CodeOutlined />} disabled={disabled} type="primary" onClick={onIdentify}>
                {t("tonieboxes.boxSetup.identifyVersion.identify")}
            </Button>
            <Paragraph style={{ fontSize: "small", marginTop: 16 }}>
                {t("tonieboxes.boxSetup.identifyVersion.macvendors")}{" "}
                <Link to="https://macvendors.com/" target="_blank">
                    {t("tonieboxes.boxSetup.identifyVersion.macvendorsLink")}
                </Link>
            </Paragraph>
        </Form>
    );
};

interface BoxVersionTabsProps {
    vendor: string | null;
    activeKey: string;
    onActiveKeyChange: (key: string) => void;
    onProceed: (key: string) => void;
}

const BoxVersionTabs: React.FC<BoxVersionTabsProps> = ({ vendor, activeKey, onActiveKeyChange, onProceed }) => {
    const { t } = useTranslation();

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
                        />
                    </Paragraph>
                    <Paragraph style={{ maxWidth: "100%" }}>
                        <Image src={chip3200Image} style={{ height: 300, width: "auto" }} alt="Chip CC3200" />
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
                        />
                    </Paragraph>
                    <Paragraph style={{ maxWidth: "100%" }}>
                        <Image src={chip3235Image} style={{ height: 300, width: "auto" }} alt="Chip CC3235" />
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
                        />
                    </Paragraph>
                    <Paragraph style={{ maxWidth: "100%" }}>
                        <Image src={chipesp32Image} style={{ height: 300, width: "auto" }} alt="Chip ESP32" />
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

    const filteredItems = versionItems.filter(
        (item) =>
            ((vendor?.toLowerCase().includes("texas") || !vendor) &&
                (item.key === "cc3200" || item.key === "cc3235")) ||
            ((vendor?.toLowerCase().includes("espressif") || !vendor) && item.key === "esp32")
    );

    return (
        <>
            <Tabs
                activeKey={activeKey}
                onChange={onActiveKeyChange}
                defaultActiveKey={vendor?.toLowerCase().includes("espressif") ? "esp32" : "cc3200"}
                items={filteredItems}
                indicator={{ size: (origin) => origin - 20, align: "center" }}
            />
            <Paragraph>{t("tonieboxes.boxSetup.identifyVersion.proceedToFlash1")} </Paragraph>
            <Paragraph style={{ marginTop: 16 }}>
                <Button type="primary" onClick={() => onProceed(activeKey)}>
                    {`${activeKey.toUpperCase()} ${t("tonieboxes.boxSetup.identifyVersion.proceedToFlashLinkText")}`}
                </Button>
            </Paragraph>
        </>
    );
};
