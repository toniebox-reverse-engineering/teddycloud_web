import { useTranslation } from "react-i18next";
import { DnsForTeddyCloud } from "../../common/elements/DnsForTeddyCloud";

export const Step2Dns: React.FC = () => {
    const { t } = useTranslation();

    return (
        <>
            <h3>{t("tonieboxes.boxFlashingCommon.dns")}</h3>
            <DnsForTeddyCloud />
        </>
    );
};
