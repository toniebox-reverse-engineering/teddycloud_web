import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Divider, Steps, Typography } from "antd";
import { CheckSquareOutlined, EyeOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";

import { BoxVersionsEnum } from "../../../../types/tonieboxTypes";

import { CC3235Step0Preparations } from "./steps/Step0Preparations";
import { Step1Certificates } from "./steps/Step1Certificates";
import { Step2Dns } from "./steps/Step2Dns";
import AvailableBoxesModal from "../common/modals/AvailableBoxesModal";

const { Paragraph } = Typography;

type HwTool = "pico" | "ch341a";

export const CC3235BoxFlashingGuide: React.FC = () => {
    const { t } = useTranslation();

    const [currentStep, setCurrentStep] = useState(0);
    const [isOpenAvailableBoxesModal, setIsOpenAvailableBoxesModal] = useState(false);

    const [hwTool, setHwTool] = useState<HwTool>("pico");

    const steps = [
        { title: t("tonieboxes.boxFlashingCommon.preparations") },
        { title: t("tonieboxes.boxFlashingCommon.certificates") },
        { title: t("tonieboxes.boxFlashingCommon.dns") },
    ];

    const prev = () => setCurrentStep((s) => Math.max(0, s - 1));
    const next = () => setCurrentStep((s) => Math.min(steps.length - 1, s + 1));
    const onStepChange = (value: number) => setCurrentStep(value);

    const showAvailableBoxesModal = () => setIsOpenAvailableBoxesModal(true);
    const handleAvailableBoxesModalClose = () => setIsOpenAvailableBoxesModal(false);

    const availableBoxesModal = (
        <AvailableBoxesModal
            boxVersion={BoxVersionsEnum.cc3235}
            isOpen={isOpenAvailableBoxesModal}
            onClose={handleAvailableBoxesModalClose}
        />
    );

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentStep]);

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return <CC3235Step0Preparations hwTool={hwTool} onHwToolChange={setHwTool} />;
            case 1:
                return <Step1Certificates hwTool={hwTool} onHwToolChange={setHwTool} />;
            case 2:
                return <Step2Dns />;
            default:
                return null;
        }
    };

    const previousButton = (
        <Button icon={<LeftOutlined />} onClick={prev}>
            {t("tonieboxes.cc3235BoxFlashing.previous")}
        </Button>
    );

    return (
        <>
            <h1>{t("tonieboxes.cc3235BoxFlashing.title")}</h1>
            <Divider>{t("tonieboxes.cc3235BoxFlashing.title")}</Divider>

            <Paragraph style={{ marginTop: 16 }}>
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
                            <div style={{ display: "flex", gap: 8 }}>
                                <Button icon={<RightOutlined />} iconPlacement="end" onClick={next}>
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
                            <div />
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
                                <Button icon={<EyeOutlined />} type="primary" onClick={showAvailableBoxesModal}>
                                    {t("tonieboxes.cc3235BoxFlashing.checkBoxes")}
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
