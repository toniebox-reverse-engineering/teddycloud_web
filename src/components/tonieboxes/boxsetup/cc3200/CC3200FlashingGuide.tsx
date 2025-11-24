import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Divider, Steps, Typography } from "antd";
import { CheckSquareOutlined, CodeOutlined, EyeOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";

import { BoxVersionsEnum } from "../../../../types/tonieboxTypes";

import { useAltUrlCustomPatch } from "./hooks/useAltUrlCustomPatch";
import { Step0Preparations } from "./steps/Step0Preparations";
import { Step1Bootloader } from "./steps/Step1Bootloader";
import { Step2Certificates } from "./steps/Step2Certificates";
import { Step3Patches } from "./steps/Step3Patches";
import { Step4ApplyingPatches } from "./steps/Step4ApplyingPatches";
import AvailableBoxesModal from "../common/modals/AvailableBoxesModal";

const { Paragraph } = Typography;

export const CC3200BoxFlashingGuide: React.FC = () => {
    const { t } = useTranslation();

    const [currentStep, setCurrentStep] = useState(0);
    const [hostname, setHostname] = useState<string>("");
    const [warningTextHostname, setWarningTextHostname] = useState<string>("");

    const [isOpenAvailableBoxesModal, setIsOpenAvailableBoxesModal] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentStep]);

    const steps = [
        { title: t("tonieboxes.boxFlashingCommon.preparations") },
        { title: t("tonieboxes.cc3200BoxFlashing.bootloader") },
        { title: t("tonieboxes.boxFlashingCommon.certificates") },
        { title: t("tonieboxes.cc3200BoxFlashing.patches") },
        { title: t("tonieboxes.cc3200BoxFlashing.applyingPatches") },
    ];

    interface AltUrlCustomPatchButtonProps {
        hostname: string;
        disabled: boolean;
    }

    const AltUrlCustomPatchButton: React.FC<AltUrlCustomPatchButtonProps> = ({ hostname, disabled }) => {
        const { t } = useTranslation();
        const { createPatch } = useAltUrlCustomPatch(hostname);

        return (
            <Button icon={<CodeOutlined />} disabled={disabled} type="primary" onClick={createPatch}>
                {t("tonieboxes.cc3200BoxFlashing.createPatch")}
            </Button>
        );
    };

    const sanitizeHostname = (input: string) => input.replace(/[^a-zA-Z0-9-.]/g, "").trim();

    const handleHostnameChange = (value: string) => {
        const sanitized = sanitizeHostname(value);
        let warningText = "";
        if (sanitized.length > 12) {
            warningText = t("tonieboxes.cc3200BoxFlashing.hostnameTooLong");
        }
        setHostname(sanitized);
        setWarningTextHostname(warningText);
    };

    const prev = () => setCurrentStep((s) => Math.max(0, s - 1));
    const next = () => setCurrentStep((s) => Math.min(steps.length - 1, s + 1));

    const showAvailableBoxesModal = () => setIsOpenAvailableBoxesModal(true);
    const handleAvailableBoxesModalClose = () => setIsOpenAvailableBoxesModal(false);

    const availableBoxesModal = (
        <AvailableBoxesModal
            boxVersion={BoxVersionsEnum.cc3200}
            isOpen={isOpenAvailableBoxesModal}
            onClose={handleAvailableBoxesModalClose}
        />
    );

    const isHostnameInvalid = hostname.length > 12 || hostname.length === 0;

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return <Step0Preparations />;
            case 1:
                return <Step1Bootloader />;
            case 2:
                return <Step2Certificates />;
            case 3:
                return (
                    <Step3Patches
                        hostname={hostname}
                        warningTextHostname={warningTextHostname}
                        onHostnameChange={handleHostnameChange}
                    />
                );
            case 4:
                return <Step4ApplyingPatches />;
            default:
                return null;
        }
    };

    const previousButton = (
        <Button icon={<LeftOutlined />} onClick={prev}>
            {t("tonieboxes.cc3200BoxFlashing.previous")}
        </Button>
    );

    const onStepChange = (value: number) => {
        setCurrentStep(value);
    };

    return (
        <>
            <h1>{t("tonieboxes.cc3200BoxFlashing.title")}</h1>
            <Divider>{t("tonieboxes.cc3200BoxFlashing.title")}</Divider>

            <Paragraph>
                <Steps
                    current={currentStep}
                    onChange={onStepChange}
                    items={steps.map((step, index) => ({
                        key: index,
                        title: step.title,
                        status: index === currentStep ? "process" : index < currentStep ? "finish" : "wait",
                    }))}
                />

                <div style={{ marginTop: 24 }}>{renderStepContent()}</div>

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
                            <div />
                            <div />
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
                            <div />
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
                            <div />
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
                                <AltUrlCustomPatchButton hostname={hostname} disabled={isHostnameInvalid} />
                            </div>
                            <div>
                                <Button icon={<RightOutlined />} iconPosition="end" onClick={next}>
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
                                <Button icon={<EyeOutlined />} type="primary" onClick={showAvailableBoxesModal}>
                                    {t("tonieboxes.cc3200BoxFlashing.checkBoxes")}
                                </Button>
                            </div>
                            <div />
                        </div>
                    )}
                </div>
            </Paragraph>

            {availableBoxesModal}
        </>
    );
};
