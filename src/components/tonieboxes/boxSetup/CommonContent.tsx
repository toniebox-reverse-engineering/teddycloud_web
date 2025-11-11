import { useState, useEffect, JSX } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Button, Collapse, Empty, Image, Modal, Space, Spin, Table, Typography } from "antd";

import { TeddyCloudApi } from "../../../api";
import { defaultAPIConfig } from "../../../config/defaultApiConfig";

import tbEsp32UartClamp from "../../../assets/boxSetup/tb-esp32-uart-clamp.png";
import tbEsp32UartAnalogClamp from "../../../assets/boxSetup/esp32_pcb_clamp.png";
import tbEsp32Uart from "../../../assets/boxSetup/tb-esp32-uart.png";
import jumper1 from "../../../assets/boxSetup/jumper/uart_3v3-5V_jumper_black.jpg";
import jumper2 from "../../../assets/boxSetup/jumper/uart_3v3-5V_jumper_switch.jpg";
import jumper3 from "../../../assets/boxSetup/jumper/uart_3v3-5V_jumper_yellow.jpg";

import { BoxVersionsEnum, TonieboxCardProps } from "../../../types/tonieboxTypes";
import CodeSnippet from "../../utils/CodeSnippet";
import { handleTCCADerDownload, parseFormattedText } from "../../../utils/helpers";
import { CertificateDragNDrop } from "../../form/CertificatesDragAndDrop";

interface TonieboxPropsWithStatusAndVersion extends TonieboxCardProps {
    status: string;
    version: string;
}

interface AvailableBoxesModalProps {
    boxVersion: string;
    isOpen: boolean;
    onClose: () => void;
}

const api = new TeddyCloudApi(defaultAPIConfig());

const { Paragraph, Text } = Typography;

export function uart3v3Hint(): JSX.Element {
    const { t } = useTranslation();

    return (
        <Alert
            type="warning"
            showIcon
            message={t("tonieboxes.boxSetup.UARTHint.title")}
            description={
                <>
                    <Paragraph>{t("tonieboxes.boxSetup.UARTHint.noUSBCVersion")}</Paragraph>
                    <Paragraph>{t("tonieboxes.boxSetup.UARTHint.description")}</Paragraph>
                    <ol style={{ paddingLeft: 20 }}>
                        <li>
                            <Space direction="vertical" size="small" style={{ display: "flex", marginTop: 8 }}>
                                <Text strong>{t("tonieboxes.boxSetup.UARTHint.voltageCompatibility")}</Text>
                                <Paragraph>
                                    <Paragraph>{t("tonieboxes.boxSetup.UARTHint.voltageCompatibilityText1")}</Paragraph>
                                    <Paragraph>{t("tonieboxes.boxSetup.UARTHint.voltageCompatibilityText2")}</Paragraph>
                                </Paragraph>
                                <Space size="small">
                                    <Image
                                        src={jumper1}
                                        preview={false}
                                        alt={t("tonieboxes.boxSetup.UARTHint.imageAlt1")}
                                        style={{ maxHeight: 75 }}
                                    />
                                    <Image
                                        src={jumper2}
                                        preview={false}
                                        alt={t("tonieboxes.boxSetup.UARTHint.imageAlt2")}
                                        style={{ maxHeight: 75 }}
                                    />
                                    <Image
                                        src={jumper3}
                                        preview={false}
                                        alt={t("tonieboxes.boxSetup.UARTHint.imageAlt3")}
                                        style={{ maxHeight: 75 }}
                                    />
                                </Space>
                                <Paragraph>
                                    <Text strong type="danger">
                                        {t("tonieboxes.boxSetup.UARTHint.warning")}
                                    </Text>
                                </Paragraph>
                            </Space>
                        </li>
                        <li>
                            <Space direction="vertical" size="small" style={{ display: "flex", marginTop: 8 }}>
                                <Text strong>{t("tonieboxes.boxSetup.UARTHint.uartDriver")}</Text>
                                <Paragraph>{t("tonieboxes.boxSetup.UARTHint.updateDriver")}</Paragraph>
                            </Space>
                        </li>
                    </ol>
                </>
            }
        />
    );
}

