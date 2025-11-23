import { JSX } from "react";
import { Alert, Image, Typography } from "antd";
import { useTranslation } from "react-i18next";

import tbEsp32UartClamp from "../../../../../assets/boxSetup/tb-esp32-uart-clamp.png";
import tbEsp32UartAnalogClamp from "../../../../../assets/boxSetup/esp32_pcb_clamp.png";
import tbEsp32Uart from "../../../../../assets/boxSetup/tb-esp32-uart.png";
import CodeSnippet from "../../../../common/elements/CodeSnippet";
import { uart3v3Hint } from "../../common/elements/Uart3v3Hint";

const { Paragraph } = Typography;

export function connectESP32Explanation(): JSX.Element {
    const { t } = useTranslation();

    return (
        <>
            <Paragraph>{uart3v3Hint()}</Paragraph>
            <Paragraph>{t("tonieboxes.connectESP32Modal.connectESP32Text1")}</Paragraph>
            <Paragraph
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                }}
            >
                <Image
                    src={tbEsp32Uart}
                    style={{ height: 200, width: "auto" }}
                    preview={false}
                    alt={t("tonieboxes.connectESP32Modal.esp32UartJ103")}
                />
            </Paragraph>
            <h5>{t("tonieboxes.connectESP32Modal.esp32UartJ103ClampTitle")}</h5>
            <Paragraph
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: 16,
                }}
            >
                <Image.PreviewGroup>
                    <div style={{ maxWidth: 200 }}>
                        <Image
                            style={{ height: 200, width: "auto" }}
                            src={tbEsp32UartClamp}
                            alt={t("tonieboxes.connectESP32Modal.esp32UartJ103Clamp")}
                        />
                        <Paragraph style={{ marginTop: 8 }}>
                            {t("tonieboxes.connectESP32Modal.esp32UartJ103Clamp")}
                        </Paragraph>
                    </div>
                    <div style={{ maxWidth: 200 }}>
                        <Image
                            style={{ height: 200, width: "auto" }}
                            src={tbEsp32UartAnalogClamp}
                            alt={t("tonieboxes.connectESP32Modal.esp32UartJ103AnalogClamp")}
                        />
                        <Paragraph style={{ marginTop: 8 }}>
                            {t("tonieboxes.connectESP32Modal.esp32UartJ103AnalogClamp")}
                        </Paragraph>
                    </div>
                </Image.PreviewGroup>
            </Paragraph>
            <Paragraph>{t("tonieboxes.connectESP32Modal.esp32UartJ103Clamp4PinHint")}</Paragraph>

            <Paragraph>{t("tonieboxes.connectESP32Modal.connectESP32Text2")}</Paragraph>
            <Alert
                type="warning"
                message={t("tonieboxes.connectESP32Modal.beware")}
                description={t("tonieboxes.connectESP32Modal.warningText")}
            />

            <h5>{t("tonieboxes.connectESP32Modal.normalMode")}</h5>
            <Paragraph>{t("tonieboxes.connectESP32Modal.normalModeText")}</Paragraph>

            <CodeSnippet
                language="shell"
                code={`ESP-ROM:esp32s3-20210327
Build:Mar 27 2021
rst:0x1 (POWERON),boot:0x8 (SPI_FAST_FLASH_BOOT)
SPIWP:0xee
mode:DIO, clock div:1
load:0x3fcd0108,len:0x118
load:0x403b6000,len:0xb90
load:0x403ba000,len:0x27f4
entry 0x403b61c4
+ gibberish`}
            />

            <h5>{t("tonieboxes.connectESP32Modal.downloadMode")}</h5>
            <Paragraph>{t("tonieboxes.connectESP32Modal.downloadModeText")}</Paragraph>

            <CodeSnippet
                language="shell"
                code={`ESP-ROM:esp32s3-20210327
Build:Mar 27 2021
rst:0x1 (POWERON),boot:0x0 (DOWNLOAD(USB/UART0))
waiting for download
J103 Pinout`}
            />
        </>
    );
}
