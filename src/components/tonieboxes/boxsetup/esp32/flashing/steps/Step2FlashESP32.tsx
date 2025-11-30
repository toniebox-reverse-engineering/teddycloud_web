import React from "react";
import { Alert, theme, Typography } from "antd";
import { ESP32Flasher } from "../hooks/useESP32Flasher";
import { useTranslation } from "react-i18next";

const { Paragraph } = Typography;
const { useToken } = theme;

interface Step2Props {
    state: ESP32Flasher;
    useRevvoxFlasher: boolean;
    contentProgress: React.ReactNode;
}

export const Step2FlashESP32: React.FC<Step2Props> = ({ state, useRevvoxFlasher, contentProgress }) => {
    const { t } = useTranslation();
    const { token } = useToken();

    const stepStatusText = state.showStatus && (
        <div className="status" style={{ marginBottom: 16, color: state.error ? token.colorErrorText : "unset" }}>
            <i>{state.state}</i>
        </div>
    );

    return (
        <>
            <h3>{t("tonieboxes.esp32BoxFlashing.esp32flasher.titleFlashESP32")}</h3>
            {!state.actionInProgress && (
                <Paragraph>
                    <Alert
                        type="info"
                        description={
                            useRevvoxFlasher
                                ? t("tonieboxes.esp32BoxFlashing.esp32flasher.hintFlashESP32RevvoxFlasher")
                                : t("tonieboxes.esp32BoxFlashing.esp32flasher.hintFlashESP32")
                        }
                    />
                </Paragraph>
            )}
            {stepStatusText}
            {!state.actionInProgress && state.downloadLinkPatched ? (
                <div style={{ marginBottom: 16 }}>
                    <a
                        href={state.downloadLinkPatched}
                        download={"patched_" + state.filename}
                        title={"patched_" + state.filename}
                    >
                        {t("tonieboxes.esp32BoxFlashing.esp32flasher.downloadLinkPatched")}
                    </a>
                </div>
            ) : (
                ""
            )}
            {contentProgress}
        </>
    );
};
