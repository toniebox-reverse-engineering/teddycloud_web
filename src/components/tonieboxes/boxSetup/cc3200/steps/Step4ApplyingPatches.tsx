import { Collapse, Table, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import CodeSnippet from "../../../../common/CodeSnippet";

const { Paragraph } = Typography;

export const Step4ApplyingPatches: React.FC = () => {
    const { t } = useTranslation();

    const generalSectionData = [
        {
            key: "1",
            keyName: "activeImg",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.activeImgDesc"
            ),
            values: "ofw1, ofw2, ofw3, cfw1, cfw2, cfw3, add1, add2, add3",
            defaultValue: "ofw1",
        },
        {
            key: "2",
            keyName: "waitForPress",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.waitForPressDesc"
            ),
            values: "true, false",
            defaultValue: "false",
        },
        {
            key: "3",
            keyName: "waitForBoot",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.waitForBootDesc"
            ),
            values: "true, false",
            defaultValue: "false",
        },
        {
            key: "4",
            keyName: "waitTimeoutInS",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.waitTimeoutInSDesc"
            ),
            values: "1-255",
            defaultValue: "60",
        },
        {
            key: "5",
            keyName: "minBatteryLevel",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.minBatteryLevelDesc"
            ),
            values: "",
            defaultValue: "8869",
        },
        {
            key: "6",
            keyName: "ofwFixValue",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.ofwFixValueDesc"
            ),
            values: "hex array with 4 bytes",
            defaultValue: '["4C", "01", "10", "00"]',
        },
        {
            key: "7",
            keyName: "ofwFixFlash",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.ofwFixFlashDesc"
            ),
            values: "ex. /sys/pre-img.bin",
            defaultValue: "",
        },
        {
            key: "8",
            keyName: "serialLog",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.serialLogDesc"
            ),
            values: "true, false",
            defaultValue: "true",
        },
        {
            key: "9",
            keyName: "logLevel",
            description: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.logLevelDesc"),
            values: "0-5",
            defaultValue: "DEBUG_LOG_LEVEL",
        },
        {
            key: "10",
            keyName: "logColor",
            description: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.logColorDesc"),
            values: "true, false",
            defaultValue: "false",
        },
    ];

    const generalSectionColumns = [
        {
            title: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.key"),
            dataIndex: "keyName",
            key: "keyName",
            width: 120,
        },
        {
            title: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.description"),
            dataIndex: "description",
            key: "description",
        },
        {
            title: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.values"),
            dataIndex: "values",
            key: "values",
        },
        {
            title: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.default"),
            dataIndex: "defaultValue",
            key: "defaultValue",
        },
    ];

    const firmwareSectionData = [
        {
            key: "1",
            keyName: "checkHash",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.checkHashDesc"
            ),
            values: "true, false",
            defaultValue: "true",
        },
        {
            key: "2",
            keyName: "hashFile",
            description: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.hashFileDesc"),
            values: "true, false",
            defaultValue: "false",
        },
        {
            key: "3",
            keyName: "watchdog",
            description: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.watchdogDesc"),
            values: "true, false",
            defaultValue: "false",
        },
        {
            key: "4",
            keyName: "ofwFix",
            description: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.ofwFixDesc"),
            values: "true, false",
            defaultValue: "false",
        },
        {
            key: "5",
            keyName: "ofwSimBL",
            description: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.ofwSimBLDesc"),
            values: "true, false",
            defaultValue: "false",
        },
        {
            key: "6",
            keyName: "bootFlashImg",
            description: t(
                "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.bootFlashImgDesc"
            ),
            values: "true, false",
            defaultValue: "false",
        },
        {
            key: "7",
            keyName: "flashImg",
            description: t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.flashImgDesc"),
            values: "ex. /sys/pre-img.bin",
            defaultValue: "",
        },
        {
            key: "8",
            keyName: "patches",
            description: (
                <>
                    {t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.patchesDesc")}{" "}
                    <Link
                        to="https://github.com/toniebox-reverse-engineering/hackiebox_cfw_ng/tree/master/sd-bootloader-ng/bootmanager/sd/revvox/boot/patch"
                        target="_blank"
                    >
                        {t(
                            "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.patchDirectory"
                        )}
                    </Link>
                    {", "}
                    <Link
                        to="https://tonies-wiki.revvox.de/docs/custom-firmware/cc3200/hackieboxng-bl/ofw-patches/"
                        target="_blank"
                    >
                        {t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.patchWiki")}
                    </Link>
                </>
            ),
            values: '["noCerts.305", "noPass3.305"]',
            defaultValue: "[]",
        },
    ];

    const exampleNgCfgJson = {
        general: {
            activeImg: "ofw2",
            _descWaitForPress: "Waits for an earpress on startup",
            waitForPress: false,
            _descWaitForBoot: "Waits for an earpress before firmware boot",
            waitForBoot: false,
            waitTimeoutInS: 60,
            _descMinBatteryLevel: "Divide through 2785 to get voltage",
            minBatteryLevel: 8869,
            ofwFixFlash: "/sys/pre-img.bin",
            _descSerialLog: "Logging only works with the debug build!",
            serialLog: false,
            _descLogLevel: "0:Trace - 5:Fatal",
            logLevel: 0,
            _descLogColor: "Use colors in log output",
            logColor: false,
        },
        ofw1: {
            checkHash: false,
            hashFile: false,
            watchdog: true,
            bootFlashImg: true,
            flashImg: "/sys/pre-img.bin",
        },
        ofw2: {
            checkHash: true,
            hashFile: false,
            watchdog: true,
            ofwFix: true,
            ofwSimBL: true,
            patches: ["altCa.305", "altUrl.custom.305"],
        },
        ofw3: {
            checkHash: true,
            hashFile: false,
            watchdog: true,
            ofwFix: true,
            patches: ["altCa.305", "altUrl.tc.fritz.box"],
        },
        cfw1: {
            checkHash: false,
            hashFile: false,
            watchdog: true,
        },
        cfw2: {
            checkHash: false,
            hashFile: false,
            watchdog: true,
        },
        cfw3: {
            checkHash: false,
            hashFile: false,
            watchdog: true,
        },
        add1: {
            checkHash: true,
            hashFile: false,
            watchdog: true,
            ofwFix: true,
            ofwSimBL: false,
            patches: ["blockCheck.310", "noCerts.305", "noPass3.310", "noPrivacy.305", "uidCheck.307"],
        },
        add2: {
            checkHash: true,
            hashFile: false,
            watchdog: true,
            ofwFix: true,
            ofwSimBL: false,
            patches: ["altCa.305", "altUrl.305"],
        },
        add3: {
            checkHash: true,
            hashFile: false,
            watchdog: true,
            ofwFix: true,
            ofwSimBL: false,
            patches: ["altCa.305", "altUrl.305"],
        },
    };

    return (
        <>
            <h3>{t("tonieboxes.cc3200BoxFlashing.applyingPatches")}</h3>

            <h4>{t("tonieboxes.cc3200BoxFlashing.applyingPatchesWithNgCfgJson")}</h4>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.introduction")}</Paragraph>

            <Collapse
                size="small"
                items={[
                    {
                        key: "1",
                        label: t(
                            "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.collapseTitle"
                        ),
                        children: (
                            <Paragraph>
                                <h5>
                                    {t(
                                        "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.title"
                                    )}
                                </h5>
                                <Paragraph>
                                    {t(
                                        "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.section1_part1"
                                    )}{" "}
                                    <Link
                                        to="https://github.com/toniebox-reverse-engineering/hackiebox_cfw_ng/blob/master/sd-bootloader-ng/bootmanager/sd/revvox/boot/ngCfg.json"
                                        target="_blank"
                                    >
                                        {t(
                                            "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.section1_link"
                                        )}
                                    </Link>
                                    {t(
                                        "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.section1_part2"
                                    )}
                                </Paragraph>
                                <Paragraph>
                                    {t(
                                        "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.section1_part3"
                                    )}
                                </Paragraph>
                                <h5>
                                    {t(
                                        "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.generalSection"
                                    )}
                                </h5>
                                <Table
                                    dataSource={generalSectionData}
                                    columns={generalSectionColumns}
                                    pagination={false}
                                    size="small"
                                />
                                <h5>
                                    {t(
                                        "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.firmwareSection"
                                    )}
                                </h5>
                                {t(
                                    "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.technicalDetailsCollapse.firmwareSectionIntro"
                                )}
                                <Table
                                    dataSource={firmwareSectionData}
                                    columns={generalSectionColumns}
                                    pagination={false}
                                    size="small"
                                />
                            </Paragraph>
                        ),
                    },
                ]}
                style={{ marginBottom: 16 }}
            />

            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.section2_part1")}</Paragraph>
            <CodeSnippet
                language="json"
                code={`{
    "general": {
        "activeImg": "ofw2",
        ...`}
            />
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.section2_part2")}</Paragraph>
            <CodeSnippet
                language="json"
                code={`...
    "ofw2": {
        "checkHash": true,
        "hashFile": false,
        "watchdog": true,
        "ofwFix": true,
        "ofwSimBL": true,
        "patches": ["altCa.305", "altUrl.custom.305"]
    },
...`}
            />

            <Collapse
                size="small"
                items={[
                    {
                        key: "1",
                        label: t(
                            "tonieboxes.cc3200BoxFlashing.applyingPatchesSection.examplengCFGJsonCollapse.collapseTitle"
                        ),
                        children: (
                            <Paragraph>
                                <CodeSnippet language="shell" code={JSON.stringify(exampleNgCfgJson, null, 2)} />
                            </Paragraph>
                        ),
                    },
                ]}
                style={{ marginBottom: 16 }}
            />

            <Paragraph style={{ marginTop: 16 }}>
                {t("tonieboxes.cc3200BoxFlashing.applyingPatchesSection.finish")}
            </Paragraph>
        </>
    );
};
