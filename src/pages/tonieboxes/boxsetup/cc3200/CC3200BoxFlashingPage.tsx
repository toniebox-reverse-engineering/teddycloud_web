import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../../../i18n";
import { Link } from "react-router-dom";
import {
    Alert,
    Button,
    Col,
    Collapse,
    Divider,
    Form,
    Image,
    Input,
    Row,
    Steps,
    Table,
    Tabs,
    TabsProps,
    Typography,
} from "antd";
import { RightOutlined, CodeOutlined, LeftOutlined, CheckSquareOutlined, EyeOutlined } from "@ant-design/icons";

import { BoxVersionsEnum } from "../../../../types/tonieboxTypes";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../../../components/StyledComponents";
import { TonieboxesSubNav } from "../../../../components/tonieboxes/TonieboxesSubNav";
import CodeSnippet from "../../../../components/utils/CodeSnippet";
import { detectColorScheme } from "../../../../utils/browserUtils";
import AvailableBoxesModal, {
    certificateIntro,
    CertificateUploadElement,
    installCC3200Tool,
    uart3v3Hint,
} from "../../../../components/tonieboxes/boxSetup/CommonContent";

import cc3200debugPort from "../../../../assets/boxSetup/cc3200_debugPort.jpg";
import cc3200tagConnector from "../../../../assets/boxSetup/cc3200_tagConnector.png";
import cc3200WiresAsTagConnect from "../../../../assets/boxSetup/cc3200_wiresAsTagConnector.png";
import cc3200cfwUpdate from "../../../../assets/boxSetup/cc3200_installCfwFlashUpload.png";

const { Paragraph } = Typography;
const { Step } = Steps;

