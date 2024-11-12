import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../../../i18n";
import { Link } from "react-router-dom";
import { Alert, Button, Col, Collapse, Divider, Form, Input, Row, Steps, Table, Typography } from "antd";
import { RightOutlined, CodeOutlined, LeftOutlined, CheckSquareOutlined, EyeOutlined } from "@ant-design/icons";

import { BoxVersionsEnum } from "../../../../types/tonieboxTypes";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../../components/StyledComponents";
import { TonieboxesSubNav } from "../../../../components/tonieboxes/TonieboxesSubNav";
import CodeSnippet from "../../../../components/utils/CodeSnippet";
import { detectColorScheme } from "../../../../utils/browserUtils";
import AvailableBoxesModal, { certificateIntro } from "../../../../components/tonieboxes/boxSetup/CommonContent";

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
    const contentStep0 = (
        <>
            <h3>{t("tonieboxes.boxFlashingCommon.preparations")}</h3>
            <Alert
                type="warning"
                closeIcon
                showIcon
                message={t("tonieboxes.hintLatestFirmwareTitle")}
                description={t("tonieboxes.hintLatestFirmware")}
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
            <h4>{t("tonieboxes.cc3200BoxFlashing.installCC3200tool")}</h4>
            <Link
                to="https://github.com/toniebox-reverse-engineering/cc3200tool?tab=readme-ov-file#installation"
                target="_blank"
            >
                {t("tonieboxes.cc3200BoxFlashing.installCC3200toolLink")}
            </Link>
            <h4>{t("tonieboxes.cc3200BoxFlashing.connectToToniebox")}</h4>
            <Link to="https://tonies-wiki.revvox.de/docs/wiki/cc3200/debug-port/" target="_blank">
                {t("tonieboxes.cc3200BoxFlashing.connectToTonieboxLink")}
            </Link>
        </>
    );

    // step 1 - custom bootloader
    const contentStep1 = (
        <>
            <h3>{t("tonieboxes.cc3200BoxFlashing.bootloader")}</h3>
            <h4>{t("tonieboxes.cc3200BoxFlashing.installBootloader")}</h4>
            <Link
                to="https://tonies-wiki.revvox.de/docs/custom-firmware/cc3200/hackieboxng-bl/install/"
                target="_blank"
            >
                {t("tonieboxes.cc3200BoxFlashing.installBootloaderLink")}
            </Link>
        </>
    );

    // step 2 - certificates
    const contentStep2 = (
        <>
            <h3>{t("tonieboxes.boxFlashingCommon.certificates")}</h3>
            {certificateIntro(true)}
            <Link to="https://tonies-wiki.revvox.de/docs/tools/teddycloud/setup/dump-certs/cc3200/" target="_blank">
                {t("tonieboxes.cc3200BoxFlashing.dumpCertificatesLink")}
            </Link>
            <h4>{t("tonieboxes.cc3200BoxFlashing.flashCAreplacement")}</h4>
            <Link to="https://tonies-wiki.revvox.de/docs/tools/teddycloud/setup/flash-ca/cc3200/" target="_blank">
                {t("tonieboxes.cc3200BoxFlashing.flashCAreplacementLink")}
            </Link>
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
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.section2_part2")}</Paragraph>
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
                <HiddenDesktop>
                    <TonieboxesSubNav />
                </HiddenDesktop>
                <BreadcrumbWrapper
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("tonieboxes.navigationTitle") },
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
