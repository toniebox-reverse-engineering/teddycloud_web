import { Typography, Alert, Image, Table, TabsProps, Tabs } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import cc3200debugPort from "../../../../../assets/boxSetup/cc3200_debugPort.jpg";
import cc3200tagConnector from "../../../../../assets/boxSetup/cc3200_tagConnector.png";
import cc3200WiresAsTagConnect from "../../../../../assets/boxSetup/cc3200_wiresAsTagConnector.png";
import { TonieboxWifiGuide } from "../../common/elements/TonieboxWifiGuide";
import { Uart3v3Hint } from "../../common/elements/Uart3v3Hint";
import { installCC3200Tool } from "../elements/InstallCC3200Tool";
import { ExportOutlined, WarningFilled } from "@ant-design/icons";
import { HwTool } from "../CC3200FlashingGuide";

const { Paragraph } = Typography;

interface Step0PreparationsProps {
    hwTool: HwTool;
    onHwToolChange: (tool: HwTool) => void;
}

export const Step0Preparations: React.FC<Step0PreparationsProps> = ({ hwTool, onHwToolChange }) => {
    const { t } = useTranslation();

    const activeKey = hwTool === "uart" ? "uartHW" : "esp32c3HW";

    const handleTabChange = (newKey: string) => {
        if (newKey.startsWith("uart")) {
            onHwToolChange("uart");
        } else {
            onHwToolChange("esp32c3");
        }
    };

    const debugPortUARTData = [
        { key: "1", toniebox1: "GND", toniebox2: "", uart: "GND" },
        { key: "2", toniebox1: "TX", toniebox2: "", uart: "RX" },
        { key: "3", toniebox1: "RX", toniebox2: "", uart: "TX" },
        { key: "4", toniebox1: "RST", toniebox2: "", uart: "DTR" },
        { key: "5", toniebox1: "VCC", toniebox2: "SOP2*", uart: "" },
        { key: "6", toniebox1: "SOP2", toniebox2: "VCC*", uart: "" },
    ];

    const TonieboxUARTTable = () => {
        const columns = [
            { title: "Toniebox", dataIndex: "toniebox1", key: "toniebox1" },
            { title: "Toniebox", dataIndex: "toniebox2", key: "toniebox2" },
            { title: "UART", dataIndex: "uart", key: "uart" },
        ];
        return (
            <Table
                dataSource={debugPortUARTData}
                columns={columns}
                pagination={false}
                bordered
                size="small"
                style={{ width: 300 }}
            />
        );
    };

    const ESP32C3ConfigSettingsData = [
        { key: "0", setting: "Baud Rate", value: "921600" },
        { key: "1", setting: "TX GPIO Pin", value: "GPIO 20" },
        { key: "2", setting: "RX GPIO Pin", value: "GPIO 21" },
        { key: "3", setting: "Reset GPIO Pin", value: "GPIO 10" },
        { key: "4", setting: "Control GPIO Pin", value: "GPIO 9" },
        { key: "5", setting: "LED GPIO Pin", value: "GPIO 8" },
    ];

    const ESP32C3ConfigSettingsTable = () => {
        const columns = [
            { title: "Setting", dataIndex: "setting", key: "setting" },
            { title: "Value", dataIndex: "value", key: "value" },
        ];
        return (
            <Table
                dataSource={ESP32C3ConfigSettingsData}
                columns={columns}
                pagination={false}
                bordered
                size="small"
                style={{ width: 300 }}
            />
        );
    };

    const debugPortESP32C3UartGatewayData = [
        { key: "1", toniebox1: "GND", toniebox2: "", esp32: "GND" },
        { key: "2", toniebox1: "TX", toniebox2: "", esp32: "GPIO 21 (RX)" },
        { key: "3", toniebox1: "RX", toniebox2: "", esp32: "GPIO 20 (TX)" },
        { key: "4", toniebox1: "RST", toniebox2: "", esp32: "GPIO 10 (DTR)" },
        { key: "5", toniebox1: "VCC", toniebox2: "SOP2*", esp32: "" },
        { key: "6", toniebox1: "SOP2", toniebox2: "VCC*", esp32: "" },
    ];

    const TonieboxESP32C3UartGatewayTable = () => {
        const columns = [
            { title: "Toniebox", dataIndex: "toniebox1", key: "toniebox1" },
            { title: "Toniebox", dataIndex: "toniebox2", key: "toniebox2" },
            { title: "ESP32-C3", dataIndex: "esp32", key: "esp32" },
        ];
        return (
            <Table
                dataSource={debugPortESP32C3UartGatewayData}
                columns={columns}
                pagination={false}
                bordered
                size="small"
                style={{ width: 300 }}
            />
        );
    };

    const dedicatedUartTab = (
        <>
            <Uart3v3Hint />
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.connectToTonieboxConnectTableIntro")}
            </Paragraph>
            <Paragraph style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <TonieboxUARTTable />
            </Paragraph>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.connectToTonieboxConnectTableExplanation")}
            </Paragraph>
        </>
    );

    const esp32C3UartGatewayTab = (
        <>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.esp32C3UartGateway.intro")}</Paragraph>
            <ul>
                <li>{t("tonieboxes.cc3200BoxFlashing.esp32C3UartGateway.prepareStep1")}</li>
                <li>
                    {t("tonieboxes.cc3200BoxFlashing.esp32C3UartGateway.prepareStep2")}{" "}
                    <Link
                        to="https://g3gg0.github.io/ESP32-UART-Gateway/flasher.html"
                        target="_blank" rel="noopener noreferrer"
                    >
                        Flashing ESP32-C3 {<ExportOutlined />}
                    </Link>
                </li>
                <li>{t("tonieboxes.cc3200BoxFlashing.esp32C3UartGateway.prepareStep3")}</li>
                <li>
                    <Paragraph>
                        {t("tonieboxes.cc3200BoxFlashing.esp32C3UartGateway.prepareStep4")}
                    </Paragraph>
                    <Paragraph
                        style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}
                    >
                        <ESP32C3ConfigSettingsTable />
                    </Paragraph>
                </li>

                <li>
                    <Paragraph>
                        {t("tonieboxes.cc3200BoxFlashing.esp32C3UartGateway.prepareStep5")}
                    </Paragraph>
                </li>
                <Paragraph style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                    <TonieboxESP32C3UartGatewayTable />
                </Paragraph>
            </ul>
        </>
    );

    const uartTabs: TabsProps["items"] = [
        {
            key: "uartHW",
            label: t("tonieboxes.cc3200BoxFlashing.dedicatedUart"),
            children: dedicatedUartTab,
        },
        {
            key: "esp32c3HW",
            label:
                t("tonieboxes.cc3200BoxFlashing.esp32C3UartGateway.new") +
                "! " +
                t("tonieboxes.cc3200BoxFlashing.esp32C3UartGateway.title"),
            children: esp32C3UartGatewayTab,
        },
    ];

    return (
        <>
            <h3>{t("tonieboxes.boxFlashingCommon.preparations")}</h3>
            <Alert
                type="error"
                showIcon
                icon={<WarningFilled />}
                title={t("tonieboxes.warningUseAtYourOwnRisk")}
                description={t("tonieboxes.warningUseAtYourOwnRiskText")}
                style={{ marginBottom: 16 }}
            />
            <Alert
                type="warning"
                closable={{ closeIcon: true, "aria-label": "close" }}
                showIcon
                title={t("tonieboxes.hintLatestFirmwareTitle")}
                description={
                    <>
                        <Paragraph>{t("tonieboxes.hintLatestFirmware")}</Paragraph>
                        <Paragraph>
                            {t("tonieboxes.hintLatestFirmwareFactoryResetCC3200")}
                        </Paragraph>
                    </>
                }
                style={{ marginBottom: 16 }}
            />

            <Paragraph>
                <TonieboxWifiGuide />
            </Paragraph>

            {installCC3200Tool()}

            <h4>{t("tonieboxes.cc3200BoxFlashing.connectToToniebox")}</h4>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.connectToTonieboxIntro")}
                <Paragraph>
                    <Image
                        src={cc3200debugPort}
                        style={{ maxHeight: 200, width: "auto", marginTop: 8 }}
                        alt={t("tonieboxes.cc3235BoxFlashing.flashCollapse.cc3235flash")}
                    />
                </Paragraph>
                <Tabs
                    onChange={handleTabChange}
                    activeKey={activeKey}
                    items={uartTabs}
                    indicator={{ size: (origin) => origin - 20, align: "center" }}
                />
            </Paragraph>

            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.connectToTonieboxConnectDebugPortText1")}
                <Link
                    to="https://www.tag-connect.com/product/tc2050-idc-nl-10-pin-no-legs-cable-with-ribbon-connector"
                    target="_blank" rel="noopener noreferrer"
                >
                    TC2050-IDC-NL TagConnector {<ExportOutlined />}
                </Link>
                {t("tonieboxes.cc3200BoxFlashing.connectToTonieboxConnectDebugPortText2")}
            </Paragraph>

            <Paragraph
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: 16,
                }}
            >
                <Image.PreviewGroup>
                    <div style={{ maxHeight: 200, justifyItems: "center" }}>
                        <Image
                            src={cc3200tagConnector}
                            style={{ maxWidth: 200, height: "auto" }}
                            alt={t("tonieboxes.cc3200BoxFlashing.tagConnector")}
                        />
                        <p style={{ marginTop: 8 }}>
                            {t("tonieboxes.cc3200BoxFlashing.tagConnector")}
                        </p>
                    </div>
                    <div style={{ maxHeight: 200, justifyItems: "center" }}>
                        <Image
                            src={cc3200WiresAsTagConnect}
                            style={{ maxWidth: 200, height: "auto" }}
                            alt={t("tonieboxes.cc3200BoxFlashing.usingThinWiresAsTagConnector")}
                        />
                        <p style={{ marginTop: 8 }}>
                            {t("tonieboxes.cc3200BoxFlashing.usingThinWiresAsTagConnector")}
                        </p>
                    </div>
                </Image.PreviewGroup>
            </Paragraph>

            <Paragraph>
                {hwTool === "uart"
                    ? t("tonieboxes.cc3200BoxFlashing.connectToTonieboxTextUart") + " "
                    : ""}
                {t("tonieboxes.cc3200BoxFlashing.connectToTonieboxText")}
            </Paragraph>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.connectToTonieboxProceed")}</Paragraph>
        </>
    );
};
