import { useTranslation } from "react-i18next";
import { Alert, Button, Col, Divider, Form, Input, Modal, Row, Steps, Table, Typography } from "antd";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../../components/StyledComponents";
import { TonieboxesSubNav } from "../../../../components/tonieboxes/TonieboxesSubNav";
import { Link } from "react-router-dom";
import { RightOutlined, CodeOutlined, LeftOutlined, CheckSquareOutlined, EyeOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import i18n from "../../../../i18n";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../../../api";
import { TonieboxCardProps } from "../../../../components/tonieboxes/TonieboxCard";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Paragraph } = Typography;
const { Step } = Steps;

interface TonieboxPropsWithStatusAndVersion extends TonieboxCardProps {
    status: string;
    version: string;
}

export const CC3200BoxFlashingPage = () => {
    const { t } = useTranslation();
    const currentLanguage = i18n.language;
    const [currentStep, setCurrent] = useState(0);
    const [content, setContent] = useState([<></>, <></>, <></>, <></>, <></>]);
    const [disableButtons, setDisableButtons] = useState<boolean>(false);
    const [tonieboxes, setTonieboxes] = useState<TonieboxPropsWithStatusAndVersion[]>([]);

    const [hostname, setHostname] = useState<string>("");
    const [warningTextHostname, setWarningTextHostname] = useState<string>("");

    const [isOpenAailableBoxesModal, setIsOpenAailableBoxesModal] = useState(false);

    const updateContent = (index: number, newContent: JSX.Element) => {
        setContent((prevContent) => {
            const updatedContent = [...prevContent];
            updatedContent[index] = newContent;
            return updatedContent;
        });
    };

    const sanitizeHostname = (input: string) => {
        return input.replace(/[^a-zA-Z0-9-.]/g, "").trim();
    };

    const steps = [
        {
            title: t("tonieboxes.cc3200BoxFlashing.preparations"),
        },
        {
            title: t("tonieboxes.cc3200BoxFlashing.bootloader"),
        },
        {
            title: t("tonieboxes.cc3200BoxFlashing.certificates"),
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
            <h3>{t("tonieboxes.cc3200BoxFlashing.preparations")}</h3>
            <Alert
                type="warning"
                closeIcon
                showIcon
                message={t("tonieboxes.hintLatestFirmwareTitle")}
                description={t("tonieboxes.hintLatestFirmware")}
                style={{ marginBottom: 16 }}
            ></Alert>
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
            <h3>{t("tonieboxes.cc3200BoxFlashing.certificates")}</h3>
            <h4>{t("tonieboxes.cc3200BoxFlashing.dumpCertificates")}</h4>
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
    const contentStep4 = (
        <>
            <h3>{t("tonieboxes.cc3200BoxFlashing.applyingPatches")}</h3>
            <h4>{t("tonieboxes.cc3200BoxFlashing.applyingPatchesWithNgCfgJson")}</h4>
            <Link
                to="https://tonies-wiki.revvox.de/docs/custom-firmware/cc3200/hackieboxng-bl/bootloader/#configuration"
                target="_blank"
            >
                {t("tonieboxes.cc3200BoxFlashing.applyingPatchesWithNgCfgJsonLink")}
            </Link>
            <Paragraph style={{ marginTop: 16 }}>{t("tonieboxes.cc3200BoxFlashing.finish")}</Paragraph>
        </>
    );

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
    }, [currentStep, hostname, currentLanguage]);

    const prev = () => {
        setCurrent(currentStep - 1);
    };

    const next = () => {
        setCurrent(currentStep + 1);
    };

    const previousButton = (
        <Button icon={<LeftOutlined />} disabled={disableButtons} onClick={() => prev()}>
            {t("tonieboxes.cc3200BoxFlashing.previous")}
        </Button>
    );

    const onChange = (value: number) => {
        setCurrent(value);
    };

    // available boxes modal
    const checkBoxes = () => {
        const fetchTonieboxes = async () => {
            // Perform API call to fetch Toniebox data
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
                    let version = null;
                    if (tonieboxVersion in BoxVersions) {
                        version = BoxVersions[tonieboxVersion as keyof typeof BoxVersions];
                    }
                    // Return updated box with status and version
                    return {
                        ...box,
                        status: statusString,
                        version: version || "UNKNOWN",
                    };
                })
            );
            setTonieboxes(updatedBoxes);
        };
        fetchTonieboxes();
        showAvailableBoxesModal();
    };

    const showAvailableBoxesModal = () => {
        setIsOpenAailableBoxesModal(true);
    };

    const handleAvailableBoxesModalOk = () => {
        setIsOpenAailableBoxesModal(false);
    };

    const handleAvailableBoxesModalCancel = () => {
        setIsOpenAailableBoxesModal(false);
    };

    const availableBoxesModalColumns = [
        {
            title: t("tonieboxes.cc3200BoxFlashing.commonName"),
            dataIndex: "commonName",
            key: "commonName",
        },
        {
            title: t("tonieboxes.cc3200BoxFlashing.boxVersion"),
            dataIndex: "version",
            key: "version",
        },
        {
            title: t("tonieboxes.cc3200BoxFlashing.status"),
            dataIndex: "status",
            key: "status",
        },
    ];

    const availableBoxesModal = (
        <Modal
            title={t("tonieboxes.cc3200BoxFlashing.availableBoxes")}
            open={isOpenAailableBoxesModal}
            onOk={handleAvailableBoxesModalOk}
            onCancel={handleAvailableBoxesModalCancel}
        >
            <Paragraph>
                <Paragraph>{t("tonieboxes.cc3200BoxFlashing.newBoxAvailable")}</Paragraph>
                <Link
                    to="https://tonies-wiki.revvox.de/docs/tools/teddycloud/setup/test-troubleshooting/"
                    target="_blank"
                >
                    {t("tonieboxes.cc3200BoxFlashing.troubleShooting")}
                </Link>
            </Paragraph>
            <h4>{t("tonieboxes.cc3200BoxFlashing.availableBoxes")}</h4>
            <Table
                dataSource={tonieboxes.filter((box) => box.version === "CC3200")}
                columns={availableBoxesModalColumns}
                rowKey="ID"
                pagination={false}
            />
        </Modal>
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

    const createPatch = () => {
        const downloadJsonFile = (hostname: string) => {
            const jsonData = getUpdatedAltUrlCustom305(hostname);
            const jsonString = JSON.stringify(jsonData, null, 2);
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
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <div></div>
                                    <div></div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <Button
                                            icon={<RightOutlined />}
                                            iconPosition="end"
                                            disabled={disableButtons}
                                            onClick={next}
                                        >
                                            {t("tonieboxes.cc3200BoxFlashing.proceedWithCustomBootloader")}
                                        </Button>
                                        <Button icon={<RightOutlined />} iconPosition="end" disabled={true}>
                                            {t("tonieboxes.cc3200BoxFlashing.proceedWithoutCustomBootloader")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {currentStep === 1 && (
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    {previousButton}
                                    <div></div>
                                    <div>
                                        <Button
                                            icon={<CheckSquareOutlined />}
                                            disabled={disableButtons}
                                            type="primary"
                                            onClick={next}
                                        >
                                            {t("tonieboxes.cc3200BoxFlashing.bootloaderInstalled")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {currentStep === 2 && (
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    {previousButton}
                                    <div></div>
                                    <div>
                                        <Button
                                            icon={<CheckSquareOutlined />}
                                            disabled={disableButtons}
                                            type="primary"
                                            onClick={next}
                                        >
                                            {t("tonieboxes.cc3200BoxFlashing.certificatesDumpedCAreplacementFlashed")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {currentStep === 3 && (
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    {previousButton}
                                    <div>
                                        <Button
                                            icon={<CodeOutlined />}
                                            disabled={disableButtons || hostname.length > 12 || hostname.length === 0}
                                            type="primary"
                                            onClick={createPatch}
                                        >
                                            {t("tonieboxes.cc3200BoxFlashing.createPatch")}
                                        </Button>
                                    </div>
                                    <div>
                                        <Button
                                            icon={<RightOutlined />}
                                            iconPosition="end"
                                            disabled={disableButtons}
                                            onClick={() => next()}
                                        >
                                            {t("tonieboxes.cc3200BoxFlashing.next")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {currentStep === 4 && (
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    {previousButton}
                                    <div>
                                        <Button
                                            icon={<EyeOutlined />}
                                            disabled={disableButtons}
                                            type="primary"
                                            onClick={checkBoxes}
                                        >
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
