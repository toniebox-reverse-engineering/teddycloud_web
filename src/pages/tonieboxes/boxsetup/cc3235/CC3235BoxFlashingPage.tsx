import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../../../../i18n";
import { Alert, Button, Collapse, Divider, Image, Steps, Tabs, TabsProps, Typography } from "antd";
import { CheckSquareOutlined, EyeOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";

import { BoxVersionsEnum } from "../../../../types/tonieboxTypes";

import cc3235Flash from "../../../../assets/boxSetup/cc3235_flash.jpg";
import cc3235SMDGrippers from "../../../../assets/boxSetup/cc3235_smd_grippers.jpg";
import cc3235CH341AProgrammer1 from "../../../../assets/boxSetup/01_CH341A_programmer_1.png";
import cc3235CH341AProgrammer2 from "../../../../assets/boxSetup/01_CH341A_programmer_2.png";
import cc3235CH341Sop81 from "../../../../assets/boxSetup/02_CH341A_sop8_1.jpg";
import cc3235CH341Sop82 from "../../../../assets/boxSetup/02_CH341A_sop8_2.jpg";
import cc3235CH341Sop83 from "../../../../assets/boxSetup/02_CH341A_sop8_3.jpg";
import cc3235CH341Sop8remove from "../../../../assets/boxSetup/02_CH341A_sop8_remove.jpg";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../../components/StyledComponents";
import { TonieboxesSubNav } from "../../../../components/tonieboxes/TonieboxesSubNav";
import AvailableBoxesModal, {
    certificateIntro,
    dnsForTeddyCloud,
} from "../../../../components/tonieboxes/boxSetup/CommonContent";
import CodeSnippet from "../../../../components/utils/CodeSnippet";
import { detectColorScheme } from "../../../../utils/browserUtils";

const { Paragraph } = Typography;
const { Step } = Steps;

export const CC3235BoxFlashingPage = () => {
    const { t } = useTranslation();
    const currentLanguage = i18n.language;
    const [currentStep, setCurrent] = useState(0);

    const [isOpenAvailableBoxesModal, setIsOpenAvailableBoxesModal] = useState(false);

    const [activeKey, setActiveKey] = useState<string>("picoHW");
    const [commonActiveKey, setCommenActiveKey] = useState<string>("pico");

    useEffect(() => {
        setCommenActiveKey(activeKey.slice(0, -2));
    }, [activeKey]);

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
    const picoPrepTab = (
        <>
            <h4>{t("tonieboxes.cc3235BoxFlashing.installSerprogFirmware")}</h4>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.pico.preparation")}</Paragraph>
            <Paragraph>
                <Link to="https://github.com/stacksmashing/pico-serprog" target="_blank">
                    {t("tonieboxes.cc3235BoxFlashing.serprogFirmwareLink")}
                </Link>
            </Paragraph>
        </>
    );

    const ch341aPrepTab = (
        <>
            <h4>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.CH341AProgrammer")}</h4>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.preparation")}</Paragraph>
            <ul>
                <li>
                    {t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.prep1")}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            gap: 16,
                            margin: 8,
                        }}
                    >
                        <Image
                            src={cc3235CH341AProgrammer1}
                            style={{ maxHeight: 200, width: "auto" }}
                            alt={t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.CH341AProgrammer")}
                        />
                    </div>
                </li>
                <li>
                    {t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.prep2")}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            gap: 16,
                            margin: 8,
                        }}
                    >
                        <Image
                            src={cc3235CH341Sop8remove}
                            style={{ maxHeight: 100, width: "auto" }}
                            alt={t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.CH341Sop8remove")}
                        />
                    </div>
                </li>
                <li>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.prep3")}</li>
                <li>
                    {t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.prep4")}
                    <CodeSnippet
                        language="shell"
                        code={`lsusb 

~$ lsusb
Bus 004 Device 012: ID 1a86:5512 QinHeng Electronics CH341 in EPP/MEM/I2C mode, EPP/I2C adapter
Bus 004 Device 001: ID 1d6b:0001 Linux Foundation 1.1 root hub
Bus 002 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 003 Device 001: ID 1d6b:0001 Linux Foundation 1.1 root hub
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub`}
                    />
                </li>
            </ul>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.prepConclusions1")}</Paragraph>
            <Paragraph>
                {t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.prepConclusions2")}{" "}
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: 16,
                        margin: 8,
                    }}
                >
                    <Image
                        src={cc3235CH341AProgrammer2}
                        style={{ maxHeight: 100, width: "auto" }}
                        alt={t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.CH341AProgrammerClampConnection")}
                    />
                </div>
            </Paragraph>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.prepConclusions3")}</Paragraph>
        </>
    );

    const hwHelperPrep: TabsProps["items"] = [
        { key: "picoHW", label: "Raspberry Pi Pico", children: picoPrepTab },
        { key: "ch341aHW", label: "CH341A Programmer", children: ch341aPrepTab },
    ];

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
            <h4>{t("tonieboxes.cc3235BoxFlashing.locateFlashMemory")}</h4>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.locateFlashMemoryText")}</Paragraph>
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
                                        flexWrap: "wrap",
                                        gap: 16,
                                    }}
                                >
                                    <Image.PreviewGroup>
                                        <div style={{ maxWidth: 200, justifyItems: "center" }}>
                                            <Image
                                                src={cc3235Flash}
                                                style={{ maxHeight: 200, width: "auto" }}
                                                alt={t("tonieboxes.cc3235BoxFlashing.flashCollapse.cc3235flash")}
                                            />
                                            <p style={{ marginTop: 8 }}>
                                                {t("tonieboxes.cc3235BoxFlashing.flashCollapse.cc3235flash")}
                                            </p>
                                        </div>
                                        <div style={{ maxWidth: 200, justifyItems: "center" }}>
                                            <Image
                                                src={cc3235SMDGrippers}
                                                style={{ maxHeight: 200, width: "auto" }}
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
                                        <div style={{ maxWidth: 200, justifyItems: "center" }}>
                                            <Image
                                                src={cc3235CH341Sop81}
                                                style={{ maxHeight: 200, width: "auto", maxWidth: 200 }}
                                                alt={t("tonieboxes.cc3235BoxFlashing.flashCollapse.sop8Clamp")}
                                            />
                                            <p style={{ marginTop: 8 }}>
                                                {t("tonieboxes.cc3235BoxFlashing.flashCollapse.sop8Clamp")}
                                            </p>
                                        </div>
                                        <div style={{ maxWidth: 200, justifyItems: "center" }}>
                                            <Image
                                                src={cc3235CH341Sop83}
                                                style={{ maxHeight: 200, width: "auto", maxWidth: 200 }}
                                                alt={t("tonieboxes.cc3235BoxFlashing.flashCollapse.sop8Clamp")}
                                            />
                                            <p style={{ marginTop: 8 }}>
                                                {t("tonieboxes.cc3235BoxFlashing.flashCollapse.sop8Clamp")}
                                            </p>
                                        </div>
                                        <div style={{ maxWidth: 200, justifyItems: "center" }}>
                                            <Image
                                                src={cc3235CH341Sop82}
                                                style={{ maxHeight: 200, width: "auto", maxWidth: 200 }}
                                                alt={t("tonieboxes.cc3235BoxFlashing.flashCollapse.sop8Clamp")}
                                            />
                                            <p style={{ marginTop: 8 }}>
                                                {t("tonieboxes.cc3235BoxFlashing.flashCollapse.sop8Clamp")}
                                            </p>
                                        </div>
                                    </Image.PreviewGroup>
                                </Paragraph>
                            </>
                        ),
                    },
                ]}
            />
            <h4>{t("tonieboxes.cc3235BoxFlashing.installflashromtool")}</h4>
            {t("tonieboxes.cc3235BoxFlashing.installflashromtoolText")}
            <CodeSnippet language="shell" code={`sudo apt-get install flashrom`} />
            <Link to="https://www.flashrom.org/" target="_blank">
                {t("tonieboxes.cc3235BoxFlashing.installflashromtoolLink")}
            </Link>
            <h4>{t("tonieboxes.cc3235BoxFlashing.installCC3200tool")}</h4>
            <Link
                to="https://github.com/toniebox-reverse-engineering/cc3200tool?tab=readme-ov-file#installation"
                target="_blank"
            >
                {t("tonieboxes.cc3235BoxFlashing.installCC3200toolLink")}
            </Link>
            <h4>{t("tonieboxes.cc3235BoxFlashing.hwToolSpecific")}</h4>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.hwToolSpecificText")}</Paragraph>
            <Tabs
                onChange={(newKey) => setActiveKey(newKey)}
                activeKey={commonActiveKey + "HW"}
                items={hwHelperPrep}
                indicator={{ size: (origin) => origin - 20, align: "center" }}
            />
        </>
    );

    // step 1 - certificates
    const commonCAcontent = (
        <>
            <h4>{t("tonieboxes.cc3235BoxFlashing.flashCAreplacement")}</h4>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.flashCAreplacementText1")}</Paragraph>
            <Alert
                type="warning"
                showIcon
                message={t("tonieboxes.cc3235BoxFlashing.flashCAReplacementTitle")}
                description={
                    <>
                        {t("tonieboxes.cc3235BoxFlashing.flashCAReplacementDescription1")}{" "}
                        <Link
                            to="https://raw.githubusercontent.com/toniebox-reverse-engineering/teddycloud/master/contrib/gencerts.sh"
                            target="_blank"
                        >
                            {t("tonieboxes.cc3235BoxFlashing.gencertLinkText")}{" "}
                        </Link>{" "}
                        {t("tonieboxes.cc3235BoxFlashing.flashCAReplacementDescription2")}{" "}
                        {t("tonieboxes.cc3235BoxFlashing.flashCAReplacementDescription3")}
                    </>
                }
                style={{ marginBottom: 16 }}
            />
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.flashCAreplacementText3")}</Paragraph>
        </>
    );

    const picoCertTab = (
        <>
            <h5>{t("tonieboxes.cc3235BoxFlashing.pico.readingFlash")}</h5>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.pico.readingFlashText1")}</Paragraph>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`flashrom -p serprog:dev=/dev/ttyACM0:921600 -r cc32xx-flash.bin --progress`}
                />
            </Paragraph>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.pico.readingFlashText2")}</Paragraph>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`flashrom -p serprog:dev=/dev/ttyACM0:921600 -r cc32xx-flash.2.bin --progress 
diff cc32xx-flash.bin cc32xx-flash.2.bin #no output = equal`}
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
            {commonCAcontent}
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`cc3200tool -if cc32xx-flash.bin -of cc32xx-flash.customca.bin -d cc32xx write_file ca.der /cert/ca.der`}
                />
            </Paragraph>

            <h5>{t("tonieboxes.cc3235BoxFlashing.pico.writingFlash")}</h5>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`flashrom -p serprog:dev=/dev/ttyACM0:921600 -w cc32xx-flash.customca.bin --progress`}
                />
            </Paragraph>
        </>
    );

    const ch341aCertTab = (
        <>
            <h5>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.readingFlash")}</h5>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.flashMemoryDumpText1")}</Paragraph>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.flashMemoryDumpText2")}</Paragraph>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.flashMemoryDumpText3")}</Paragraph>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.flashMemoryDumpText4")}</Paragraph>
            <CodeSnippet language="shell" code={`flashrom -p ch341a_spi -r backupCC3235-1.bin`} />
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.flashMemoryDumpText5")}</Paragraph>
            <CodeSnippet language="shell" code={`flashrom -p ch341a_spi -r backupCC3235-2.bin`} />
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.flashMemoryDumpText6")}</Paragraph>
            <CodeSnippet language="shell" code={`diff backupCC3235-1.bin backupCC3235-2.bin #no output = equal`} />
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.flashMemoryDumpText7")}</Paragraph>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.flashMemoryDumpText8")}</Paragraph>
            <h5>{t("tonieboxes.cc3235BoxFlashing.extractCertificates")}</h5>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.useCC3200ToolToExtract")}</Paragraph>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`cc3200tool -if backupCC3235-1.bin -d cc32xx read_all_files extract/`}
                />
            </Paragraph>
            {commonCAcontent}
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`cc3200tool -if backupCC3235-1.bin -of cc32xx-flash.customca.bin -d cc32xx write_file ca.der /cert/ca.der`}
                />
            </Paragraph>
            <h5>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.writingFlash")}</h5>
            <Paragraph>
                <CodeSnippet language="shell" code={`flashrom -p ch341a_spi -w cc32xx-flash.customca.bin --progress`} />
            </Paragraph>
        </>
    );

    const hwHelperCert: TabsProps["items"] = [
        { key: "picoCE", label: "Raspberry Pi Pico", children: picoCertTab },
        { key: "ch341aCE", label: "CH341A Programmer", children: ch341aCertTab },
    ];

    const contentStep1 = (
        <>
            <h3>{t("tonieboxes.boxFlashingCommon.certificates")}</h3>
            {certificateIntro(false)}
            <h4>CC3235</h4>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.dumpCertificatesCC3235")}</Paragraph>
            <Tabs
                onChange={(newKey) => setActiveKey(newKey)}
                activeKey={commonActiveKey + "CE"}
                items={hwHelperCert}
                indicator={{ size: (origin) => origin - 20, align: "center" }}
            />
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.flashCAreplacementText2")}</Paragraph>
        </>
    );

    // step 2 - dns
    const dnsForTC = dnsForTeddyCloud();
    const contentStep2 = (
        <>
            <h3>{t("tonieboxes.boxFlashingCommon.dns")}</h3>
            {dnsForTC}
        </>
    );

    const [content, setContent] = useState([contentStep0, contentStep1, contentStep2]);
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
                default:
                    return <div></div>;
            }
        };

        updateContent(currentStep, getContentForStep());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, currentLanguage, detectColorScheme(), commonActiveKey]);

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
            boxVersion={BoxVersionsEnum.cc3235}
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