export const CC3200BoxFlashingPage = () => {
    const { t } = useTranslation();
    const currentLanguage = i18n.language;
    const [currentStep, setCurrent] = useState(0);

    const [hostname, setHostname] = useState<string>("");
    const [warningTextHostname, setWarningTextHostname] = useState<string>("");

    const [isOpenAvailableBoxesModal, setIsOpenAvailableBoxesModal] = useState(false);

    const sanitizeHostname = (input: string) => {
        return input.replace(/[^a-zA-Z0-9-.]/g, "").trim();
    };

    const steps = [
        {
            title: t("tonieboxes.boxFlashingCommon.preparations"),
        },
        {
            title: t("tonieboxes.cc3200BoxFlashing.bootloader"),
        },
        {
            title: t("tonieboxes.boxFlashingCommon.certificates"),
        },
        {
            title: t("tonieboxes.cc3200BoxFlashing.patches"),
        },
        {
            title: t("tonieboxes.cc3200BoxFlashing.applyingPatches"),
        },
    ];

    // step 0 - preparations
    const debugPortUARTData = [
        {
            key: "1",
            toniebox1: "GND",
            toniebox2: "",
            uart: "GND",
        },
        {
            key: "2",
            toniebox1: "TX",
            toniebox2: "",
            uart: "RX",
        },
        {
            key: "3",
            toniebox1: "RX",
            toniebox2: "",
            uart: "TX",
        },
        {
            key: "4",
            toniebox1: "RST",
            toniebox2: "",
            uart: "DTR",
        },
        {
            key: "5",
            toniebox1: "VCC",
            toniebox2: "SOP2*",
            uart: "",
        },
        {
            key: "6",
            toniebox1: "SOP2",
            toniebox2: "VCC*",
            uart: "",
        },
    ];

    const debugPortUARTColumns = [
        {
            title: "Toniebox",
            dataIndex: "toniebox1",
            key: "toniebox1",
        },
        {
            title: "Toniebox",
            dataIndex: "toniebox2",
            key: "toniebox2",
        },
        {
            title: "UART",
            dataIndex: "uart",
            key: "uart",
        },
    ];

    const TonieboxUARTTable = () => {
        return (
            <Table
                dataSource={debugPortUARTData}
                columns={debugPortUARTColumns}
                pagination={false}
                bordered
                size="small"
                style={{ width: 300 }}
            />
        );
    };

    const contentStep0 = (
        <>
            <h3>{t("tonieboxes.boxFlashingCommon.preparations")}</h3>
            <Alert
                type="warning"
                closeIcon
                showIcon
                message={t("tonieboxes.hintLatestFirmwareTitle")}
                description=<>
                    <Paragraph>{t("tonieboxes.hintLatestFirmware")}</Paragraph>
                    <Paragraph>{t("tonieboxes.hintLatestFirmwareFactoryResetCC3200")}</Paragraph>
                </>
                style={{ marginBottom: 16 }}
            ></Alert>
            <Paragraph>
                {t("tonieboxes.cc3235BoxFlashing.preparationText")}{" "}
                <Link
                    to="https://support.tonies.com/hc/en-us/articles/4415294030482-How-do-I-set-up-a-Wi-Fi-connection-without-the-setup-assistant"
                    target="_blank"
                >
                    {t("tonieboxes.cc3235BoxFlashing.preparationTextLink")}
                </Link>
            </Paragraph>
            {installCC3200Tool()}
            <h4>{t("tonieboxes.cc3200BoxFlashing.connectToToniebox")}</h4>
            <Paragraph></Paragraph>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.connectToTonieboxIntro")}
                <Paragraph>
                    <Image
                        src={cc3200debugPort}
                        style={{ maxHeight: 200, width: "auto", marginTop: 8 }}
                        alt={t("tonieboxes.cc3235BoxFlashing.flashCollapse.cc3235flash")}
                    />
                </Paragraph>
                <Paragraph>{uart3v3Hint()}</Paragraph>
                <Paragraph>{t("tonieboxes.cc3200BoxFlashing.connectToTonieboxConnectTableIntro")}</Paragraph>
                {TonieboxUARTTable()}
                <Paragraph>{t("tonieboxes.cc3200BoxFlashing.connectToTonieboxConnectTableExplanation")}</Paragraph>
            </Paragraph>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.connectToTonieboxConnectDebugPortText1")}
                <Link
                    to="https://www.tag-connect.com/product/tc2050-idc-nl-10-pin-no-legs-cable-with-ribbon-connector"
                    target="_blank"
                >
                    TC2050-IDC-NL TagConnector
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

    // step 1 - custom bootloader
    const importantTBFilesData = [
        {
            key: "/cert/ca.der",
            file: "/cert/ca.der",
            description: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.caDer"),
        },
        {
            key: "/cert/private.der",
            file: "/cert/private.der",
            description: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.privateDer"),
        },
        {
            key: "/cert/client.der",
            file: "/cert/client.der",
            description: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.clientDer"),
        },
        {
            key: "/sys/mcuimg.bin",
            file: "/sys/mcuimg.bin",
            description: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.originalBootloader"),
        },
        {
            key: "/sys/mcuimg1.bin",
            file: "/sys/mcuimg1.bin",
            description: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.firstSlot"),
        },
        {
            key: "/sys/mcuimg2.bin",
            file: "/sys/mcuimg2.bin",
            description: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.secondSlot"),
        },
        {
            key: "/sys/mcuimg3.bin",
            file: "/sys/mcuimg3.bin",
            description: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.thirdSlot"),
        },
        {
            key: "/sys/mcubootinfo.bin",
            file: "/sys/mcubootinfo.bin",
            description: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.mcuBootInfo"),
        },
    ];

    const importantTBFilesColumns = [
        {
            title: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.file"),
            dataIndex: "file",
            key: "file",
        },
        {
            title: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.description"),
            dataIndex: "description",
            key: "description",
        },
    ];

    const importantTBFilesTable = () => {
        return <Table dataSource={importantTBFilesData} columns={importantTBFilesColumns} pagination={false} />;
    };

    const firstInstallationTab = (
        <>
            <b>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.firstInstallation.moveOriginal")}</b>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.firstInstallation.moveOriginalText1")}
            </Paragraph>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.firstInstallation.moveOriginalText2")}
                <CodeSnippet
                    language="shell"
                    code={`cc3200tool -p COM3 write_file ExtractedFromBox/sys/mcuimg.bin /sys/pre-img.bin`}
                />
            </Paragraph>
            <b> {t("tonieboxes.cc3200BoxFlashing.installingBootloader.firstInstallation.installPreloader")}</b>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.firstInstallation.installPreloaderText1")}
            </Paragraph>
            <CodeSnippet language="shell" code={`cc3200tool -p COM3 write_file flash/sys/mcuimg.bin /sys/mcuimg.bin`} />
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.firstInstallation.installPreloaderText2")}
            </Paragraph>
        </>
    );

    const existingInstallationUpdateTab = (
        <>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.intro")}</Paragraph>
            <b>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.backup")}</b>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.backupText")}
            </Paragraph>
            <CodeSnippet language="url" code={`http://*.*.*.*/api/ajax?cmd=get-flash-file&filepath=/sys/pre-img.bin`} />
            <b>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.copyOverPreloader")}</b>
            <Paragraph>
                <div style={{ maxHeight: 400, justifyItems: "center" }}>
                    <Image
                        src={cc3200cfwUpdate}
                        style={{ maxHeight: 400, width: "auto", maxWidth: "100%" }}
                        alt={t(
                            "tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.updatingCFWUsingOldCFWWebGui"
                        )}
                    />
                </div>
            </Paragraph>
            <Paragraph>
                <ul>
                    <li>
                        {t(
                            "tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.copyOverPreloaderStep1"
                        )}
                    </li>
                    <li>
                        {t(
                            "tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.copyOverPreloaderStep2"
                        )}
                    </li>
                    <li>
                        {t(
                            "tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.copyOverPreloaderStep3"
                        )}
                    </li>
                    <li>
                        {t(
                            "tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.copyOverPreloaderStep4"
                        )}
                    </li>
                    <li>
                        {t(
                            "tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.copyOverPreloaderStep5"
                        )}
                    </li>
                </ul>
            </Paragraph>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.outro")}</Paragraph>
            <CodeSnippet language="url" code={`http://*.*.*.*/api/ajax?cmd=get-flash-file&filepath=/sys/mcuimg.bin`} />
        </>
    );

    const preloaderInstallation: TabsProps["items"] = [
        {
            key: "firstTime",
            label: t("tonieboxes.cc3200BoxFlashing.installingBootloader.firstInstallation.title"),
            children: firstInstallationTab,
        },
        {
            key: "updateExisting",
            label: t("tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.title"),
            children: existingInstallationUpdateTab,
        },
    ];

    const contentStep1 = (
        <>
            <h3>{t("tonieboxes.cc3200BoxFlashing.bootloader")}</h3>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.intro")}</Paragraph>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`cc3200tool -p COM3 read_all_files ExtractedFromBox/ read_flash backup.bin`}
                />
            </Paragraph>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.resetCommand")}</Paragraph>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.inCaseText")}</Paragraph>
            <Paragraph>
                <CodeSnippet language="shell" code={`cc3200tool -p COM3 read_all_files ExtractedFromBox/ `} />
            </Paragraph>
            <Paragraph>
                <CodeSnippet language="shell" code={`cc3200tool -p COM3 read_flash backup.bin`} />
            </Paragraph>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.verifyBackup")}</Paragraph>
            <Paragraph>{importantTBFilesTable()}</Paragraph>
            <h4>{t("tonieboxes.cc3200BoxFlashing.installBootloader")}</h4>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.downloadText1")}
                <Link to="https://github.com/toniebox-reverse-engineering/hackiebox_cfw_ng/releases" target="_blank">
                    {t("tonieboxes.cc3200BoxFlashing.installingBootloader.downloadLink")}
                </Link>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.downloadText2")}
            </Paragraph>
            <h5>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.preface.title")}</h5>
            <Paragraph>
                <Paragraph> {t("tonieboxes.cc3200BoxFlashing.installingBootloader.preface.intro")}</Paragraph>
                <Paragraph>
                    <ul>
                        <li>
                            {t("tonieboxes.cc3200BoxFlashing.installingBootloader.stage1")}
                            <ul>
                                <li>
                                    {t("tonieboxes.cc3200BoxFlashing.installingBootloader.firstInstallation.title")}
                                </li>
                                <li>
                                    {t("tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.title")}
                                </li>
                            </ul>
                        </li>
                        <li>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.stage2")}</li>
                    </ul>
                </Paragraph>
            </Paragraph>
            <h5>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.stage1")}</h5>
            <Tabs items={preloaderInstallation} indicator={{ size: (origin) => origin - 20, align: "center" }} />
            <h5>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.stage2")}</h5>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.installingBootloaderStage2.intro")}
            </Paragraph>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.installingBootloaderStage2.text1")}
            </Paragraph>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.installingBootloaderStage2.text2")}
                <Link
                    to="https://tonies-wiki.revvox.de/docs/custom-firmware/cc3200/hackieboxng-bl/bootloader/"
                    target="_blank"
                >
                    {t("tonieboxes.cc3200BoxFlashing.installingBootloader.installingBootloaderStage2.here")}
                </Link>
                .
            </Paragraph>
        </>
    );

    // step 2 - certificates
    const contentStep2 = (
        <>
            <h3>{t("tonieboxes.boxFlashingCommon.certificates")}</h3>
            <Paragraph>{certificateIntro(true)}</Paragraph>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.certificates.alreadyAvailable")}</Paragraph>
            <Paragraph>
                <CodeSnippet language="shell" code={`/currentDir/ExtractedFromBox/cert/.`} />
            </Paragraph>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.certificates.extractAgain")}</Paragraph>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`cc3200tool -p COM3 read_file /cert/ca.der ExtractedFromBox/cert/ca.der read_file /cert/private.der ExtractedFromBox/cert/private.der read_file /cert/client.der ExtractedFromBox/cert/client.der`}
                />
            </Paragraph>
            <Paragraph>
                <CertificateUploadElement />
            </Paragraph>
            <h4>{t("tonieboxes.cc3200BoxFlashing.flashCAreplacement")}</h4>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.flashCAreplacementIntro")}</Paragraph>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.flashCAreplacementText")}</Paragraph>
            <CodeSnippet language="shell" code={`cc3200tool -p COM3 write_file c2.der /cert/c2.der`} />
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.flashCAreplacementOutro")}</Paragraph>
        </>
    );

    // step 3 - patches
    const contentStep3 = (
        <>
            <h3>{t("tonieboxes.cc3200BoxFlashing.patches")}</h3>
            <Link
                to="https://tonies-wiki.revvox.de/docs/custom-firmware/cc3200/hackieboxng-bl/ofw-patches/"
                target="_blank"
            >
                {t("tonieboxes.cc3200BoxFlashing.patchesMoreInformationLink")}
            </Link>
            <h4>{t("tonieboxes.cc3200BoxFlashing.predefinedUrlPatches")}</h4>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.predefinedUrlPatchesIntro")}</Paragraph>
            <Collapse
                size="small"
                items={[
                    {
                        key: "1",
                        label: t("tonieboxes.cc3200BoxFlashing.altUrlFritzBoxPatch.CollapseTitle"),
                        children: <Paragraph>{t("tonieboxes.cc3200BoxFlashing.altUrlFritzBoxPatch.text")}</Paragraph>,
                    },
                ]}
                style={{ marginBottom: 16, marginTop: 16 }}
            />
            <Collapse
                size="small"
                items={[
                    {
                        key: "1",
                        label: t("tonieboxes.cc3200BoxFlashing.altUrlPatch.CollapseTitle"),
                        children: <Paragraph>{t("tonieboxes.cc3200BoxFlashing.altUrlPatch.text")}</Paragraph>,
                    },
                ]}
                style={{ marginBottom: 16 }}
            />
            <h4>{t("tonieboxes.cc3200BoxFlashing.customUrlPatch")}</h4>
            <Alert
                description={t("tonieboxes.cc3200BoxFlashing.customUrlPatchHint")}
                type={"warning"}
                style={{ marginBottom: 8 }}
            />
            <Form>
                <Paragraph>{t("tonieboxes.cc3200BoxFlashing.hintPatchHost")}</Paragraph>
                <Form.Item>
                    <Row align="middle" style={{ display: "flex", alignItems: "center" }}>
                        <Col style={{ flex: "0 0 200px", color: warningTextHostname ? "#CC3010" : "unset" }}>
                            <label>{t("tonieboxes.cc3200BoxFlashing.hostname")}</label>
                        </Col>
                        <Col style={{ flex: "1 1 auto" }}>
                            <Input
                                type="text"
                                value={hostname}
                                onChange={(e) => {
                                    let value = sanitizeHostname(e.target.value);
                                    let warningText = "";
                                    if (value.length > 12) {
                                        warningText = t("tonieboxes.cc3200BoxFlashing.hostnameTooLong");
                                    } else {
                                        warningText = "";
                                    }
                                    setHostname(value);
                                    setWarningTextHostname(warningText);
                                }}
                            />
                        </Col>
                    </Row>
                    {warningTextHostname && (
                        <p style={{ color: "#CC3010" }}>{warningTextHostname}</p> // Show warning text from state
                    )}
                </Form.Item>
            </Form>
        </>
    );

    // step 4 - applying patches
    const generalSectionData = [
        {
            key: "1",
            keyName: "activeImg",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.activeImgDesc"
            ),
            values: "ofw1, ofw2, ofw3, cfw1, cfw2, cfw3, add1, add2, add3",
            defaultValue: "ofw1",
        },
        {
            key: "2",
            keyName: "waitForPress",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.waitForPressDesc"
            ),
            values: "true, false",
            defaultValue: "false",
        },
        {
            key: "3",
            keyName: "waitForBoot",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.waitForBootDesc"
            ),
            values: "true, false",
            defaultValue: "false",
        },
        {
            key: "4",
            keyName: "waitTimeoutInS",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.waitTimeoutInSDesc"
            ),
            values: "1-255",
            defaultValue: "60",
        },
        {
            key: "5",
            keyName: "minBatteryLevel",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.minBatteryLevelDesc"
            ),
            values: "",
            defaultValue: "8869",
        },
        {
            key: "6",
            keyName: "ofwFixValue",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.ofwFixValueDesc"
            ),
            values: "hex array with 4 bytes",
            defaultValue: '["4C", "01", "10", "00"]',
        },
        {
            key: "7",
            keyName: "ofwFixFlash",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.ofwFixFlashDesc"
            ),
            values: "ex. /sys/pre-img.bin",
            defaultValue: "",
        },
        {
            key: "8",
            keyName: "serialLog",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.serialLogDesc"
            ),
            values: "true, false",
            defaultValue: "true",
        },
        {
            key: "9",
            keyName: "logLevel",
            description: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.logLevelDesc"),
            values: "0-5",
            defaultValue: "DEBUG_LOG_LEVEL",
        },
        {
            key: "10",
            keyName: "logColor",
            description: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.logColorDesc"),
            values: "true, false",
            defaultValue: "false",
        },
    ];

    const generalSectionColumns = [
        {
            title: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.key"),
            dataIndex: "keyName",
            key: "keyName",
            width: 120,
        },
        {
            title: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.description"),
            dataIndex: "description",
            key: "description",
        },
        {
            title: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.values"),
            dataIndex: "values",
            key: "values",
        },
        {
            title: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.default"),
            dataIndex: "defaultValue",
            key: "defaultValue",
        },
    ];

    const firmwareSectionData = [
        {
            key: "1",
            keyName: "checkHash",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.checkHashDesc"
            ),
            values: "true, false",
            defaultValue: "true",
        },
        {
            key: "2",
            keyName: "hashFile",
            description: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.hashFileDesc"),
            values: "true, false",
            defaultValue: "false",
        },
        {
            key: "3",
            keyName: "watchdog",
            description: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.watchdogDesc"),
            values: "true, false",
            defaultValue: "false",
        },
        {
            key: "4",
            keyName: "ofwFix",
            description: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.ofwFixDesc"),
            values: "true, false",
            defaultValue: "false",
        },
        {
            key: "5",
            keyName: "ofwSimBL",
            description: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.ofwSimBLDesc"),
            values: "true, false",
            defaultValue: "false",
        },
        {
            key: "6",
            keyName: "bootFlashImg",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.bootFlashImgDesc"
            ),
            values: "true, false",
            defaultValue: "false",
        },
        {
            key: "7",
            keyName: "flashImg",
            description: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.flashImgDesc"),
            values: "ex. /sys/pre-img.bin",
            defaultValue: "",
        },
        {
            key: "8",
            keyName: "patches",
            description: (
                <>
                    {t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.patchesDesc")}{" "}
                    <Link to="https://github.com/toniebox-reverse-engineering/hackiebox_cfw_ng/tree/master/sd-bootloader-ng/bootmanager/sd/revvox/boot/patch">
                        {t(
                            "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.patchDirectory"
                        )}
                    </Link>
                    {", "}
                    <Link to="https://tonies-wiki.revvox.de/docs/custom-firmware/cc3200/hackieboxng-bl/ofw-patches/">
                        {t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.patchWiki")}
                    </Link>
                </>
            ),
            values: '["noCerts.305", "noPass3.305"]',
            defaultValue: "[]",
        },
    ];

    const exampleNgCfgJson = {
        general: {
            activeImg: "ofw2",
            _descWaitForPress: "Waits for an earpress on startup",
            waitForPress: false,
            _descWaitForBoot: "Waits for an earpress before firmware boot",
            waitForBoot: false,
            waitTimeoutInS: 60,
            _descMinBatteryLevel: "Divide through 2785 to get voltage",
            minBatteryLevel: 8869,
            ofwFixFlash: "/sys/pre-img.bin",
            _descSerialLog: "Logging only works with the debug build!",
            serialLog: false,
            _descLogLevel: "0:Trace - 5:Fatal",
            logLevel: 0,
            _descLogColor: "Use colors in log output",
            logColor: false,
        },
        ofw1: {
            checkHash: false,
            hashFile: false,
            watchdog: true,
            bootFlashImg: true,
            flashImg: "/sys/pre-img.bin",
        },
        ofw2: {
            checkHash: true,
            hashFile: false,
            watchdog: true,
            ofwFix: true,
            ofwSimBL: true,
            patches: ["altCa.305", "altUrl.custom.305"],
        },
        ofw3: {
            checkHash: true,
            hashFile: false,
            watchdog: true,
            ofwFix: true,
            patches: ["altCa.305", "altUrl.tc.fritz.box"],
        },
        cfw1: {
            checkHash: false,
            hashFile: false,
            watchdog: true,
        },
        cfw2: {
            checkHash: false,
            hashFile: false,
            watchdog: true,
        },
        cfw3: {
            checkHash: false,
            hashFile: false,
            watchdog: true,
        },
        add1: {
            checkHash: true,
            hashFile: false,
            watchdog: true,
            ofwFix: true,
            ofwSimBL: false,
            patches: ["blockCheck.310", "noCerts.305", "noPass3.310", "noPrivacy.305", "uidCheck.307"],
        },
        add2: {
            checkHash: true,
            hashFile: false,
            watchdog: true,
            ofwFix: true,
            ofwSimBL: false,
            patches: ["altCa.305", "altUrl.305"],
        },
        add3: {
            checkHash: true,
            hashFile: false,
            watchdog: true,
            ofwFix: true,
            ofwSimBL: false,
            patches: ["altCa.305", "altUrl.305"],
        },
    };

    const contentStep4 = (
        <>
            <h3>{t("tonieboxes.cc3200BoxFlashing.applyingPatches")}</h3>
            <h4>{t("tonieboxes.cc3200BoxFlashing.applyingPatchesWithNgCfgJson")}</h4>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.introduction")}</Paragraph>
            <Collapse
                size="small"
                items={[
                    {
                        key: "1",
                        label: t(
                            "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.collapseTitle"
                        ),
                        children: (
                            <Paragraph>
                                <h5>
                                    {t(
                                        "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.title"
                                    )}
                                </h5>
                                <Paragraph>
                                    {t(
                                        "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.section1_part1"
                                    )}{" "}
                                    <Link
                                        to="https://github.com/toniebox-reverse-engineering/hackiebox_cfw_ng/blob/master/sd-bootloader-ng/bootmanager/sd/revvox/boot/ngCfg.json"
                                        target="_blank"
                                    >
                                        {t(
                                            "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.section1_link"
                                        )}
                                    </Link>
                                    {t(
                                        "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.section1_part2"
                                    )}
                                </Paragraph>
                                <Paragraph>
                                    {t(
                                        "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.section1_part3"
                                    )}
                                </Paragraph>
                                <h5>
                                    {t(
                                        "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.generalSection"
                                    )}
                                </h5>
                                <Table
                                    dataSource={generalSectionData}
                                    columns={generalSectionColumns}
                                    pagination={false}
                                    size={"small"}
                                />
                                <h5>
                                    {t(
                                        "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.firmwareSection"
                                    )}
                                </h5>
                                {t(
                                    "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.firmwareSectionIntro"
                                )}
                                <Table
                                    dataSource={firmwareSectionData}
                                    columns={generalSectionColumns}
                                    pagination={false}
                                    size={"small"}
                                />
                            </Paragraph>
                        ),
                    },
                ]}
                style={{ marginBottom: 16 }}
            />
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.section2_part1")}</Paragraph>
            <CodeSnippet
                language="json"
                code={`{
    "general": {
        "activeImg": "ofw2",
        ...`}
            />
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.section2_part2")}</Paragraph>
            <CodeSnippet
                language="json"
                code={`...
    "ofw2": {
        "checkHash": true,
        "hashFile": false,
        "watchdog": true,
        "ofwFix": true,
        "ofwSimBL": true,
        "patches": ["altCa.305", "altUrl.custom.305"]
    },
...`}
            />
            <Collapse
                size="small"
                items={[
                    {
                        key: "1",
                        label: t(
                            "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.examplengCFGJsonCollapse.collapseTitle"
                        ),
                        children: (
                            <Paragraph>
                                <CodeSnippet language="shell" code={JSON.stringify(exampleNgCfgJson, null, 2)} />
                            </Paragraph>
                        ),
                    },
                ]}
                style={{ marginBottom: 16 }}
            />
            <Paragraph style={{ marginTop: 16 }}>
                {t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.finish")}
            </Paragraph>
        </>
    );

    const [content, setContent] = useState([contentStep0, contentStep1, contentStep2, contentStep3, contentStep4]);
    const updateContent = (index: number, newContent: JSX.Element) => {
        setContent((prevContent) => {
            const updatedContent = [...prevContent];
            updatedContent[index] = newContent;
            return updatedContent;
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    useEffect(() => {
        const getContentForStep = () => {
            switch (currentStep) {
                case 0:
                    return contentStep0;
                case 1:
                    return contentStep1;
                case 2:
                    return contentStep2;
                case 3:
                    return contentStep3;
                case 4:
                    return contentStep4;
                default:
                    return <div></div>;
            }
        };

        updateContent(currentStep, getContentForStep());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, hostname, currentLanguage, detectColorScheme()]);

    const prev = () => {
        setCurrent(currentStep - 1);
    };

    const next = () => {
        setCurrent(currentStep + 1);
    };

    const previousButton = (
        <Button icon={<LeftOutlined />} onClick={() => prev()}>
            {t("tonieboxes.cc3200BoxFlashing.previous")}
        </Button>
    );

    const onChange = (value: number) => {
        setCurrent(value);
    };

    // available boxes modal
    const checkBoxes = () => {
        showAvailableBoxesModal();
    };

    const showAvailableBoxesModal = () => {
        setIsOpenAvailableBoxesModal(true);
    };

    const handleAvailableBoxesModalClose = () => {
        setIsOpenAvailableBoxesModal(false);
    };

    const availableBoxesModal = (
        <AvailableBoxesModal
            boxVersion={BoxVersionsEnum.cc3200}
            isOpen={isOpenAvailableBoxesModal}
            onClose={handleAvailableBoxesModalClose}
        />
    );

    // create altUrl.custom.305.json patch
    interface General {
        _desc: string;
        _memPos: string;
        _fwVer: string;
    }

    interface SearchAndReplace {
        _desc: string;
        search: string[];
        replace: string[];
    }

    interface AltUrlCustom305 {
        general: General;
        searchAndReplace: SearchAndReplace[];
    }

    const altUrlcustom305Base: AltUrlCustom305 = {
        general: {
            _desc: "Changes Boxine URLs to custom ones.",
            _memPos: "",
            _fwVer: "3.0.5+",
        },
        searchAndReplace: [
            {
                _desc: "prod.de.tbs.toys to ",
                search: [
                    "70",
                    "72",
                    "6f",
                    "64",
                    "2e",
                    "64",
                    "65",
                    "2e",
                    "74",
                    "62",
                    "73",
                    "2e",
                    "74",
                    "6f",
                    "79",
                    "73",
                    "00",
                ],
                replace: [
                    "70",
                    "72",
                    "6f",
                    "64",
                    "2e",
                    "72",
                    "65",
                    "76",
                    "76",
                    "6f",
                    "78",
                    "00",
                    "??",
                    "??",
                    "??",
                    "??",
                    "??",
                ],
            },
            {
                _desc: "rtnl.bxcl.de to ",
                search: ["72", "74", "6e", "6c", "2e", "62", "78", "63", "6c", "2e", "64", "65", "00"],
                replace: ["72", "74", "6e", "6c", "2e", "72", "65", "76", "76", "6f", "78", "00", "??"],
            },
        ],
    };

    const stringToHex = (str: string, totalLength: number): string[] => {
        const hexArray = str.split("").map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"));
        hexArray.push("00");
        const currentLength = hexArray.length;
        const requiredLength = totalLength;
        const paddingNeeded = requiredLength - currentLength;
        const paddedHex =
            paddingNeeded > 0 ? hexArray.concat(Array.from({ length: paddingNeeded }, () => "??")) : hexArray;
        return paddedHex;
    };

    const getUpdatedAltUrlCustom305 = (hostname: string): AltUrlCustom305 => {
        const updateReplaceWithHostname = (urlChanges: SearchAndReplace[]): SearchAndReplace[] => {
            return urlChanges.map((urlChange) => {
                const newReplaceArray = stringToHex(hostname, urlChange.replace.length);
                return {
                    ...urlChange,
                    _desc: `${urlChange._desc}${hostname}`,
                    replace: newReplaceArray,
                };
            });
        };
        return {
            ...altUrlcustom305Base,
            searchAndReplace: updateReplaceWithHostname(altUrlcustom305Base.searchAndReplace),
        };
    };

    // do not reformat that, as it will reformat the generated file
    const formatConfig = (config: AltUrlCustom305): string => {
        return `{
    "general": {
        "_desc": "${config.general._desc}",
        "_memPos": "${config.general._memPos}",
        "_fwVer": "${config.general._fwVer}"
    },
    "searchAndReplace": [${config.searchAndReplace
        .map(
            (item) => `{
        "_desc": "${item._desc}",
        "search":  ["${item.search.join('", "')}"],
        "replace": ["${item.replace.join('", "')}"]
    }`
        )
        .join(", ")}]
}`;
    };

    const createPatch = () => {
        const downloadJsonFile = (hostname: string) => {
            const jsonData = getUpdatedAltUrlCustom305(hostname);
            const jsonString = formatConfig(jsonData);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "altUrl.custom.305.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
        downloadJsonFile(hostname);
    };

    return (
        <>
            <StyledSider>
                <TonieboxesSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("tonieboxes.navigationTitle") },
                        { title: t("tonieboxes.boxSetup.navigationTitle") },
                        { title: t("tonieboxes.cc3200BoxFlashing.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t(`tonieboxes.cc3200BoxFlashing.title`)}</h1>
                    <Divider>{t("tonieboxes.cc3200BoxFlashing.title")}</Divider>
                    <Paragraph>
                        <Steps current={currentStep} onChange={onChange}>
                            {steps.map((step, index) => (
                                <Step
                                    key={index}
                                    title={step.title}
                                    status={
                                        index === currentStep && index === steps.length
                                            ? "finish"
                                            : index === currentStep
                                            ? "process"
                                            : index < currentStep
                                            ? "finish"
                                            : "wait"
                                    }
                                />
                            ))}
                        </Steps>
                        <div style={{ marginTop: 24 }}>{content[currentStep]}</div>
                        <div style={{ marginTop: 24, marginBottom: 24 }}>
                            {currentStep === 0 && (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                        gap: 8,
                                    }}
                                >
                                    <div></div>
                                    <div></div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                        <Button icon={<RightOutlined />} iconPosition="end" onClick={next}>
                                            {t("tonieboxes.cc3200BoxFlashing.proceedWithCustomBootloader")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {currentStep === 1 && (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                        gap: 8,
                                    }}
                                >
                                    {previousButton}
                                    <div></div>
                                    <div>
                                        <Button icon={<CheckSquareOutlined />} type="primary" onClick={next}>
                                            {t("tonieboxes.cc3200BoxFlashing.bootloaderInstalled")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {currentStep === 2 && (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                        gap: 8,
                                    }}
                                >
                                    {previousButton}
                                    <div></div>
                                    <div>
                                        <Button icon={<CheckSquareOutlined />} type="primary" onClick={next}>
                                            {t("tonieboxes.cc3200BoxFlashing.certificatesDumpedCAreplacementFlashed")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {currentStep === 3 && (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                        gap: 8,
                                    }}
                                >
                                    {previousButton}
                                    <div>
                                        <Button
                                            icon={<CodeOutlined />}
                                            disabled={hostname.length > 12 || hostname.length === 0}
                                            type="primary"
                                            onClick={createPatch}
                                        >
                                            {t("tonieboxes.cc3200BoxFlashing.createPatch")}
                                        </Button>
                                    </div>
                                    <div>
                                        <Button icon={<RightOutlined />} iconPosition="end" onClick={() => next()}>
                                            {t("tonieboxes.cc3200BoxFlashing.next")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {currentStep === 4 && (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                        gap: 8,
                                    }}
                                >
                                    {previousButton}
                                    <div>
                                        <Button icon={<EyeOutlined />} type="primary" onClick={checkBoxes}>
                                            {t("tonieboxes.cc3200BoxFlashing.checkBoxes")}
                                        </Button>
                                    </div>
                                    <div></div>
                                </div>
                            )}
                        </div>
                    </Paragraph>
                    {availableBoxesModal}
                </StyledContent>
            </StyledLayout>
        </>
    );
};
