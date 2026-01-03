import { Typography, Alert, Image, Table } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import cc3200debugPort from "../../../../../assets/boxSetup/cc3200_debugPort.jpg";
import cc3200tagConnector from "../../../../../assets/boxSetup/cc3200_tagConnector.png";
import cc3200WiresAsTagConnect from "../../../../../assets/boxSetup/cc3200_wiresAsTagConnector.png";
import { TonieboxWifiGuide } from "../../common/elements/TonieboxWifiGuide";
import { Uart3v3Hint } from "../../common/elements/Uart3v3Hint";
import { installCC3200Tool } from "../elements/InstallCC3200Tool";
import { ExportOutlined, WarningFilled } from "@ant-design/icons";

const { Paragraph } = Typography;

export const Step0Preparations: React.FC = () => {
    const { t } = useTranslation();

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
                        <Paragraph>{t("tonieboxes.hintLatestFirmwareFactoryResetCC3200")}</Paragraph>
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
                <Uart3v3Hint />
                <Paragraph>{t("tonieboxes.cc3200BoxFlashing.connectToTonieboxConnectTableIntro")}</Paragraph>
                <TonieboxUARTTable />
                <Paragraph>{t("tonieboxes.cc3200BoxFlashing.connectToTonieboxConnectTableExplanation")}</Paragraph>
            </Paragraph>

            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.connectToTonieboxConnectDebugPortText1")}
                <Link
                    to="https://www.tag-connect.com/product/tc2050-idc-nl-10-pin-no-legs-cable-with-ribbon-connector"
                    target="_blank"
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
                        <p style={{ marginTop: 8 }}>{t("tonieboxes.cc3200BoxFlashing.tagConnector")}</p>
                    </div>
                    <div style={{ maxHeight: 200, justifyItems: "center" }}>
                        <Image
                            src={cc3200WiresAsTagConnect}
                            style={{ maxWidth: 200, height: "auto" }}
                            alt={t("tonieboxes.cc3200BoxFlashing.usingThinWiresAsTagConnector")}
                        />
                        <p style={{ marginTop: 8 }}>{t("tonieboxes.cc3200BoxFlashing.usingThinWiresAsTagConnector")}</p>
                    </div>
                </Image.PreviewGroup>
            </Paragraph>

            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.connectToTonieboxText")}</Paragraph>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.connectToTonieboxProceed")}</Paragraph>
        </>
    );
};