export function connectESP32Explanation(): JSX.Element {
    const { t } = useTranslation();

    return (
        <>
            <Paragraph>{uart3v3Hint()}</Paragraph>
            <Paragraph>{t("tonieboxes.connectESP32Modal.connectESP32Text1")}</Paragraph>
            <Paragraph
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                }}
            >
                <Image
                    src={tbEsp32Uart}
                    style={{ height: 200, width: "auto" }}
                    preview={false}
                    alt={t("tonieboxes.connectESP32Modal.esp32UartJ103")}
                />
            </Paragraph>
            <h5>{t("tonieboxes.connectESP32Modal.esp32UartJ103ClampTitle")}</h5>
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
                    <div style={{ maxWidth: 200 }}>
                        <Image
                            style={{ height: 200, width: "auto" }}
                            src={tbEsp32UartClamp}
                            alt={t("tonieboxes.connectESP32Modal.esp32UartJ103Clamp")}
                        />
                        <Paragraph style={{ marginTop: 8 }}>
                            {t("tonieboxes.connectESP32Modal.esp32UartJ103Clamp")}
                        </Paragraph>
                    </div>
                    <div style={{ maxWidth: 200 }}>
                        <Image
                            style={{ height: 200, width: "auto" }}
                            src={tbEsp32UartAnalogClamp}
                            alt={t("tonieboxes.connectESP32Modal.esp32UartJ103AnalogClamp")}
                        />
                        <Paragraph style={{ marginTop: 8 }}>
                            {t("tonieboxes.connectESP32Modal.esp32UartJ103AnalogClamp")}
                        </Paragraph>
                    </div>
                </Image.PreviewGroup>
            </Paragraph>
            <Paragraph>{t("tonieboxes.connectESP32Modal.esp32UartJ103Clamp4PinHint")}</Paragraph>

            <Paragraph>{t("tonieboxes.connectESP32Modal.connectESP32Text2")}</Paragraph>
            <Alert
                type="warning"
                message={t("tonieboxes.connectESP32Modal.beware")}
                description={t("tonieboxes.connectESP32Modal.warningText")}
            />
            <h5>{t("tonieboxes.connectESP32Modal.normalMode")}</h5>
            <Paragraph>{t("tonieboxes.connectESP32Modal.normalModeText")}</Paragraph>

            <CodeSnippet
                language="shell"
                code={`ESP-ROM:esp32s3-20210327
Build:Mar 27 2021
rst:0x1 (POWERON),boot:0x8 (SPI_FAST_FLASH_BOOT)
SPIWP:0xee
mode:DIO, clock div:1
load:0x3fcd0108,len:0x118
load:0x403b6000,len:0xb90
load:0x403ba000,len:0x27f4
entry 0x403b61c4
+ gibberish`}
            />

            <h5>{t("tonieboxes.connectESP32Modal.downloadMode")}</h5>
            <Paragraph>{t("tonieboxes.connectESP32Modal.downloadModeText")}</Paragraph>

            <CodeSnippet
                language="shell"
                code={`ESP-ROM:esp32s3-20210327
Build:Mar 27 2021
rst:0x1 (POWERON),boot:0x0 (DOWNLOAD(USB/UART0))
waiting for download
J103 Pinout`}
            />
        </>
    );
}

export function certificateIntro(asC2Der: boolean): JSX.Element {
    const { t } = useTranslation();
    return (
        <>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.certificatesIntro")}</Paragraph>
            <Paragraph>
                <Button onClick={() => handleTCCADerDownload(asC2Der)}>
                    {asC2Der ? t("tonieboxes.downloadC2DerFile") : t("tonieboxes.downloadCADerFile")}
                </Button>
            </Paragraph>
            <h4>{t("tonieboxes.boxFlashingCommon.dumpCertificates")}</h4>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.dumpCertificatesIntro1")}</Paragraph>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.dumpCertificatesIntro2")}</Paragraph>
        </>
    );
}

