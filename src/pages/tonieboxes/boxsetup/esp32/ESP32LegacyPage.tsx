import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import i18n from "../../../../i18n";
import { Alert, Button, Divider, Image, Steps, Typography } from "antd";
import { EyeOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";

import { BoxVersionsEnum } from "../../../../types/tonieboxTypes";

import tbEsp32FlashESPtoolScreen from "../../../../assets/boxSetup/esp32_write_patched_image_with_esptools.png";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../../components/StyledComponents";
import AvailableBoxesModal, {
    certificateIntro,
    connectESP32Explanation,
    dnsForTeddyCloud,
} from "../../../../components/tonieboxes/boxSetup/CommonContent";
import { TonieboxesSubNav } from "../../../../components/tonieboxes/TonieboxesSubNav";
import CodeSnippet from "../../../../components/utils/CodeSnippet";
import { detectColorScheme } from "../../../../utils/browserUtils";

const { Paragraph } = Typography;
const { Step } = Steps;

export const ESP32LegacyPage = () => {
    const { t } = useTranslation();
    const currentLanguage = i18n.language;

    const [currentStep, setCurrent] = useState(0);

    const [isOpenAvailableBoxesModal, setIsOpenAvailableBoxesModal] = useState(false);

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

    const conESP32Explanation = connectESP32Explanation();

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
                {t("tonieboxes.esp32BoxFlashing.legacy.preparationText")}{" "}
                <Link
                    to="https://support.tonies.com/hc/en-us/articles/4415294030482-How-do-I-set-up-a-Wi-Fi-connection-without-the-setup-assistant"
                    target="_blank"
                >
                    {t("tonieboxes.esp32BoxFlashing.legacy.preparationTextLink")}
                </Link>
            </Paragraph>
            <h4>{t("tonieboxes.esp32BoxFlashing.legacy.installESPTool")}</h4>
            <Paragraph>{t("tonieboxes.esp32BoxFlashing.legacy.installESPToolText")}</Paragraph>
            <Paragraph>
                <Link to="https://github.com/espressif/esptool" target="_blank">
                    {t("tonieboxes.esp32BoxFlashing.legacy.installESPToolLink")}
                </Link>
            </Paragraph>
            <h4>{t("tonieboxes.esp32BoxFlashing.legacy.connectESP32")}</h4>
            {conESP32Explanation}
        </>
    );

    // step 1 - certificates
    const contentStep1 = (
        <>
            <h3>{t("tonieboxes.boxFlashingCommon.certificates")}</h3>
            {certificateIntro(false)}
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`# extract firmware
esptool.py -b 921600 read_flash 0x0 0x800000 tb.esp32.bin
# extract certficates from firmware
mkdir certs/client/esp32
mkdir certs/client/<mac>
teddycloud --esp32-extract tb.esp32.bin --destination certs/client/esp32

# Copy box certificates to teddyCloud
cp certs/client/esp32/CLIENT.DER certs/client/<mac>/client.der
cp certs/client/esp32/PRIVATE.DER certs/client/<mac>/private.der
cp certs/client/esp32/CA.DER certs/client/<mac>/ca.der

# In case of first Toniebox setup for TeddyCloud
cp certs/client/<mac>/client.der certs/client/client.der
cp certs/client/<mac>/private.der certs/client/private.der
cp certs/client/<mac>/ca.der certs/client/ca.der

# Copy certificates to temporary dir
mkdir certs/client/esp32-fakeca
cp certs/client/esp32/CLIENT.DER certs/client/esp32-fakeca/
cp certs/client/esp32/PRIVATE.DER certs/client/esp32-fakeca/
cp certs/server/ca.der certs/client/esp32-fakeca/CA.DER`}
                />
            </Paragraph>
            <Paragraph>{t("tonieboxes.esp32BoxFlashing.legacy.checkDumpIsOk")}</Paragraph>
            <h5>{t("tonieboxes.esp32BoxFlashing.legacy.flashCAreplacement")}</h5>
            {t("tonieboxes.esp32BoxFlashing.legacy.flashCAreplacementText1")}
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`# copy firmware backup
cp tb.esp32.bin tb.esp32.fakeca.bin

# inject new CA into firmware
teddycloud --esp32-inject tb.esp32.fakeca.bin --source certs/client/esp32-fakeca
# modify IP/hostname (optional)
teddycloud --esp32-hostpatch tb.esp32.fakeca.bin --hostname <YOUR-IP/HOST>

# flash firmware with new CA
esptool.py -b 921600 write_flash 0x0 tb.esp32.fakeca.bin`}
                />
            </Paragraph>
            <Image
                preview={false}
                src={tbEsp32FlashESPtoolScreen}
                alt={t("tonieboxes.esp32BoxFlashing.legacy.flashESPtoolScreen")}
            />
            <Paragraph style={{ marginTop: 16 }}>
                {t("tonieboxes.esp32BoxFlashing.legacy.flashCAreplacementText2")}
            </Paragraph>
            <Paragraph>{t("tonieboxes.esp32BoxFlashing.legacy.flashCAreplacementText3")}</Paragraph>
        </>
    );

    // step 2 - dns
    const dnsForTC = dnsForTeddyCloud();
    const contentStep2 = (
        <>
            <h3>{t("tonieboxes.boxFlashingCommon.dns")}</h3>
            <Paragraph>{t("tonieboxes.esp32BoxFlashing.legacy.skipDnsIfAlreadyDone")}</Paragraph>
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
    }, [currentStep, currentLanguage, detectColorScheme()]);

    const prev = () => {
        setCurrent(currentStep - 1);
    };

    const next = () => {
        setCurrent(currentStep + 1);
    };

    const previousButton = (
        <Button icon={<LeftOutlined />} onClick={() => prev()}>
            {t("tonieboxes.esp32BoxFlashing.legacy.previous")}
        </Button>
    );

    const onChange = (value: number) => {
        setCurrent(value);
    };

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
            boxVersion={BoxVersionsEnum.esp32}
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
                        { title: t("tonieboxes.esp32BoxFlashing.legacy.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t(`tonieboxes.esp32BoxFlashing.legacy.title`)}</h1>
                    <Divider>{t("tonieboxes.esp32BoxFlashing.legacy.title")}</Divider>
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
                                            {t("tonieboxes.esp32BoxFlashing.legacy.next")}
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
                                    <div>
                                        <Button icon={<EyeOutlined />} type="primary" onClick={checkBoxes}>
                                            {t("tonieboxes.esp32BoxFlashing.legacy.checkBoxes")}
                                        </Button>
                                    </div>
                                    <div>
                                        <Button icon={<RightOutlined />} onClick={next}>
                                            {t("tonieboxes.esp32BoxFlashing.legacy.proceedWithDNS")}
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
                                            {t("tonieboxes.esp32BoxFlashing.legacy.checkBoxes")}
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
