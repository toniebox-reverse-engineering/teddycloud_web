import React from "react";
import { Alert, Collapse, theme, Typography } from "antd";

import { ESP32Flasher } from "../hooks/useESP32Flasher";
import DotAnimation from "../../../../../common/elements/DotAnimation";
import { connectESP32Explanation } from "../../elements/ConnectESP32Explanation";
import { useTranslation } from "react-i18next";

const { Paragraph } = Typography;
const { useToken } = theme;
interface Step0Props {
    state: ESP32Flasher;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    contentProgress: React.ReactNode;
}

const renderStateWithAnimation = (text: string) => {
    if (text.endsWith("...")) {
        const baseText = text.slice(0, -3);
        return (
            <div style={{ display: "flex" }}>
                {baseText}
                <DotAnimation />
            </div>
        );
    }
    return text;
};

export const Step0ReadImport: React.FC<Step0Props> = ({ state, fileInputRef, onFileChange, contentProgress }) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const conESP32Explanation = connectESP32Explanation();

    const stepStatusText = state.showStatus && (
        <div className="status" style={{ marginBottom: 16, color: state.error ? token.colorErrorText : "unset" }}>
            <i>{renderStateWithAnimation(state.state)}</i>
        </div>
    );

    return (
        <>
            <h3>{t("tonieboxes.esp32BoxFlashing.esp32flasher.titleReadESP32ImportFlash")}</h3>
            {!state.actionInProgress && (
                <>
                    <Paragraph>
                        <Alert
                            type="warning"
                            closeIcon
                            showIcon
                            message={t("tonieboxes.hintLatestFirmwareTitle")}
                            description={
                                <>
                                    <Paragraph>{t("tonieboxes.hintLatestFirmware")}</Paragraph>
                                    <Paragraph>{t("tonieboxes.hintLatestFirmwareFactoryResetESP32CC3235")}</Paragraph>
                                </>
                            }
                        />
                    </Paragraph>
                    <Paragraph>
                        <Alert
                            type="info"
                            closeIcon
                            showIcon
                            message={t("tonieboxes.esp32BoxFlashing.adaptBaudrateOnProblems")}
                            description={t("tonieboxes.esp32BoxFlashing.adaptBaudrateOnProblemsText")}
                        />
                    </Paragraph>
                    <Paragraph style={{ marginTop: 16 }}>
                        <Alert
                            type="info"
                            description={t("tonieboxes.esp32BoxFlashing.esp32flasher.hintReadESP32ImportFlash")}
                        />
                    </Paragraph>

                    <Collapse
                        size="small"
                        style={{ marginBottom: 16 }}
                        items={[
                            {
                                key: "1",
                                label: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectESPCollapseTitle"),
                                children: conESP32Explanation,
                            },
                        ]}
                    />
                </>
            )}
            {stepStatusText}
            <input type="file" style={{ display: "none" }} ref={fileInputRef} onChange={onFileChange} />
            {contentProgress}
        </>
    );
};