export function installCC3200Tool(): JSX.Element {
    const { t } = useTranslation();
    return (
        <>
            <h4>{t("tonieboxes.boxFlashingCommon.installCC3200Tool.title")}</h4>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.installCC3200Tool.intro")}</Paragraph>
            <ul>
                <li>
                    {t("tonieboxes.boxFlashingCommon.installCC3200Tool.pythonText1")}
                    <Link to="https://www.python.org/downloads/" target="_blank">
                        {t("tonieboxes.boxFlashingCommon.installCC3200Tool.pythonTextLink")}
                    </Link>
                    {t("tonieboxes.boxFlashingCommon.installCC3200Tool.pythonText2")}
                </li>
                <li>
                    {t("tonieboxes.boxFlashingCommon.installCC3200Tool.gitText1")}
                    <Link to="https://git-scm.com/book/en/v2/Getting-Started-Installing-Git" target="_blank">
                        {t("tonieboxes.boxFlashingCommon.installCC3200Tool.gitTextLink")}
                    </Link>
                    {t("tonieboxes.boxFlashingCommon.installCC3200Tool.gitText2")}
                </li>
                <li>
                    {t("tonieboxes.boxFlashingCommon.installCC3200Tool.pipText1")}
                    <Link to="https://pip.pypa.io/en/stable/installation/" target="_blank">
                        {t("tonieboxes.boxFlashingCommon.installCC3200Tool.pipTextLink")}
                    </Link>
                    {t("tonieboxes.boxFlashingCommon.installCC3200Tool.pipText2")}
                </li>
            </ul>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.installCC3200Tool.text")}</Paragraph>

            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`pip install git+git://github.com/toniebox-reverse-engineering/cc3200tool.git`}
                />
            </Paragraph>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.installCC3200Tool.textAlternatively")}</Paragraph>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`pip install git+https://github.com/toniebox-reverse-engineering/cc3200tool.git`}
                />
            </Paragraph>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.installCC3200Tool.moreInformation")}</Paragraph>
            <Link to="https://github.com/toniebox-reverse-engineering/cc3200tool" target="_blank">
                {t("tonieboxes.boxFlashingCommon.installCC3200Tool.link")}
            </Link>
        </>
    );
}

