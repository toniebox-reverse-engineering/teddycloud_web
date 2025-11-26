import { Typography } from "antd";
import { useTranslation } from "react-i18next";
import { DnsForTeddyCloud } from "../../../common/elements/DnsForTeddyCloud";

const { Paragraph } = Typography;

export const Step2Dns: React.FC = () => {
    const { t } = useTranslation();

    return (
        <>
            <h3>{t("tonieboxes.boxFlashingCommon.dns")}</h3>
            <Paragraph>{t("tonieboxes.esp32BoxFlashing.legacy.skipDnsIfAlreadyDone")}</Paragraph>
            <DnsForTeddyCloud />
        </>
    );
};
