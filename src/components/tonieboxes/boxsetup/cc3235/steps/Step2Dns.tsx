import { Alert } from "antd";
import { useTranslation } from "react-i18next";
import { DnsForTeddyCloud } from "../../common/elements/DnsForTeddyCloud";

export const Step2Dns: React.FC = () => {
    const { t } = useTranslation();

    return (
        <>
            <h3>{t("tonieboxes.boxFlashingCommon.dns")}</h3>
            <Alert
                type="info"
                showIcon
                description={t("tonieboxes.cc3235BoxFlashing.portHint")}
                style={{ marginBottom: 16 }}
            />
            <DnsForTeddyCloud />
        </>
    );
};
