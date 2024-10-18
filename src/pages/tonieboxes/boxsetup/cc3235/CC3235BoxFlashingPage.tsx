import { useTranslation } from "react-i18next";
import { Alert, Button, Divider, Modal, Steps, Table, Typography } from "antd";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../../components/StyledComponents";
import { TonieboxesSubNav } from "../../../../components/tonieboxes/TonieboxesSubNav";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { TonieboxCardProps } from "../../../../components/tonieboxes/TonieboxCard";
import { detectColorScheme } from "../../../../utils/browserUtils";
import i18n from "../../../../i18n";
import { CheckSquareOutlined, EyeOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import SyntaxHighlighter from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

interface TonieboxPropsWithStatusAndVersion extends TonieboxCardProps {
    status: string;
    version: string;
}

const { Paragraph } = Typography;
const { Step } = Steps;

const api = new TeddyCloudApi(defaultAPIConfig());

export const CC3235BoxFlashingPage = () => {
    const { t } = useTranslation();
    const currentLanguage = i18n.language;
    const [currentStep, setCurrent] = useState(0);
    const [content, setContent] = useState([<></>, <></>, <></>]);
    const [tonieboxes, setTonieboxes] = useState<TonieboxPropsWithStatusAndVersion[]>([]);

    const [isOpenAvailableBoxesModal, setIsOpenAailableBoxesModal] = useState(false);

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
            title: t("tonieboxes.cc3235BoxFlashing.preparations"),
        },
        {
            title: t("tonieboxes.cc3235BoxFlashing.certificates"),
        },
        {
            title: t("tonieboxes.cc3235BoxFlashing.dns"),
        },
    ];

    // step 0 - preparations
    const contentStep0 = (
        <>
            <h3>{t("tonieboxes.cc3235BoxFlashing.preparations")}</h3>
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
            <h4>{t("tonieboxes.cc3235BoxFlashing.installCC3200tool")}</h4>
            <Link
                to="https://github.com/toniebox-reverse-engineering/cc3200tool?tab=readme-ov-file#installation"
                target="_blank"
            >
                {t("tonieboxes.cc3235BoxFlashing.installCC3200toolLink")}
            </Link>
            <h4>{t("tonieboxes.cc3235BoxFlashing.installSerprogFirmware")}</h4>
            <Paragraph>
                <Link to="https://github.com/stacksmashing/pico-serprog" target="_blank">
                    {t("tonieboxes.cc3235BoxFlashing.serprogFirmwareLink")}
                </Link>
            </Paragraph>
        </>
    );

    // step 1 - certificates
    const contentStep1 = (
        <>
            <h3>{t("tonieboxes.cc3235BoxFlashing.certificates")}</h3>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.certificatesIntro")}</Paragraph>
            <h4>{t("tonieboxes.cc3235BoxFlashing.dumpCertificates")}</h4>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.dumpCertificatesIntro1")}</Paragraph>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.dumpCertificatesIntro2")}</Paragraph>
            <h4>CC3235</h4>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.dumpCertificatesCC3235")}</Paragraph>
            <h5>{t("tonieboxes.cc3235BoxFlashing.readingFlashPico")}</h5>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.readingFlashPicoText1")}</Paragraph>
            <Paragraph>
                <SyntaxHighlighter
                    language="shell"
                    style={detectColorScheme() === "dark" ? oneDark : oneLight}
                    customStyle={{
                        borderRadius: 0,
                        margin: 0,
                        border: "none",
                    }}
                    wrapLines={true}
                    lineProps={{ style: { whiteSpace: "pre-wrap" } }}
                >
                    {`flashrom -p serprog:dev=/dev/ttyACM0:921600 -r cc32xx-flash.bin --progress`}
                </SyntaxHighlighter>
            </Paragraph>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.readingFlashPicoText2")}</Paragraph>
            <Paragraph>
                <SyntaxHighlighter
                    language="shell"
                    style={detectColorScheme() === "dark" ? oneDark : oneLight}
                    customStyle={{
                        borderRadius: 0,
                        margin: 0,
                        border: "none",
                    }}
                    wrapLines={true}
                    lineProps={{ style: { whiteSpace: "pre-wrap" } }}
                >
                    {`flashrom -p serprog:dev=/dev/ttyACM0:921600 -r cc32xx-flash.2.bin --progress diff cc32xx-flash.bin cc32xx-flash.2.bin #no output = equal`}
                </SyntaxHighlighter>
            </Paragraph>
            <h5>{t("tonieboxes.cc3235BoxFlashing.extractCertificates")}</h5>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.useCC3200ToolToExtract")}</Paragraph>
            <Paragraph>
                <SyntaxHighlighter
                    language="shell"
                    style={detectColorScheme() === "dark" ? oneDark : oneLight}
                    customStyle={{
                        borderRadius: 0,
                        margin: 0,
                        border: "none",
                    }}
                    wrapLines={true}
                    lineProps={{ style: { whiteSpace: "pre-wrap" } }}
                >
                    {`cc3200tool -if cc32xx-flash.bin -d cc32xx read_all_files extract/`}
                </SyntaxHighlighter>
            </Paragraph>
            <h4>{t("tonieboxes.cc3235BoxFlashing.flashCAreplacement")}</h4>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.flashCAreplacementText1")}</Paragraph>

            <Paragraph>
                <SyntaxHighlighter
                    language="shell"
                    style={detectColorScheme() === "dark" ? oneDark : oneLight}
                    customStyle={{
                        borderRadius: 0,
                        margin: 0,
                        border: "none",
                    }}
                    wrapLines={true}
                    lineProps={{ style: { whiteSpace: "pre-wrap" } }}
                >
                    {`cc3200tool -if cc32xx-flash.bin -of cc32xx-flash.customca.bin -d cc32xx write_file customca.der /cert/ca.der
flashrom -p serprog:dev=/dev/ttyACM0:921600 -w cc32xx-flash.bin --progress`}
                </SyntaxHighlighter>
            </Paragraph>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.flashCAreplacementText2")}</Paragraph>
        </>
    );

    // step 2 - dns
    const contentStep2 = (
        <>
            <h3>{t("tonieboxes.cc3235BoxFlashing.dns")}</h3>
            <h4>{t("tonieboxes.cc3235BoxFlashing.dnsHint")}</h4>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.dnsText1")}</Paragraph>
            <Alert
                type="warning"
                showIcon
                message={t("tonieboxes.cc3235BoxFlashing.dnsBeware")}
                description={t("tonieboxes.cc3235BoxFlashing.dnsBewareText")}
                style={{ marginBottom: 16 }}
            />
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.dnsText2")}</Paragraph>
            <Paragraph>
                <SyntaxHighlighter
                    language="shell"
                    style={detectColorScheme() === "dark" ? oneDark : oneLight}
                    customStyle={{
                        borderRadius: 0,
                        margin: 0,
                        border: "none",
                    }}
                    wrapLines={true}
                    lineProps={{ style: { whiteSpace: "pre-wrap" } }}
                >
                    {`uci set dhcp.teddycloud="tag"
uci set dhcp.teddycloud.dhcp_option="3,1.2.3.4" # 1.2.3.4=teddycloud ip

uci add dhcp host
uci set dhcp.@host[-1].name="toniebox_1"
uci set dhcp.@host[-1].mac="00:11:22:33:44:55" # toniebox mac
uci set dhcp.@host[-1].ip="1.2.3.101" # toniebox_1 ip
uci set dhcp.@host[-1].tag="teddycloud"
uci commit dhcp
/etc/init.d/dnsmasq restart`}
                </SyntaxHighlighter>
            </Paragraph>
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
                default:
                    return <div></div>;
            }
        };

        updateContent(currentStep, getContentForStep());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, currentLanguage, detectColorScheme()]);

    const prev = () => {
        setCurrent(currentStep - 1);
    };

    const next = () => {
        setCurrent(currentStep + 1);
    };

    const previousButton = (
        <Button icon={<LeftOutlined />} onClick={() => prev()}>
            {t("tonieboxes.cc3235BoxFlashing.previous")}
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
            title: t("tonieboxes.cc3235BoxFlashing.commonName"),
            dataIndex: "commonName",
            key: "commonName",
        },
        {
            title: t("tonieboxes.cc3235BoxFlashing.boxVersion"),
            dataIndex: "version",
            key: "version",
        },
        {
            title: t("tonieboxes.cc3235BoxFlashing.status"),
            dataIndex: "status",
            key: "status",
        },
    ];

    const availableBoxesModal = (
        <Modal
            title={t("tonieboxes.cc3235BoxFlashing.availableBoxes")}
            open={isOpenAvailableBoxesModal}
            onOk={handleAvailableBoxesModalOk}
            onCancel={handleAvailableBoxesModalCancel}
        >
            <Paragraph>
                <Paragraph>{t("tonieboxes.cc3235BoxFlashing.newBoxAvailable")}</Paragraph>
                <Link
                    to="https://tonies-wiki.revvox.de/docs/tools/teddycloud/setup/test-troubleshooting/"
                    target="_blank"
                >
                    {t("tonieboxes.cc3235BoxFlashing.troubleShooting")}
                </Link>
            </Paragraph>
            <h4>{t("tonieboxes.cc3235BoxFlashing.availableBoxes")}</h4>
            <Table
                dataSource={tonieboxes.filter((box) => box.version === "CC3235")}
                columns={availableBoxesModalColumns}
                rowKey="ID"
                pagination={false}
            />
        </Modal>
    );

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
                        { title: t("tonieboxes.cc3235BoxFlashing.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t(`tonieboxes.cc3235BoxFlashing.title`)}</h1>
                    <Divider>{t("tonieboxes.cc3235BoxFlashing.title")}</Divider>
                    <Paragraph style={{ marginTop: 16 }}>
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
                                        <Button icon={<RightOutlined />} iconPosition="end" onClick={next}>
                                            {t("tonieboxes.cc3235BoxFlashing.next")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {currentStep === 1 && (
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    {previousButton}
                                    <div></div>
                                    <div>
                                        <Button icon={<CheckSquareOutlined />} type="primary" onClick={next}>
                                            {t("tonieboxes.cc3235BoxFlashing.certificatesDumpedCAreplacementFlashed")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {currentStep === 2 && (
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    {previousButton}
                                    <div>
                                        <Button icon={<EyeOutlined />} type="primary" onClick={checkBoxes}>
                                            {t("tonieboxes.cc3235BoxFlashing.checkBoxes")}
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
