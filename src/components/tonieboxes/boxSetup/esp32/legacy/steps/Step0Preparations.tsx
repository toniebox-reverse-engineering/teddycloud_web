import { Alert, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { connectESP32Explanation } from "../../elements/ConnectESP32Explanation";
import { TonieboxWifiGuide } from "../../../common/elements/TonieboxWifiGuide";

const { Paragraph } = Typography;

export const Step0Preparations: React.FC = () => {
    const { t } = useTranslation();
    const conESP32Explanation = connectESP32Explanation();

    return (
        <>
            <h3>{t("tonieboxes.boxFlashingCommon.preparations")}</h3>
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
                style={{ marginBottom: 16 }}
            />
            <Paragraph>
                <TonieboxWifiGuide />
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
};
