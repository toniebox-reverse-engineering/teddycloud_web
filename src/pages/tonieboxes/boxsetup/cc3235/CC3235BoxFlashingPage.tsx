import { useTranslation } from "react-i18next";
import { Alert, Button, Collapse, Divider, Image, Steps, Typography } from "antd";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../../components/StyledComponents";
import { TonieboxesSubNav } from "../../../../components/tonieboxes/TonieboxesSubNav";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { detectColorScheme } from "../../../../utils/browserUtils";
import i18n from "../../../../i18n";
import { CheckSquareOutlined, EyeOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import CodeSnippet from "../../../../utils/codeSnippet";

import cc3235Flash from "../../../../assets/boxSetup/cc3235_flash.jpg";
import cc3235SMDGrippers from "../../../../assets/boxSetup/cc3235_smd_grippers.jpg";
import AvailableBoxesModal, {
    certificateIntro,
    dnsForTeddyCloud,
} from "../../../../components/tonieboxes/boxSetup/CommonContent";

const { Paragraph } = Typography;
const { Step } = Steps;

export const CC3235BoxFlashingPage = () => {
    const { t } = useTranslation();
    const currentLanguage = i18n.language;
    const [currentStep, setCurrent] = useState(0);
    const [content, setContent] = useState([<></>, <></>, <></>]);

    const [isOpenAvailableBoxesModal, setIsOpenAvailableBoxesModal] = useState(false);

    const updateContent = (index: number, newContent: JSX.Element) => {
        setContent((prevContent) => {
            const updatedContent = [...prevContent];
            updatedContent[index] = newContent;
            return updatedContent;
        });
    };

    const steps = [
        {
            title: t("tonieboxes.boxFlashingCommon.preparations"),
        },
        {
            title: t("tonieboxes.boxFlashingCommon.certificates"),
        },
        {
            title: t("tonieboxes.boxFlashingCommon.dns"),
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
            <h3>{t("tonieboxes.boxFlashingCommon.certificates")}</h3>
            {certificateIntro()}
            <h4>CC3235</h4>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.dumpCertificatesCC3235")}</Paragraph>
            <Collapse
                size="small"
                style={{ marginBottom: 16 }}
                items={[
                    {
                        key: "1",
                        label: t("tonieboxes.cc3235BoxFlashing.flashCollapse.collapseTitle"),
                        children: (
                            <>
                                <Paragraph
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Image.PreviewGroup>
                                        <div style={{ display: "inline-block", margin: "0 20px" }}>
                                            <Image
                                                src={cc3235Flash}
                                                height={200}
                                                alt={t("tonieboxes.cc3235BoxFlashing.flashCollapse.cc3235flash")}
                                            />
                                            <p style={{ marginTop: 8 }}>
                                                {t("tonieboxes.cc3235BoxFlashing.flashCollapse.cc3235flash")}
                                            </p>
                                        </div>
                                        <div style={{ maxWidth: 200, display: "inline-block", margin: "0 20px" }}>
                                            <Image
                                                src={cc3235SMDGrippers}
                                                height={200}
                                                alt={t(
                                                    "tonieboxes.cc3235BoxFlashing.flashCollapse.cc3235flashWithSMDGrippers"
                                                )}
                                            />
                                            <p style={{ marginTop: 8 }}>
                                                {t(
                                                    "tonieboxes.cc3235BoxFlashing.flashCollapse.cc3235flashWithSMDGrippers"
                                                )}
                                            </p>
                                        </div>
                                    </Image.PreviewGroup>
                                </Paragraph>
                            </>
                        ),
                    },
                ]}
            />
            <h5>{t("tonieboxes.cc3235BoxFlashing.readingFlashPico")}</h5>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.readingFlashPicoText1")}</Paragraph>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`flashrom -p serprog:dev=/dev/ttyACM0:921600 -r cc32xx-flash.bin --progress`}
                />
            </Paragraph>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.readingFlashPicoText2")}</Paragraph>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`flashrom -p serprog:dev=/dev/ttyACM0:921600 -r cc32xx-flash.2.bin --progress diff cc32xx-flash.bin cc32xx-flash.2.bin #no output = equal`}
                />
            </Paragraph>
            <h5>{t("tonieboxes.cc3235BoxFlashing.extractCertificates")}</h5>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.useCC3200ToolToExtract")}</Paragraph>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`cc3200tool -if cc32xx-flash.bin -d cc32xx read_all_files extract/`}
                />
            </Paragraph>
            <h4>{t("tonieboxes.cc3235BoxFlashing.flashCAreplacement")}</h4>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.flashCAreplacementText1")}</Paragraph>

            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`cc3200tool -if cc32xx-flash.bin -of cc32xx-flash.customca.bin -d cc32xx write_file customca.der /cert/ca.der
flashrom -p serprog:dev=/dev/ttyACM0:921600 -w cc32xx-flash.bin --progress`}
                />
            </Paragraph>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.flashCAreplacementText2")}</Paragraph>
        </>
    );

    // step 2 - dns
    const contentStep2 = (
        <>
            <h3>{t("tonieboxes.boxFlashingCommon.dns")}</h3>
            {dnsForTeddyCloud()}
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
            boxVersion="CC3235"
            isOpen={isOpenAvailableBoxesModal}
            onClose={handleAvailableBoxesModalClose}
        />
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
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <Button icon={<RightOutlined />} iconPosition="end" onClick={next}>
                                            {t("tonieboxes.cc3235BoxFlashing.next")}
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
                                            {t("tonieboxes.cc3235BoxFlashing.certificatesDumpedCAreplacementFlashed")}
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
