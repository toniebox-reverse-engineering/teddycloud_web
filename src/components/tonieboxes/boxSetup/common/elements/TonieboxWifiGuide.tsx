import { Typography, Collapse } from "antd";
import { useTranslation } from "react-i18next";
import { parseFormattedText } from "../../../../../utils/helpers";

const { Paragraph, Text } = Typography;

export const TonieboxWifiGuide: React.FC = () => {
    const { t } = useTranslation();

    const steps = [
        t("tonieboxes.boxFlashingCommon.connectTBToWifi.step1"),
        t("tonieboxes.boxFlashingCommon.connectTBToWifi.step2"),
        t("tonieboxes.boxFlashingCommon.connectTBToWifi.step3"),
        t("tonieboxes.boxFlashingCommon.connectTBToWifi.step4"),
        t("tonieboxes.boxFlashingCommon.connectTBToWifi.step5"),
        t("tonieboxes.boxFlashingCommon.connectTBToWifi.step6"),
        t("tonieboxes.boxFlashingCommon.connectTBToWifi.step7"),
        t("tonieboxes.boxFlashingCommon.connectTBToWifi.step8"),
    ];

    return (
        <>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.connectTBToWifi.preparationText")}</Paragraph>
            <Collapse
                size="small"
                items={[
                    {
                        key: "1",
                        label: t("tonieboxes.boxFlashingCommon.connectTBToWifi.title"),
                        children: (
                            <>
                                {steps.map((step, idx) => (
                                    <Paragraph key={idx} style={{ marginBottom: 12 }}>
                                        <Text strong>{idx + 1}. </Text>
                                        {parseFormattedText(step)}
                                    </Paragraph>
                                ))}
                            </>
                        ),
                    },
                ]}
            />
        </>
    );
};
