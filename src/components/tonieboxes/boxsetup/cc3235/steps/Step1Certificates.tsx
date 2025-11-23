import { Alert, Button, Tabs, TabsProps, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import CodeSnippet from "../../../../common/elements/CodeSnippet";
import { certificateIntro } from "../../common/elements/CertificateIntro";
import { useState } from "react";
import { CertificatesModal } from "../../../common/modals/CertificatesModal";

const { Paragraph } = Typography;

type HwTool = "pico" | "ch341a";

interface CC3235Step1CertificatesProps {
    hwTool: HwTool;
    onHwToolChange: (tool: HwTool) => void;
}

export const Step1Certificates: React.FC<CC3235Step1CertificatesProps> = ({ hwTool, onHwToolChange }) => {
    const { t } = useTranslation();

    const [certModalOpen, setCertModalOpen] = useState(false);

    const commonCertUploadContent = (
        <>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.certificates.extractAgain")}</Paragraph>
            <Paragraph>
                <Button onClick={() => setCertModalOpen(true)}>
                    {t("tonieboxes.boxSetup.uploadCertificateButton")}
                </Button>
            </Paragraph>
            <CertificatesModal
                open={certModalOpen}
                onOk={() => setCertModalOpen(false)}
                onCancel={() => setCertModalOpen(false)}
            />
        </>
    );

    const commonCAcontent = (
        <>
            <h4>{t("tonieboxes.cc3235BoxFlashing.flashCAreplacement")}</h4>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.flashCAreplacementText1")}</Paragraph>
            <Alert
                type="warning"
                showIcon
                message={t("tonieboxes.cc3235BoxFlashing.flashCAReplacementTitle")}
                description={
                    <>
                        {t("tonieboxes.cc3235BoxFlashing.flashCAReplacementDescription1")}{" "}
                        <Link
                            to="https://raw.githubusercontent.com/toniebox-reverse-engineering/teddycloud/master/contrib/gencerts.sh"
                            target="_blank"
                        >
                            {t("tonieboxes.cc3235BoxFlashing.gencertLinkText")}{" "}
                        </Link>{" "}
                        {t("tonieboxes.cc3235BoxFlashing.flashCAReplacementDescription2")}{" "}
                        {t("tonieboxes.cc3235BoxFlashing.flashCAReplacementDescription3")}
                    </>
                }
                style={{ marginBottom: 16 }}
            />
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.flashCAreplacementText3")}</Paragraph>
        </>
    );

    const picoCertTab = (
        <>
            <h5>{t("tonieboxes.cc3235BoxFlashing.pico.readingFlash")}</h5>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.pico.readingFlashText1")}</Paragraph>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`flashrom -p serprog:dev=/dev/ttyACM0:921600 -r cc32xx-flash.bin --progress`}
                />
            </Paragraph>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.pico.readingFlashText2")}</Paragraph>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`flashrom -p serprog:dev=/dev/ttyACM0:921600 -r cc32xx-flash.2.bin --progress 
diff cc32xx-flash.bin cc32xx-flash.2.bin #no output = equal`}
                />
            </Paragraph>

            <h5>{t("tonieboxes.cc3235BoxFlashing.extractCertificates")}</h5>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.useCC3200ToolToExtract")}</Paragraph>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`cc3200tool -if cc32xx-flash.bin -d cc32xx read_all_files extract/`}
                />
            </Paragraph>

            {commonCertUploadContent}
            {commonCAcontent}

            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`cc3200tool -if cc32xx-flash.bin -of cc32xx-flash.customca.bin -d cc32xx write_file ca.der /cert/ca.der`}
                />
            </Paragraph>

            <h5>{t("tonieboxes.cc3235BoxFlashing.pico.writingFlash")}</h5>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`flashrom -p serprog:dev=/dev/ttyACM0:921600 -w cc32xx-flash.customca.bin --progress`}
                />
            </Paragraph>
        </>
    );

    const ch341aCertTab = (
        <>
            <h5>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.readingFlash")}</h5>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.flashMemoryDumpText1")}</Paragraph>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.flashMemoryDumpText2")}</Paragraph>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.flashMemoryDumpText3")}</Paragraph>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.flashMemoryDumpText4")}</Paragraph>
            <CodeSnippet language="shell" code={`flashrom -p ch341a_spi -r backupCC3235-1.bin`} />
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.flashMemoryDumpText5")}</Paragraph>
            <CodeSnippet language="shell" code={`flashrom -p ch341a_spi -r backupCC3235-2.bin`} />
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.flashMemoryDumpText6")}</Paragraph>
            <CodeSnippet language="shell" code={`diff backupCC3235-1.bin backupCC3235-2.bin #no output = equal`} />
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.flashMemoryDumpText7")}</Paragraph>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.flashMemoryDumpText8")}</Paragraph>

            <h5>{t("tonieboxes.cc3235BoxFlashing.extractCertificates")}</h5>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.useCC3200ToolToExtract")}</Paragraph>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`cc3200tool -if backupCC3235-1.bin -d cc32xx read_all_files extract/`}
                />
            </Paragraph>

            {commonCertUploadContent}
            {commonCAcontent}

            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`cc3200tool -if backupCC3235-1.bin -of cc32xx-flash.customca.bin -d cc32xx write_file ca.der /cert/ca.der`}
                />
            </Paragraph>

            <h5>{t("tonieboxes.cc3235BoxFlashing.CH341AProgrammer.writingFlash")}</h5>
            <Paragraph>
                <CodeSnippet language="shell" code={`flashrom -p ch341a_spi -w cc32xx-flash.customca.bin --progress`} />
            </Paragraph>
        </>
    );

    const hwHelperCert: TabsProps["items"] = [
        { key: "picoCE", label: "Raspberry Pi Pico", children: picoCertTab },
        { key: "ch341aCE", label: "CH341A Programmer", children: ch341aCertTab },
    ];

    const activeKey = hwTool === "pico" ? "picoCE" : "ch341aCE";

    const handleTabChange = (newKey: string) => {
        if (newKey.startsWith("pico")) {
            onHwToolChange("pico");
        } else {
            onHwToolChange("ch341a");
        }
    };

    return (
        <>
            <h3>{t("tonieboxes.boxFlashingCommon.certificates")}</h3>
            {certificateIntro(false)}
            <h4>CC3235</h4>
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.dumpCertificatesCC3235")}</Paragraph>
            <Tabs
                onChange={handleTabChange}
                activeKey={activeKey}
                items={hwHelperCert}
                indicator={{ size: (origin) => origin - 20, align: "center" }}
            />
            <Paragraph>{t("tonieboxes.cc3235BoxFlashing.flashCAreplacementText2")}</Paragraph>
        </>
    );
};
