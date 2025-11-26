import { Button, Typography } from "antd";
import { useTranslation } from "react-i18next";

import CodeSnippet from "../../../../common/elements/CodeSnippet";
import { useState } from "react";
import { CertificatesModal } from "../../../common/modals/CertificatesModal";
import { CertificateIntro } from "../../common/elements/CertificateIntro";

const { Paragraph } = Typography;

export const Step2Certificates: React.FC = () => {
    const { t } = useTranslation();

    const [certModalOpen, setCertModalOpen] = useState(false);

    return (
        <>
            <h3>{t("tonieboxes.boxFlashingCommon.certificates")}</h3>

            <CertificateIntro asC2Der={true} />

            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.certificates.alreadyAvailable")}</Paragraph>
            <Paragraph>
                <CodeSnippet language="shell" code={`/currentDir/ExtractedFromBox/cert/.`} />
            </Paragraph>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.certificates.extractAgain")}</Paragraph>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`cc3200tool -p COM3 read_file /cert/ca.der ExtractedFromBox/cert/ca.der read_file /cert/private.der ExtractedFromBox/cert/private.der read_file /cert/client.der ExtractedFromBox/cert/client.der`}
                />
            </Paragraph>
            <Paragraph>
                <Paragraph>
                    <Paragraph>{t("tonieboxes.cc3200BoxFlashing.certificates.extractAgain")}</Paragraph>
                    <Paragraph>
                        <Button onClick={() => setCertModalOpen(true)}>
                            {t("tonieboxes.boxSetup.uploadCertificateButton")}
                        </Button>
                    </Paragraph>
                </Paragraph>
            </Paragraph>

            <h4>{t("tonieboxes.cc3200BoxFlashing.flashCAreplacement")}</h4>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.flashCAreplacementIntro")}</Paragraph>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.flashCAreplacementText")}</Paragraph>
            <CodeSnippet language="shell" code={`cc3200tool -p COM3 write_file c2.der /cert/c2.der`} />
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.flashCAreplacementOutro")}</Paragraph>
            <CertificatesModal
                open={certModalOpen}
                onOk={() => setCertModalOpen(false)}
                onCancel={() => setCertModalOpen(false)}
            />
        </>
    );
};