export function dnsForTeddyCloud(): JSX.Element {
    const { t } = useTranslation();
    return (
        <>
            <h4>{t("tonieboxes.boxFlashingCommon.dnsHint")}</h4>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.dnsText1")}</Paragraph>
            <Alert
                type="warning"
                showIcon
                message={t("tonieboxes.boxFlashingCommon.dnsBeware")}
                description={t("tonieboxes.boxFlashingCommon.dnsBewareText")}
                style={{ marginBottom: 16 }}
            />
            <h4>{t("tonieboxes.boxFlashingCommon.alternativeDNSSolutions")}</h4>
            <h5>{t("tonieboxes.boxFlashingCommon.openWrt.usingOpenWrt")}</h5>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.openWrt.dnsText2")}</Paragraph>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`uci set dhcp.teddycloud="tag"
uci set dhcp.teddycloud.dhcp_option="3,1.2.3.4" # 1.2.3.4=teddycloud ip

uci add dhcp host
uci set dhcp.@host[-1].name="toniebox_1"
uci set dhcp.@host[-1].mac="00:11:22:33:44:55" # toniebox mac
uci set dhcp.@host[-1].ip="1.2.3.101" # toniebox_1 ip
uci set dhcp.@host[-1].tag="teddycloud"
uci commit dhcp
/etc/init.d/dnsmasq restart`}
                />
            </Paragraph>
            <h5>{t("tonieboxes.boxFlashingCommon.adguard.usingAdGuard")}</h5>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.setupInstructionsTitle")}</Paragraph>

            <strong>{t("tonieboxes.boxFlashingCommon.adguard.prerequisitesTitle")}</strong>
            <ul>
                <li>
                    {t("tonieboxes.boxFlashingCommon.adguard.adGuardRequirement")}
                    <ul style={{ marginBottom: 0 }}>
                        <li>
                            {" "}
                            {t("tonieboxes.boxFlashingCommon.adguard.moreInformation")}{" "}
                            <Link to="https://adguard.com/" target="_blank">
                                https://adguard.com/
                            </Link>
                        </li>
                    </ul>
                </li>
                <li>{t("tonieboxes.boxFlashingCommon.adguard.teddyCloudIp")}</li>
                <li>{t("tonieboxes.boxFlashingCommon.adguard.tonieboxIp")}</li>
            </ul>

            <Paragraph>
                <strong>{t("tonieboxes.boxFlashingCommon.adguard.stepsTitle")}</strong>
            </Paragraph>

            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.step1Title")}</Paragraph>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.step1Instructions")}</Paragraph>

            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.step2Title")}</Paragraph>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.step2Instructions")}</Paragraph>

            <CodeSnippet
                language="shell"
                code={`||prod.de.tbs.toys^$dnsrewrite=NOERROR;A;XXX.XXX.XXX.XXX,client=YYY.YYY.YYY.YYY
||rtnl.bxcl.de^$dnsrewrite=NOERROR;A;XXX.XXX.XXX.XXX,client=YYY.YYY.YYY.YYY`}
            />

            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.explanationTitle")}</Paragraph>
            <Paragraph>
                <strong>||prod.de.tbs.toys^</strong>: {t("tonieboxes.boxFlashingCommon.adguard.prodDomainExplanation")}
            </Paragraph>
            <Paragraph>
                <strong>$dnsrewrite=NOERROR;A;XXX.XXX.XXX.XXX</strong>:{" "}
                {t("tonieboxes.boxFlashingCommon.adguard.dnsRewriteExplanation")}
            </Paragraph>
            <Paragraph>
                <strong>client=YYY.YYY.YYY.YYY</strong>: {t("tonieboxes.boxFlashingCommon.adguard.clientExplanation")}
            </Paragraph>

            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.step3Title")}</Paragraph>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.step3Instructions")}</Paragraph>

            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.step4Title")}</Paragraph>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.ipReservationInstructions")}</Paragraph>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.loggingMonitoringInstructions")}</Paragraph>
        </>
    );
}

const AvailableBoxesModal: React.FC<AvailableBoxesModalProps> = ({ boxVersion, isOpen, onClose }) => {
    const { t } = useTranslation();
    const [tonieboxes, setTonieboxes] = useState<TonieboxPropsWithStatusAndVersion[]>([]);
    const [recheckTonieboxes, setRecheckTonieboxes] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (isOpen) {
            fetchTonieboxes();
        }
    }, [isOpen, recheckTonieboxes]);

    const fetchTonieboxes = async () => {
        setLoading(true);
        try {
            const tonieboxData = await api.apiGetTonieboxesIndex();
            const updatedBoxes = await Promise.all(
                tonieboxData.map(async (box) => {
                    const tonieboxStatus = await api.apiGetTonieboxStatus(box.ID);
                    const statusString = tonieboxStatus ? "Online" : "Offline";
                    const tonieboxVersion = await api.apiGetTonieboxVersion(box.ID);
                    const BoxVersions: { [key: string]: string } = {
                        "0": "UNKNOWN",
                        "1": "CC3200",
                        "2": "CC3235",
                        "3": "ESP32",
                    };
                    let version = BoxVersions[tonieboxVersion] || "UNKNOWN";
                    return {
                        ...box,
                        status: statusString,
                        version,
                    };
                })
            );

            setTonieboxes(updatedBoxes);
        } catch (error) {
            console.error("Error fetching tonieboxes:", error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: t("tonieboxes.availableBoxModal.commonName"),
            dataIndex: "commonName",
            key: "commonName",
        },
        {
            title: t("tonieboxes.availableBoxModal.boxVersion"),
            dataIndex: "version",
            key: "version",
        },
        {
            title: t("tonieboxes.availableBoxModal.status"),
            dataIndex: "status",
            key: "status",
        },
    ];

    const availableBoxesFooter = (
        <Paragraph style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Button
                onClick={async () => {
                    setLoading(true);
                    setRecheckTonieboxes((prev) => !prev);
                    await fetchTonieboxes();
                }}
            >
                {t("tonieboxes.availableBoxModal.recheck")}
            </Button>
            <Button type="primary" onClick={onClose}>
                {t("tonieboxes.availableBoxModal.ok")}
            </Button>
        </Paragraph>
    );

    const renderEmpty = () => (
        <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
                <div>
                    <Paragraph>{t("tonieboxes.noData")}</Paragraph>
                    <Paragraph>{t("tonieboxes.noDataText")}</Paragraph>
                </div>
            }
        />
    );

    return (
        <Modal
            title={t("tonieboxes.availableBoxModal.availableBoxes", { boxVersion: boxVersion })}
            open={isOpen}
            onOk={onClose}
            onCancel={onClose}
            footer={availableBoxesFooter}
        >
            <Paragraph>
                <Paragraph>
                    {t("tonieboxes.availableBoxModal.newBoxAvailable", {
                        cc3200Hint:
                            boxVersion === BoxVersionsEnum.cc3200 ? t("tonieboxes.availableBoxModal.cc3200Hint") : "",
                    })}
                </Paragraph>
                <Link
                    to="https://tonies-wiki.revvox.de/docs/tools/teddycloud/setup/test-troubleshooting/"
                    target="_blank"
                >
                    {t("tonieboxes.availableBoxModal.troubleShooting")}
                </Link>
            </Paragraph>

            <h4>{t("tonieboxes.availableBoxModal.availableBoxes", { boxVersion: boxVersion })}</h4>
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
                    <Spin size="default" />
                </div>
            ) : (
                <Table
                    dataSource={tonieboxes.filter((box) => box.version === boxVersion)}
                    columns={columns}
                    rowKey="ID"
                    pagination={false}
                    locale={{ emptyText: renderEmpty() }}
                />
            )}
            {tonieboxes.filter((box) => box.version === boxVersion).length > 0 ? (
                <Paragraph style={{ marginTop: 16 }}>
                    {t("tonieboxes.boxSetup.uploadCertificatesToBox")}
                    <Link to="/tonieboxes">{t("tonieboxes.navigationTitle")}</Link>
                </Paragraph>
            ) : (
                ""
            )}
        </Modal>
    );
};

export default AvailableBoxesModal;

export const CertificateUploadElement: React.FC = ({}) => {
    const { t } = useTranslation();
    const [isCertificateUploadModalOpen, setIsCertificateUploadModalOpen] = useState(false);

    const showCertificateUploadModal = () => {
        setIsCertificateUploadModalOpen(true);
    };

    const handleClose = () => {
        setIsCertificateUploadModalOpen(false);
    };

    const certificateUploadModal = (
        <Modal
            title={t("tonieboxes.boxSetup.uploadCertificates")}
            open={isCertificateUploadModalOpen}
            onCancel={handleClose}
            footer={
                <Button type="primary" onClick={handleClose}>
                    {t("settings.close")}
                </Button>
            }
            cancelText="Close"
        >
            <CertificateDragNDrop />
        </Modal>
    );

    return (
        <>
            <Paragraph>{t("tonieboxes.boxSetup.uploadCertificateIntro")}</Paragraph>
            <Paragraph>
                <Button onClick={showCertificateUploadModal}>{t("tonieboxes.boxSetup.uploadCertificateButton")}</Button>
                {certificateUploadModal}
            </Paragraph>
        </>
    );
};

export const TonieboxWifiGuide: React.FC = ({}) => {
    const { t } = useTranslation();

    const steps = [
        t("tonieboxes.boxFlashingCommon.connectTBToWifi.step1"),
        t("tonieboxes.boxFlashingCommon.connectTBToWifi.step2"),
        t("tonieboxes.boxFlashingCommon.connectTBToWifi.step3"),
        t("tonieboxes.boxFlashingCommon.connectTBToWifi.step4"),
        t("tonieboxes.boxFlashingCommon.connectTBToWifi.step5"),
        t("tonieboxes.boxFlashingCommon.connectTBToWifi.step6"),
        t("tonieboxes.boxFlashingCommon.connectTBToWifi.step7"),
        t("tonieboxes.boxFlashingCommon.connectTBToWifi.step8"),
    ];

    return (
        <>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.connectTBToWifi.preparationText")}</Paragraph>
            <Collapse
                size="small"
                items={[
                    {
                        key: "1",
                        label: t("tonieboxes.boxFlashingCommon.connectTBToWifi.title"),

                        children: (
                            <>
                                {steps.map((step, idx) => (
                                    <Paragraph key={idx} style={{ marginBottom: 12 }}>
                                        <Text strong>{idx + 1}. </Text>
                                        {parseFormattedText(step)}
                                    </Paragraph>
                                ))}
                            </>
                        ),
                    },
                ]}
            />
        </>
    );
};
