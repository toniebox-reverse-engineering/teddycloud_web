import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, Divider, Progress, Select, Steps, theme, Tooltip, Typography } from "antd";
import {
    CodeOutlined,
    DownloadOutlined,
    EyeOutlined,
    FileAddOutlined,
    LeftOutlined,
    RightOutlined,
    RollbackOutlined,
    UploadOutlined,
    QuestionCircleOutlined,
    SyncOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useESP32Flasher } from "./hooks/useESP32Flasher";
import AvailableBoxesModal from "../../common/modals/AvailableBoxesModal";
import { BoxVersionsEnum } from "../../../../../types/tonieboxTypes";
import ConfirmationDialog from "../../../../common/modals/ConfirmationModal";
import { Step1ReadImport } from "./steps/Step1ReadImport";
import { Step2PatchFlash } from "./steps/Step2PatchFlash";
import { Step3FlashESP32 } from "./steps/Step3FlashESP32";
import { Step4AfterFlash } from "./steps/Step4AfterFlash";
import { canHover, scrollToTop } from "../../../../../utils/browser/browserUtils";
import { LogViewer } from "../elements/LogViewer";
import { Step0Preparations } from "./steps/Step0Preparations";

const { Paragraph } = Typography;
const { Option } = Select;
const { useToken } = theme;

interface FlashingProps {
    useRevvoxFlasher: boolean;
}

