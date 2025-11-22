import React, { useEffect } from "react";
import { Alert, Button, Divider, Progress, Select, Steps, Tooltip, Typography } from "antd";
import {
    CodeOutlined,
    DownloadOutlined,
    EyeOutlined,
    FileAddOutlined,
    LeftOutlined,
    QuestionCircleOutlined,
    RightOutlined,
    RollbackOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { UseESP32FlasherResult } from "./hooks/useESP32Flasher";
import AvailableBoxesModal from "../../common/modals/AvailableBoxesModal";
import { BoxVersionsEnum } from "../../../../../types/tonieboxTypes";
import ConfirmationDialog from "../../../../common/ConfirmationDialog";
import { Step0ReadImport } from "./steps/Step0ReadImport";
import { Step1PatchFlash } from "./steps/Step1PatchFlash";
import { Step2FlashESP32 } from "./steps/Step2FlashESP32";
import { Step3AfterFlash } from "./steps/Step3AfterFlash";

const { Paragraph } = Typography;
const { Step } = Steps;

interface ContentProps {
    flasher: UseESP32FlasherResult;
}

export const Flashing: React.FC<ContentProps> = ({ flasher }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const {
        state,
        setState,
        currentStep,
        isSupported,
        baudRate,
        baudRates,
        handleBaudrateChange,
        disableButtons,
        certDir,
        isConfirmFlashModalOpen,
        setIsConfirmFlashModalOpen,
        isOverwriteForceConfirmationModalOpen,
        setIsOverwriteForceConfirmationModalOpen,
        extractCertificateErrorMessage,
        isOpenAvailableBoxesModal,
        setIsOpenAvailableBoxesModal,
        fileInputRef,
        loadFlashFile,
        readFlash,
        patchFlash,
        resetFlash,
        writeFlash,
        extractAndStoreCertsFromFlash,
        next,
        prev,
    } = flasher;

    const steps = [
        {
            title: t("tonieboxes.esp32BoxFlashing.esp32flasher.titleReadESP32ImportFlash"),
        },
        {
            title: t("tonieboxes.esp32BoxFlashing.esp32flasher.titlePatchFlash"),
        },
        {
            title: t("tonieboxes.esp32BoxFlashing.esp32flasher.titleFlashESP32"),
        },
        {
            title: t("tonieboxes.esp32BoxFlashing.esp32flasher.titleESP32FirmwareFlashed"),
        },
    ];

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentStep]);

    const backupHint = (
        <Alert
            type="warning"
            showIcon
            message={t("tonieboxes.esp32BoxFlashing.esp32flasher.backupFlash")}
            description={
                <>
                    <Paragraph>{t("tonieboxes.esp32BoxFlashing.esp32flasher.importanceBackup")}</Paragraph>
                    <Paragraph style={{ marginTop: 8 }}>
                        <b>
                            <a href={state.downloadLink} download={state.filename} title={state.filename}>
                                {t("tonieboxes.esp32BoxFlashing.esp32flasher.downloadLink")}
                            </a>
                        </b>
                    </Paragraph>
                </>
            }
        />
    );

    const contentProgress = state.showProgress ? (
        <div>
            <Progress percent={state.progress || 0} format={(percent) => `${(percent ?? 0).toFixed(2)}%`} />
        </div>
    ) : null;

    const contentRaw =
        state.chipType || state.chipMac ? (
            <>
                <Divider>{t("tonieboxes.esp32BoxFlashing.esp32flasher.infoTable")}</Divider>
                <table className="info-table">
                    <tbody>
                        {state.chipType && (
                            <tr>
                                <td>{t("tonieboxes.esp32BoxFlashing.esp32flasher.chipType")}</td>
                                <td>{state.chipType}</td>
                            </tr>
                        )}
                        {state.chipMac && (
                            <tr>
                                <td>{t("tonieboxes.esp32BoxFlashing.esp32flasher.chipMAC")}</td>
                                <td>{state.chipMac}</td>
                            </tr>
                        )}
                        {state.flashId && (
                            <tr>
                                <td>{t("tonieboxes.esp32BoxFlashing.esp32flasher.flashId")}</td>
                                <td>0x{state.flashId.toString()}</td>
                            </tr>
                        )}
                        {state.flashManuf && (
                            <tr>
                                <td>{t("tonieboxes.esp32BoxFlashing.esp32flasher.flashManuf")}</td>
                                <td>0x{state.flashManuf.toString()}</td>
                            </tr>
                        )}
                        {state.flashDevice && (
                            <tr>
                                <td>{t("tonieboxes.esp32BoxFlashing.esp32flasher.flashDevice")}</td>
                                <td>0x{state.flashDevice.toString()}</td>
                            </tr>
                        )}
                        {state.flashSize && (
                            <tr>
                                <td>{t("tonieboxes.esp32BoxFlashing.esp32flasher.flashSize")}</td>
                                <td>{state.flashSize} KiB</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </>
        ) : null;

    const readFirmware = () => {
        setState((prev) => ({
            ...prev,
            resetBox: false,
        }));
        readFlash();
    };

    const loadFileClick = () => {
        setState((prev) => ({
            ...prev,
            resetBox: false,
        }));
        fileInputRef.current?.click();
    };

    const doResetBox = () => {
        setState((prev) => ({
            ...prev,
            resetBox: true,
        }));
        fileInputRef.current?.click();
    };

    const patchImage = () => {
        patchFlash();
    };

    const flashESP32 = () => {
        writeFlash();
    };

    const extractCertsFromFlash = () => {
        extractAndStoreCertsFromFlash();
    };

    const handleConfirmFlash = () => {
        setIsConfirmFlashModalOpen(false);
        flashESP32();
    };

    const handleCancelFlash = () => {
        setIsConfirmFlashModalOpen(false);
    };

    const previousButton = (
        <Button icon={<LeftOutlined />} disabled={disableButtons} onClick={prev}>
            {t("tonieboxes.esp32BoxFlashing.esp32flasher.previous")}
        </Button>
    );

    const checkBoxes = () => {
        setIsOpenAvailableBoxesModal(true);
    };

    const availableBoxesModal = (
        <AvailableBoxesModal
            boxVersion={BoxVersionsEnum.esp32}
            isOpen={isOpenAvailableBoxesModal}
            onClose={() => setIsOpenAvailableBoxesModal(false)}
        />
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <Step0ReadImport
                        state={state}
                        fileInputRef={fileInputRef}
                        onFileChange={loadFlashFile}
                        contentProgress={contentProgress}
                    />
                );
            case 1:
                return (
                    <Step1PatchFlash
                        state={state}
                        setState={setState}
                        backupHint={backupHint}
                        contentProgress={contentProgress}
                    />
                );
            case 2:
                return <Step2FlashESP32 state={state} contentProgress={contentProgress} />;
            case 3:
                return (
                    <Step3AfterFlash
                        state={state}
                        certDir={certDir}
                        disableButtons={disableButtons}
                        contentProgress={contentProgress}
                        extractCertsFromFlash={extractCertsFromFlash}
                    />
                );
            default:
                return <div />;
        }
    };

    if (!isSupported) {
        return (
            <>
                <Paragraph>
                    <Alert
                        message={t("tonieboxes.esp32BoxFlashing.attention")}
                        description={t("tonieboxes.esp32BoxFlashing.browserNotSupported")}
                        type="warning"
                        showIcon
                    />
                </Paragraph>
                <Paragraph style={{ marginTop: 16 }}>
                    <Paragraph>{t("tonieboxes.esp32BoxFlashing.hintLegacyApproach")}</Paragraph>
                    <Paragraph>
                        <Button onClick={() => navigate("/tonieboxes/boxsetup/esp32/legacy")}>
                            {t("tonieboxes.esp32BoxFlashing.legacy.navigationTitle")}
                        </Button>
                    </Paragraph>
                </Paragraph>
            </>
        );
    }

    return (
        <>
            <Divider>{t("tonieboxes.esp32BoxFlashing.title")}</Divider>
            <ConfirmationDialog
                title={t("tonieboxes.esp32BoxFlashing.esp32flasher.confirmFlashModal")}
                open={isConfirmFlashModalOpen}
                okText={t("tonieboxes.esp32BoxFlashing.esp32flasher.flash")}
                cancelText={t("tonieboxes.esp32BoxFlashing.esp32flasher.cancel")}
                content={t("tonieboxes.esp32BoxFlashing.esp32flasher.confirmFlashDialog")}
                contentHint={t("tonieboxes.esp32BoxFlashing.esp32flasher.confirmFlashDialogHint")}
                handleOk={handleConfirmFlash}
                handleCancel={handleCancelFlash}
            />
            <Steps current={currentStep}>
                {steps.map((step, index) => (
                    <Step
                        key={index}
                        title={step.title}
                        status={
                            index === currentStep && index === steps.length - 1
                                ? "finish"
                                : index === currentStep
                                ? state.error
                                    ? "error"
                                    : "process"
                                : index < currentStep
                                ? "finish"
                                : "wait"
                        }
                        className={index === currentStep && state.actionInProgress ? "ant-steps-item-in-progress" : ""}
                    />
                ))}
            </Steps>
            <div style={{ marginTop: 24 }}>{renderStepContent()}</div>
            <div style={{ marginTop: 24, marginBottom: 24 }}>
                {currentStep === 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div>
                            <Paragraph>
                                <Button
                                    disabled={disableButtons}
                                    onClick={() => navigate("/tonieboxes/boxsetup/esp32/legacy")}
                                >
                                    {t("tonieboxes.esp32BoxFlashing.legacy.navigationTitle")}
                                </Button>
                            </Paragraph>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            <Tooltip title={t("tonieboxes.esp32BoxFlashing.esp32flasher.resetBoxineTooltip")}>
                                <Button icon={<RollbackOutlined />} disabled={disableButtons} onClick={doResetBox}>
                                    {t("tonieboxes.esp32BoxFlashing.esp32flasher.resetBoxine")}
                                </Button>
                            </Tooltip>
                            <Button icon={<FileAddOutlined />} disabled={disableButtons} onClick={loadFileClick}>
                                {t("tonieboxes.esp32BoxFlashing.esp32flasher.loadFile")}
                            </Button>
                            <Button
                                icon={<DownloadOutlined />}
                                disabled={disableButtons}
                                type="primary"
                                onClick={readFirmware}
                            >
                                {t("tonieboxes.esp32BoxFlashing.esp32flasher.readFlash")}
                            </Button>
                        </div>
                        <Button
                            icon={<RightOutlined />}
                            iconPosition="end"
                            disabled={(!state.proceed && !state.filename) || disableButtons}
                            onClick={next}
                        >
                            {t("tonieboxes.esp32BoxFlashing.esp32flasher.next")}
                        </Button>
                    </div>
                )}
                {currentStep === 1 && (
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        {previousButton}
                        <div style={{ display: "flex", gap: 8 }}>
                            <Button
                                icon={<CodeOutlined />}
                                disabled={
                                    disableButtons ||
                                    state.hostname === "" ||
                                    (state.flagPreviousHostname && state.previousHostname === "")
                                }
                                type="primary"
                                onClick={patchImage}
                            >
                                {t("tonieboxes.esp32BoxFlashing.esp32flasher.patchImage")}
                            </Button>
                        </div>
                        <Button
                            icon={<RightOutlined />}
                            iconPosition="end"
                            disabled={disableButtons || !state.showFlash}
                            onClick={next}
                        >
                            {t("tonieboxes.esp32BoxFlashing.esp32flasher.next")}
                        </Button>
                    </div>
                )}
                {currentStep === 2 && (
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        {previousButton}
                        <div style={{ display: "flex", gap: 8 }}>
                            <Button
                                icon={<UploadOutlined />}
                                disabled={disableButtons}
                                type="primary"
                                onClick={state.resetBox ? resetFlash : () => setIsConfirmFlashModalOpen(true)}
                            >
                                {t("tonieboxes.esp32BoxFlashing.esp32flasher.flashEsp32")}
                            </Button>
                        </div>
                        <div />
                    </div>
                )}
                {currentStep === 3 && (
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        {previousButton}
                        <div>
                            {state.resetBox ? (
                                ""
                            ) : (
                                <Button icon={<EyeOutlined />} type="primary" onClick={checkBoxes}>
                                    {t("tonieboxes.esp32BoxFlashing.legacy.checkBoxes")}
                                </Button>
                            )}
                        </div>
                        <div />
                    </div>
                )}
                {contentRaw}
            </div>
            {availableBoxesModal}
            <ConfirmationDialog
                title={t("tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificates409ResponseForceOverwrite")}
                okText={t(
                    "tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificates409ResponseForceOverwriteConfirmButton"
                )}
                cancelText={t("tonieboxes.esp32BoxFlashing.esp32flasher.cancel")}
                content={t(
                    "tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificates409ResponseForceOverwriteContent",
                    { error: extractCertificateErrorMessage }
                )}
                open={isOverwriteForceConfirmationModalOpen}
                handleOk={() => extractAndStoreCertsFromFlash(true)}
                handleCancel={() => setIsOverwriteForceConfirmationModalOpen(false)}
            />
        </>
    );
};
