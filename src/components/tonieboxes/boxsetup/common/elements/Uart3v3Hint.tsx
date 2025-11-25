import { JSX } from "react";
import { Alert, Image, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";

import jumper1 from "../../../../../assets/boxSetup/jumper/uart_3v3-5V_jumper_black.jpg";
import jumper2 from "../../../../../assets/boxSetup/jumper/uart_3v3-5V_jumper_switch.jpg";
import jumper3 from "../../../../../assets/boxSetup/jumper/uart_3v3-5V_jumper_yellow.jpg";

const { Paragraph, Text } = Typography;

export function uart3v3Hint(): JSX.Element {
    const { t } = useTranslation();

    return (
        <Alert
            type="warning"
            showIcon
            title={t("tonieboxes.boxSetup.UARTHint.title")}
            description={
                <>
                    <Paragraph>{t("tonieboxes.boxSetup.UARTHint.noUSBCVersion")}</Paragraph>
                    <Paragraph>{t("tonieboxes.boxSetup.UARTHint.description")}</Paragraph>
                    <ol style={{ paddingLeft: 20 }}>
                        <li>
                            <Space direction="vertical" size="small" style={{ display: "flex", marginTop: 8 }}>
                                <Text strong>{t("tonieboxes.boxSetup.UARTHint.voltageCompatibility")}</Text>
                                <Paragraph>
                                    <Paragraph>{t("tonieboxes.boxSetup.UARTHint.voltageCompatibilityText1")}</Paragraph>
                                    <Paragraph>{t("tonieboxes.boxSetup.UARTHint.voltageCompatibilityText2")}</Paragraph>
                                </Paragraph>
                                <Space size="small">
                                    <Image
                                        src={jumper1}
                                        preview={false}
                                        alt={t("tonieboxes.boxSetup.UARTHint.imageAlt1")}
                                        style={{ maxHeight: 75 }}
                                    />
                                    <Image
                                        src={jumper2}
                                        preview={false}
                                        alt={t("tonieboxes.boxSetup.UARTHint.imageAlt2")}
                                        style={{ maxHeight: 75 }}
                                    />
                                    <Image
                                        src={jumper3}
                                        preview={false}
                                        alt={t("tonieboxes.boxSetup.UARTHint.imageAlt3")}
                                        style={{ maxHeight: 75 }}
                                    />
                                </Space>
                                <Paragraph>
                                    <Text strong type="danger">
                                        {t("tonieboxes.boxSetup.UARTHint.warning")}
                                    </Text>
                                </Paragraph>
                            </Space>
                        </li>
                        <li>
                            <Space direction="vertical" size="small" style={{ display: "flex", marginTop: 8 }}>
                                <Text strong>{t("tonieboxes.boxSetup.UARTHint.uartDriver")}</Text>
                                <Paragraph>{t("tonieboxes.boxSetup.UARTHint.updateDriver")}</Paragraph>
                            </Space>
                        </li>
                    </ol>
                </>
            }
        />
    );
}
