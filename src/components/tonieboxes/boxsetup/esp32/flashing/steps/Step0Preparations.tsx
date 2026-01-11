import React from "react";
import { Alert, Checkbox, Typography } from "antd";

import { useTranslation } from "react-i18next";
import { ExportOutlined, WarningFilled } from "@ant-design/icons";
import { useReachableBackUpUrls } from "../hooks/useReachableBackupUrls";
import { Uart3v3Hint } from "../../../common/elements/Uart3v3Hint";

const { Paragraph } = Typography;
interface Step0Props {
    acknowledgements: {
        riskAccepted: boolean;
        latestFirmwareRead: boolean;
        backupWithOtherToolTaken: boolean;
        uartHintRead: boolean;
    };
    onAcknowledgeChange: (patch: Partial<Step0Props["acknowledgements"]>) => void;
}

export const Step0Preparations: React.FC<Step0Props> = ({ acknowledgements, onAcknowledgeChange }) => {
    const { t } = useTranslation();

    const reachableBackUpUrls = useReachableBackUpUrls();

    return (
        <>
            <h3>{t("tonieboxes.esp32BoxFlashing.esp32flasher.titlePreparations")}</h3>
            <Paragraph>
                <Alert
                    type="error"
                    showIcon
                    icon={<WarningFilled />}
                    title={t("tonieboxes.warningUseAtYourOwnRisk")}
                    description=<>
                        <Paragraph>{t("tonieboxes.warningUseAtYourOwnRiskText")}</Paragraph>
                        <Checkbox
                            checked={acknowledgements.riskAccepted}
                            onChange={(e) => onAcknowledgeChange({ riskAccepted: e.target.checked })}
                        >
                            <b>{t("tonieboxes.esp32BoxFlashing.esp32flasher.ackRisk")}</b>
                        </Checkbox>
                    </>
                    style={{ marginBottom: 16 }}
                />
                <Alert
                    type="warning"
                    showIcon
                    title={t("tonieboxes.hintLatestFirmwareTitle")}
                    description={
                        <>
                            <Paragraph>{t("tonieboxes.hintLatestFirmware")}</Paragraph>
                            <Paragraph>{t("tonieboxes.hintLatestFirmwareFactoryResetESP32CC3235")}</Paragraph>
                            <Checkbox
                                checked={acknowledgements.latestFirmwareRead}
                                onChange={(e) => onAcknowledgeChange({ latestFirmwareRead: e.target.checked })}
                            >
                                <b>{t("tonieboxes.esp32BoxFlashing.esp32flasher.ackLatestFirmware")}</b>
                            </Checkbox>
                        </>
                    }
                    style={{ marginBottom: 16 }}
                />

                <Uart3v3Hint
                    checked={acknowledgements.uartHintRead}
                    onCheckedChange={(checked) => onAcknowledgeChange({ uartHintRead: checked })}
                    checkboxLabel={<b>{t("tonieboxes.esp32BoxFlashing.esp32flasher.ackUARTHint")}</b>}
                />

                <Alert
                    type="info"
                    showIcon
                    title={t("tonieboxes.esp32BoxFlashing.esp32flasher.hintUseOtherToolForAdditionalBackup")}
                    description={
                        <>
                            {reachableBackUpUrls.length > 0 ? (
                                <Paragraph style={{ marginTop: 16 }}>
                                    <Paragraph>
                                        {t("tonieboxes.esp32BoxFlashing.esp32flasher.alternativeTools")}
                                    </Paragraph>
                                    <ul>
                                        {reachableBackUpUrls.map(({ id, url, title }) => (
                                            <li key={id}>
                                                <a href={url} target="_blank">
                                                    {title} {<ExportOutlined />}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </Paragraph>
                            ) : (
                                <Paragraph>
                                    {t("tonieboxes.esp32BoxFlashing.esp32flasher.alternativeToolsNoLinks")}
                                </Paragraph>
                            )}

                            <Checkbox
                                checked={acknowledgements.backupWithOtherToolTaken}
                                onChange={(e) => onAcknowledgeChange({ backupWithOtherToolTaken: e.target.checked })}
                            >
                                <b>{t("tonieboxes.esp32BoxFlashing.esp32flasher.ackBackUpWithOtherTool")}</b>
                            </Checkbox>
                        </>
                    }
                    style={{ marginBottom: 16 }}
                />
            </Paragraph>
        </>
    );
};
