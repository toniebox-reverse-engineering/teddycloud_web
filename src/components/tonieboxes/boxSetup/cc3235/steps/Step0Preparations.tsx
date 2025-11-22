import { Alert, Collapse, Image, Tabs, TabsProps, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import cc3235Flash from "../../../../../assets/boxSetup/cc3235_flash.jpg";
import cc3235SMDGrippers from "../../../../../assets/boxSetup/cc3235_smd_grippers.jpg";
import cc3235CH341AProgrammer1 from "../../../../../assets/boxSetup/01_CH341A_programmer_1.png";
import cc3235CH341AProgrammer2 from "../../../../../assets/boxSetup/01_CH341A_programmer_2.png";
import cc3235CH341Sop81 from "../../../../../assets/boxSetup/02_CH341A_sop8_1.jpg";
import cc3235CH341Sop82 from "../../../../../assets/boxSetup/02_CH341A_sop8_2.jpg";
import cc3235CH341Sop83 from "../../../../../assets/boxSetup/02_CH341A_sop8_3.jpg";
import cc3235CH341Sop8remove from "../../../../../assets/boxSetup/02_CH341A_sop8_remove.jpg";

import CodeSnippet from "../../../../common/CodeSnippet";
import { installCC3200Tool } from "../../cc3200/elements/InstallCC3200Tool";
import { TonieboxWifiGuide } from "../../common/elements/TonieboxWifiGuide";

const { Paragraph } = Typography;

type HwTool = "pico" | "ch341a";

interface Step0PreparationsProps {
    hwTool: HwTool;
    onHwToolChange: (tool: HwTool) => void;
}

export const CC3235Step0Preparations: React.FC<Step0PreparationsProps> = ({ hwTool, onHwToolChange }) => {
    const { t } = useTranslation();

    const picoPrepTab = (
        <>
            <h4>{t("tonieboxes.cc3235BoxFlashing.installSerprogFirmware")}</h4>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.pico.preparation")}</Paragraph>
            <Paragraph>
                <Link to="https://github.com/stacksmashing/pico-serprog" target="_blank">
                    {t("tonieboxes.cc3235BoxFlashing.serprogFirmwareLink")}
                </Link>
            </Paragraph>
        </>
    );

    const ch341aPrepTab = (
        <>
            <h4>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.CH341AProgrammer")}</h4>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.preparation")}</Paragraph>
            <ul>
                <li>
                    {t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.prep1")}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            gap: 16,
                            margin: 8,
                        }}
                    >
                        <Image
                            src={cc3235CH341AProgrammer1}
                            style={{ maxHeight: 200, width: "auto" }}
                            alt={t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.CH341AProgrammer")}
                        />
                    </div>
                </li>
                <li>
                    {t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.prep2")}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            gap: 16,
                            margin: 8,
                        }}
                    >
                        <Image
                            src={cc3235CH341Sop8remove}
                            style={{ maxHeight: 100, width: "auto" }}
                            alt={t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.CH341Sop8remove")}
                        />
                    </div>
                </li>
                <li>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.prep3")}</li>
                <li>
                    {t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.prep4")}
                    <CodeSnippet
                        language="shell"
                        code={`lsusb 

~$ lsusb
Bus 004 Device 012: ID 1a86:5512 QinHeng Electronics CH341 in EPP/MEM/I2C mode, EPP/I2C adapter
Bus 004 Device 001: ID 1d6b:0001 Linux Foundation 1.1 root hub
Bus 002 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 003 Device 001: ID 1d6b:0001 Linux Foundation 1.1 root hub
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub`}
                    />
                </li>
            </ul>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.prepConclusions1")}</Paragraph>
            <Paragraph>
                {t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.prepConclusions2")}
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: 16,
                        margin: 8,
                    }}
                >
                    <Image
                        src={cc3235CH341AProgrammer2}
                        style={{ maxHeight: 100, width: "auto" }}
                        alt={t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.CH341AProgrammerClampConnection")}
                    />
                </div>
            </Paragraph>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.prepConclusions3")}</Paragraph>
        </>
    );

    const hwHelperPrep: TabsProps["items"] = [
        { key: "picoHW", label: "Raspberry Pi Pico", children: picoPrepTab },
        { key: "ch341aHW", label: "CH341A Programmer", children: ch341aPrepTab },
    ];

    const activeKey = hwTool === "pico" ? "picoHW" : "ch341aHW";

    const handleTabChange = (newKey: string) => {
        if (newKey.startsWith("pico")) {
            onHwToolChange("pico");
        } else {
            onHwToolChange("ch341a");
        }
    };

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

            <h4>{t("tonieboxes.cc3235BoxFlashing.locateFlashMemory")}</h4>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.locateFlashMemoryText")}</Paragraph>

            <Collapse
                size="small"
                style={{ marginBottom: 16 }}
                items={[
                    {
                        key: "1",
                        label: t("tonieboxes.cc3235BoxFlashing.flashCollapse.collapseTitle"),
                        children: (
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
                                    <div style={{ maxWidth: 200, justifyItems: "center" }}>
                                        <Image
                                            src={cc3235Flash}
                                            style={{
                                                maxHeight: 200,
                                                width: "auto",
                                            }}
                                            alt={t("tonieboxes.cc3235BoxFlashing.flashCollapse.cc3235flash")}
                                        />
                                        <p style={{ marginTop: 8 }}>
                                            {t("tonieboxes.cc3235BoxFlashing.flashCollapse.cc3235flash")}
                                        </p>
                                    </div>
                                    <div style={{ maxWidth: 200, justifyItems: "center" }}>
                                        <Image
                                            src={cc3235SMDGrippers}
                                            style={{
                                                maxHeight: 200,
                                                width: "auto",
                                            }}
                                            alt={t(
                                                "tonieboxes.cc3235BoxFlashing.flashCollapse.cc3235flashWithSMDGrippers"
                                            )}
                                        />
                                        <p style={{ marginTop: 8 }}>
                                            {t("tonieboxes.cc3235BoxFlashing.flashCollapse.cc3235flashWithSMDGrippers")}
                                        </p>
                                    </div>
                                    <div style={{ maxWidth: 200, justifyItems: "center" }}>
                                        <Image
                                            src={cc3235CH341Sop81}
                                            style={{
                                                maxHeight: 200,
                                                width: "auto",
                                                maxWidth: 200,
                                            }}
                                            alt={t("tonieboxes.cc3235BoxFlashing.flashCollapse.sop8Clamp")}
                                        />
                                        <p style={{ marginTop: 8 }}>
                                            {t("tonieboxes.cc3235BoxFlashing.flashCollapse.sop8Clamp")}
                                        </p>
                                    </div>
                                    <div style={{ maxWidth: 200, justifyItems: "center" }}>
                                        <Image
                                            src={cc3235CH341Sop83}
                                            style={{
                                                maxHeight: 200,
                                                width: "auto",
                                                maxWidth: 200,
                                            }}
                                            alt={t("tonieboxes.cc3235BoxFlashing.flashCollapse.sop8Clamp")}
                                        />
                                        <p style={{ marginTop: 8 }}>
                                            {t("tonieboxes.cc3235BoxFlashing.flashCollapse.sop8Clamp")}
                                        </p>
                                    </div>
                                    <div style={{ maxWidth: 200, justifyItems: "center" }}>
                                        <Image
                                            src={cc3235CH341Sop82}
                                            style={{
                                                maxHeight: 200,
                                                width: "auto",
                                                maxWidth: 200,
                                            }}
                                            alt={t("tonieboxes.cc3235BoxFlashing.flashCollapse.sop8Clamp")}
                                        />
                                        <p style={{ marginTop: 8 }}>
                                            {t("tonieboxes.cc3235BoxFlashing.flashCollapse.sop8Clamp")}
                                        </p>
                                    </div>
                                </Image.PreviewGroup>
                            </Paragraph>
                        ),
                    },
                ]}
            />

            <h4>{t("tonieboxes.cc3235BoxFlashing.installflashromtool")}</h4>
            {t("tonieboxes.cc3235BoxFlashing.installflashromtoolText")}
            <CodeSnippet language="shell" code={`sudo apt-get install flashrom`} />
            <Link to="https://www.flashrom.org/" target="_blank">
                {t("tonieboxes.cc3235BoxFlashing.installflashromtoolLink")}
            </Link>

            {installCC3200Tool()}

            <h4>{t("tonieboxes.cc3235BoxFlashing.hwToolSpecific")}</h4>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.hwToolSpecificText")}</Paragraph>

            <Tabs
                onChange={handleTabChange}
                activeKey={activeKey}
                items={hwHelperPrep}
                indicator={{ size: (origin) => origin - 20, align: "center" }}
            />
        </>
    );
};