export const Flashing: React.FC<FlashingProps> = ({ useRevvoxFlasher }) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const navigate = useNavigate();
    const [logEntries, setLogEntries] = useState<string[]>([]);

    const logListRef = useRef<HTMLDivElement>(null);

    const scrollToTopAnchor = useRef<HTMLDivElement | null>(null);

    const flasher = useESP32Flasher(useRevvoxFlasher, scrollToTopAnchor.current, logEntries, setLogEntries);

    const {
        state,
        setState,
        currentStep,
        isSupported,
        httpsActive,
        httpsUrl,
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
        openHttpsUrl,
    } = flasher;

    const [step0Ack, setStep0Ack] = useState({
        riskAccepted: false,
        latestFirmwareRead: false,
        backupWithOtherToolTaken: false,
        uartHintRead: false,
    });

    const steps = [
        { title: t("tonieboxes.esp32BoxFlashing.esp32flasher.titlePreparations") },
        { title: t("tonieboxes.esp32BoxFlashing.esp32flasher.titleReadESP32ImportFlash") },
        { title: t("tonieboxes.esp32BoxFlashing.esp32flasher.titlePatchFlash") },
        { title: t("tonieboxes.esp32BoxFlashing.esp32flasher.titleFlashESP32") },
        { title: t("tonieboxes.esp32BoxFlashing.esp32flasher.titleESP32FirmwareFlashed") },
    ];

    useEffect(() => {
        const el = logListRef.current;
        if (!el) return;

        const raf1 = requestAnimationFrame(() => {
            const raf2 = requestAnimationFrame(() => {
                el.scrollTop = el.scrollHeight;
            });
            (el as any).__raf2 = raf2;
        });

        return () => {
            cancelAnimationFrame(raf1);
            const raf2 = (el as any).__raf2;
            if (raf2) cancelAnimationFrame(raf2);
        };
    }, [logEntries]);

    useEffect(() => {
        scrollToTop(scrollToTopAnchor.current);
    }, [currentStep]);

    const { hasAnyLog, getAllLogLines } = flasher;

    const saveLog = () => {
        const allLines = getAllLogLines();
        const content = allLines.join("\n");
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });

        const pad = (n: number) => String(n).padStart(2, "0");
        const d = new Date();
        const filename = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(
            d.getMinutes()
        )}-${pad(d.getSeconds())}_esp32_flashing.log`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const backupHint = (
        <Alert
            type="warning"
            showIcon
            title={t("tonieboxes.esp32BoxFlashing.esp32flasher.backupFlash")}
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
            <Progress
                key={String(state.progress === 0)}
                percent={state.progress || 0}
                format={(percent) => `${(percent ?? 0).toFixed(2)}%`}
            />
        </div>
    ) : null;

    const contentLog = hasAnyLog ? (
        <>
            <Divider>{t("tonieboxes.esp32BoxFlashing.esp32flasher.extendedFlashingLog")}</Divider>
            <Paragraph style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Paragraph style={{ fontStyle: "italic" }}>
                    {t("tonieboxes.esp32BoxFlashing.esp32flasher.hintSaveLog")}
                </Paragraph>
                <Button
                    size="small"
                    type="default"
                    icon={<DownloadOutlined />}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        saveLog();
                    }}
                    disabled={!hasAnyLog}
                >
                    {t("tonieboxes.esp32BoxFlashing.esp32flasher.save")}
                </Button>
            </Paragraph>

            <div
                className="flashing-log-container"
                style={{
                    minHeight: "max(40vh, 335px)",
                    maxHeight: "max(40vh, 335px)",
                    overflow: "auto",
                    padding: 0,
                    backgroundColor: token.colorBgContainerDisabled,
                    scrollbarColor: `${token.colorTextDescription} ${token.colorBgContainer}`,
                }}
            >
                <LogViewer
                    lines={logEntries}
                    token={token}
                    logListRef={logListRef}
                    style={{ minHeight: "max(40vh, 333px)", maxHeight: "max(40vh, 333px)" }}
                />
            </div>
        </>
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
        setState((prev) => ({ ...prev, resetBox: false }));
        readFlash();
    };

    const loadFileClick = () => {
        setState((prev) => ({ ...prev, resetBox: false }));
        fileInputRef.current?.click();
    };

    const doResetBox = () => {
        setState((prev) => ({ ...prev, resetBox: true }));
        fileInputRef.current?.click();
    };

    const patchImage = () => patchFlash();
    const flashESP32 = () => writeFlash();
    const extractCertsFromFlash = () => extractAndStoreCertsFromFlash();

    const handleConfirmFlash = () => {
        setIsConfirmFlashModalOpen(false);
        flashESP32();
    };

    const handleCancelFlash = () => setIsConfirmFlashModalOpen(false);

    const previousButton = (
        <Button icon={<LeftOutlined />} disabled={disableButtons} onClick={prev}>
            {t("tonieboxes.esp32BoxFlashing.esp32flasher.previous")}
        </Button>
    );

    const checkBoxes = () => setIsOpenAvailableBoxesModal(true);

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
                    <Step0Preparations
                        acknowledgements={step0Ack}
                        onAcknowledgeChange={(patch) => setStep0Ack((prev) => ({ ...prev, ...patch }))}
                    />
                );
            case 1:
                return (
                    <Step1ReadImport
                        state={state}
                        fileInputRef={fileInputRef}
                        onFileChange={loadFlashFile}
                        contentProgress={contentProgress}
                    />
                );
            case 2:
                return (
                    <Step2PatchFlash
                        state={state}
                        setState={setState}
                        backupHint={backupHint}
                        contentProgress={contentProgress}
                    />
                );
            case 3:
                return (
                    <Step3FlashESP32
                        state={state}
                        useRevvoxFlasher={useRevvoxFlasher}
                        contentProgress={contentProgress}
                    />
                );
            case 4:
                return (
                    <Step4AfterFlash
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
                        title={t("tonieboxes.esp32BoxFlashing.attention")}
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
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                }}
            >
                <h1 ref={scrollToTopAnchor}>{t("tonieboxes.esp32BoxFlashing.title")}</h1>
                {httpsActive && (
                    <Paragraph
                        style={{
                            fontSize: "small",
                            display: "flex",
                            gap: 8,
                            width: 210,
                            alignItems: "center",
                            justifyContent: "flex-end",
                        }}
                    >
                        <div style={{ textAlign: "end", textWrap: "nowrap" }}>
                            {t("tonieboxes.esp32BoxFlashing.baudRate")}
                        </div>
                        <Select defaultValue={baudRate} onChange={handleBaudrateChange}>
                            {baudRates.map((rate) => (
                                <Option key={rate} value={rate}>
                                    {rate}
                                </Option>
                            ))}
                        </Select>
                        <Tooltip title={t("tonieboxes.esp32BoxFlashing.baudRateInfo")} placement="top">
                            <QuestionCircleOutlined style={{ fontSize: "18px", cursor: "pointer" }} />
                        </Tooltip>
                    </Paragraph>
                )}
            </div>

            {!httpsActive ? (
                <>
                    <Alert
                        title={t("tonieboxes.esp32BoxFlashing.attention")}
                        description={
                            <>
                                <Paragraph>{t("tonieboxes.esp32BoxFlashing.hint")}</Paragraph>
                                <Paragraph>
                                    <Button icon={<SyncOutlined />} onClick={openHttpsUrl}>
                                        {t("tonieboxes.esp32BoxFlashing.redirect")}
                                    </Button>
                                </Paragraph>
                            </>
                        }
                        type="warning"
                        showIcon
                    />
                    <Paragraph style={{ marginTop: 16 }}>
                        <Paragraph>{t("tonieboxes.esp32BoxFlashing.legacy.followLegacyApproach")}</Paragraph>
                        <Paragraph>
                            <Button onClick={() => navigate("/tonieboxes/boxsetup/esp32/legacy")}>
                                {t("tonieboxes.esp32BoxFlashing.legacy.navigationTitle")}
                            </Button>
                        </Paragraph>
                    </Paragraph>
                </>
            ) : (
                <>
                    <Divider>
                        {t("tonieboxes.esp32BoxFlashing.title")} {useRevvoxFlasher && "(Revvox Flasher)"}
                    </Divider>

                    <Steps
                        current={currentStep}
                        items={steps.map((step, index) => ({
                            key: index,
                            title: step.title,
                            status:
                                index === currentStep && index === steps.length - 1
                                    ? "finish"
                                    : index === currentStep
                                    ? state.error
                                        ? "error"
                                        : "process"
                                    : index < currentStep
                                    ? "finish"
                                    : "wait",
                            className:
                                index === currentStep && state.actionInProgress ? "ant-steps-item-in-progress" : "",
                        }))}
                    />

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
                                <Button
                                    icon={<RightOutlined />}
                                    iconPlacement="end"
                                    disabled={
                                        disableButtons ||
                                        !step0Ack.riskAccepted ||
                                        !step0Ack.latestFirmwareRead ||
                                        !step0Ack.backupWithOtherToolTaken ||
                                        !step0Ack.uartHintRead
                                    }
                                    onClick={next}
                                >
                                    {t("tonieboxes.esp32BoxFlashing.esp32flasher.next")}
                                </Button>
                            </div>
                        )}
                        {currentStep === 1 && (
                            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                                {previousButton}
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
                                    <Tooltip
                                        open={!canHover ? false : undefined}
                                        title={t("tonieboxes.esp32BoxFlashing.esp32flasher.resetBoxineTooltip")}
                                    >
                                        <Button
                                            icon={<RollbackOutlined />}
                                            disabled={disableButtons}
                                            onClick={doResetBox}
                                        >
                                            {t("tonieboxes.esp32BoxFlashing.esp32flasher.resetBoxine")}
                                        </Button>
                                    </Tooltip>
                                    <Button
                                        icon={<FileAddOutlined />}
                                        disabled={disableButtons}
                                        onClick={loadFileClick}
                                    >
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
                                    iconPlacement="end"
                                    disabled={(!state.proceed && !state.filename) || disableButtons}
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
                                    iconPlacement="end"
                                    disabled={disableButtons || !state.showFlash}
                                    onClick={next}
                                >
                                    {t("tonieboxes.esp32BoxFlashing.esp32flasher.next")}
                                </Button>
                            </div>
                        )}

                        {currentStep === 3 && (
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

                        {currentStep === 4 && (
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
                        {contentLog}
                    </div>

                    {availableBoxesModal}

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

                    <ConfirmationDialog
                        title={t(
                            "tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificates409ResponseForceOverwrite"
                        )}
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
            )}
        </>
    );
};
