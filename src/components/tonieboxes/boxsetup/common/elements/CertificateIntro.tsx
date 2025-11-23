import { JSX } from "react";
import { Button, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { handleTCCADerDownload } from "../../../../../utils/downloads/handleTCCADerDownload";

const { Paragraph } = Typography;

export function certificateIntro(asC2Der: boolean): JSX.Element {
    const { t } = useTranslation();

    return (
        <>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.certificatesIntro")}</Paragraph>
            <Paragraph>
                <Button onClick={() => handleTCCADerDownload(asC2Der)}>
                    {asC2Der ? t("tonieboxes.downloadC2DerFile") : t("tonieboxes.downloadCADerFile")}
                </Button>
            </Paragraph>
            <h4>{t("tonieboxes.boxFlashingCommon.dumpCertificates")}</h4>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.dumpCertificatesIntro1")}</Paragraph>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.dumpCertificatesIntro2")}</Paragraph>
        </>
    );
}
