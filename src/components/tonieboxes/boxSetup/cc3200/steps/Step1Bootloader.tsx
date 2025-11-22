import { Typography, Tabs, Table, Image } from "antd";
import { TabsProps } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import cc3200cfwUpdate from "../../../../../assets/boxSetup/cc3200_installCfwFlashUpload.png";
import CodeSnippet from "../../../../common/CodeSnippet";

const { Paragraph } = Typography;

export const Step1Bootloader: React.FC = () => {
    const { t } = useTranslation();

    const importantTBFilesData = [
        {
            key: "/cert/ca.der",
            file: "/cert/ca.der",
            description: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.caDer"),
        },
        {
            key: "/cert/private.der",
            file: "/cert/private.der",
            description: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.privateDer"),
        },
        {
            key: "/cert/client.der",
            file: "/cert/client.der",
            description: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.clientDer"),
        },
        {
            key: "/sys/mcuimg.bin",
            file: "/sys/mcuimg.bin",
            description: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.originalBootloader"),
        },
        {
            key: "/sys/mcuimg1.bin",
            file: "/sys/mcuimg1.bin",
            description: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.firstSlot"),
        },
        {
            key: "/sys/mcuimg2.bin",
            file: "/sys/mcuimg2.bin",
            description: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.secondSlot"),
        },
        {
            key: "/sys/mcuimg3.bin",
            file: "/sys/mcuimg3.bin",
            description: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.thirdSlot"),
        },
        {
            key: "/sys/mcubootinfo.bin",
            file: "/sys/mcubootinfo.bin",
            description: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.mcuBootInfo"),
        },
    ];

    const importantTBFilesColumns = [
        {
            title: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.file"),
            dataIndex: "file",
            key: "file",
        },
        {
            title: t("tonieboxes.cc3200BoxFlashing.installingBootloader.importantTBFiles.description"),
            dataIndex: "description",
            key: "description",
        },
    ];

    const firstInstallationTab = (
        <>
            <b>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.firstInstallation.moveOriginal")}</b>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.firstInstallation.moveOriginalText1")}
            </Paragraph>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.firstInstallation.moveOriginalText2")}
                <CodeSnippet
                    language="shell"
                    code={`cc3200tool -p COM3 write_file ExtractedFromBox/sys/mcuimg.bin /sys/pre-img.bin`}
                />
            </Paragraph>

            <b>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.firstInstallation.installPreloader")}</b>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.firstInstallation.installPreloaderText1")}
            </Paragraph>
            <CodeSnippet language="shell" code={`cc3200tool -p COM3 write_file flash/sys/mcuimg.bin /sys/mcuimg.bin`} />
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.firstInstallation.installPreloaderText2")}
            </Paragraph>
        </>
    );

    const existingInstallationUpdateTab = (
        <>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.intro")}</Paragraph>
            <b>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.backup")}</b>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.backupText")}
            </Paragraph>
            <CodeSnippet language="url" code={`http://*.*.*.*/api/ajax?cmd=get-flash-file&filepath=/sys/pre-img.bin`} />

            <b>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.copyOverPreloader")}</b>
            <Paragraph>
                <div style={{ maxHeight: 400, justifyItems: "center" }}>
                    <Image
                        src={cc3200cfwUpdate}
                        style={{ maxHeight: 400, width: "auto", maxWidth: "100%" }}
                        alt={t(
                            "tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.updatingCFWUsingOldCFWWebGui"
                        )}
                    />
                </div>
            </Paragraph>
            <Paragraph>
                <ul>
                    <li>
                        {t(
                            "tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.copyOverPreloaderStep1"
                        )}
                    </li>
                    <li>
                        {t(
                            "tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.copyOverPreloaderStep2"
                        )}
                    </li>
                    <li>
                        {t(
                            "tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.copyOverPreloaderStep3"
                        )}
                    </li>
                    <li>
                        {t(
                            "tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.copyOverPreloaderStep4"
                        )}
                    </li>
                    <li>
                        {t(
                            "tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.copyOverPreloaderStep5"
                        )}
                    </li>
                </ul>
            </Paragraph>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.outro")}</Paragraph>
            <CodeSnippet language="url" code={`http://*.*.*.*/api/ajax?cmd=get-flash-file&filepath=/sys/mcuimg.bin`} />
        </>
    );

    const preloaderInstallation: TabsProps["items"] = [
        {
            key: "firstTime",
            label: t("tonieboxes.cc3200BoxFlashing.installingBootloader.firstInstallation.title"),
            children: firstInstallationTab,
        },
        {
            key: "updateExisting",
            label: t("tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.title"),
            children: existingInstallationUpdateTab,
        },
    ];

    return (
        <>
            <h3>{t("tonieboxes.cc3200BoxFlashing.bootloader")}</h3>

            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.intro")}</Paragraph>

            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`cc3200tool -p COM3 read_all_files ExtractedFromBox/ read_flash backup.bin`}
                />
            </Paragraph>

            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.resetCommand")}</Paragraph>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.inCaseText")}</Paragraph>
            <Paragraph>
                <CodeSnippet language="shell" code={`cc3200tool -p COM3 read_all_files ExtractedFromBox/ `} />
            </Paragraph>
            <Paragraph>
                <CodeSnippet language="shell" code={`cc3200tool -p COM3 read_flash backup.bin`} />
            </Paragraph>

            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.verifyBackup")}</Paragraph>
            <Table dataSource={importantTBFilesData} columns={importantTBFilesColumns} pagination={false} />

            <h4>{t("tonieboxes.cc3200BoxFlashing.installBootloader")}</h4>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.downloadText1")}
                <Link to="https://github.com/toniebox-reverse-engineering/hackiebox_cfw_ng/releases" target="_blank">
                    {t("tonieboxes.cc3200BoxFlashing.installingBootloader.downloadLink")}
                </Link>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.downloadText2")}
            </Paragraph>

            <h5>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.preface.title")}</h5>
            <Paragraph>
                <Paragraph>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.preface.intro")}</Paragraph>
                <Paragraph>
                    <ul>
                        <li>
                            {t("tonieboxes.cc3200BoxFlashing.installingBootloader.stage1")}
                            <ul>
                                <li>
                                    {t("tonieboxes.cc3200BoxFlashing.installingBootloader.firstInstallation.title")}
                                </li>
                                <li>
                                    {t("tonieboxes.cc3200BoxFlashing.installingBootloader.existingInstallation.title")}
                                </li>
                            </ul>
                        </li>
                        <li>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.stage2")}</li>
                    </ul>
                </Paragraph>
            </Paragraph>

            <h5>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.stage1")}</h5>
            <Tabs items={preloaderInstallation} indicator={{ size: (origin) => origin - 20, align: "center" }} />

            <h5>{t("tonieboxes.cc3200BoxFlashing.installingBootloader.stage2")}</h5>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.installingBootloaderStage2.intro")}
            </Paragraph>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.installingBootloaderStage2.text1")}
            </Paragraph>
            <Paragraph>
                {t("tonieboxes.cc3200BoxFlashing.installingBootloader.installingBootloaderStage2.text2")}
                <Link
                    to="https://tonies-wiki.revvox.de/docs/custom-firmware/cc3200/hackieboxng-bl/bootloader/"
                    target="_blank"
                >
                    {t("tonieboxes.cc3200BoxFlashing.installingBootloader.installingBootloaderStage2.here")}
                </Link>
                .
            </Paragraph>
        </>
    );
};
