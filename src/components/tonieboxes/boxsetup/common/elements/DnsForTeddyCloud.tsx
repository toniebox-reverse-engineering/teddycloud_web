import { JSX } from "react";
import { Alert, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import CodeSnippet from "../../../../common/elements/CodeSnippet";

const { Paragraph } = Typography;

export function dnsForTeddyCloud(): JSX.Element {
    const { t } = useTranslation();

    return (
        <>
            <h4>{t("tonieboxes.boxFlashingCommon.dnsHint")}</h4>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.dnsText1")}</Paragraph>
            <Alert
                type="warning"
                showIcon
                title={t("tonieboxes.boxFlashingCommon.dnsBeware")}
                description={t("tonieboxes.boxFlashingCommon.dnsBewareText")}
                style={{ marginBottom: 16 }}
            />

            <h4>{t("tonieboxes.boxFlashingCommon.alternativeDNSSolutions")}</h4>
            <h5>{t("tonieboxes.boxFlashingCommon.openWrt.usingOpenWrt")}</h5>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.openWrt.dnsText2")}</Paragraph>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`uci set dhcp.teddycloud="tag"
uci set dhcp.teddycloud.dhcp_option="3,1.2.3.4" # 1.2.3.4=teddycloud ip

uci add dhcp host
uci set dhcp.@host[-1].name="toniebox_1"
uci set dhcp.@host[-1].mac="00:11:22:33:44:55" # toniebox mac
uci set dhcp.@host[-1].ip="1.2.3.101" # toniebox_1 ip
uci set dhcp.@host[-1].tag="teddycloud"
uci commit dhcp
/etc/init.d/dnsmasq restart`}
                />
            </Paragraph>

            <h5>{t("tonieboxes.boxFlashingCommon.adguard.usingAdGuard")}</h5>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.setupInstructionsTitle")}</Paragraph>

            <strong>{t("tonieboxes.boxFlashingCommon.adguard.prerequisitesTitle")}</strong>
            <ul>
                <li>
                    {t("tonieboxes.boxFlashingCommon.adguard.adGuardRequirement")}
                    <ul style={{ marginBottom: 0 }}>
                        <li>
                            {t("tonieboxes.boxFlashingCommon.adguard.moreInformation")}{" "}
                            <Link to="https://adguard.com/" target="_blank">
                                https://adguard.com/
                            </Link>
                        </li>
                    </ul>
                </li>
                <li>{t("tonieboxes.boxFlashingCommon.adguard.teddyCloudIp")}</li>
                <li>{t("tonieboxes.boxFlashingCommon.adguard.tonieboxIp")}</li>
            </ul>

            <Paragraph>
                <strong>{t("tonieboxes.boxFlashingCommon.adguard.stepsTitle")}</strong>
            </Paragraph>

            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.step1Title")}</Paragraph>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.step1Instructions")}</Paragraph>

            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.step2Title")}</Paragraph>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.step2Instructions")}</Paragraph>

            <CodeSnippet
                language="shell"
                code={`||prod.de.tbs.toys^$dnsrewrite=NOERROR;A;XXX.XXX.XXX.XXX,client=YYY.YYY.YYY.YYY
||rtnl.bxcl.de^$dnsrewrite=NOERROR;A;XXX.XXX.XXX.XXX,client=YYY.YYY.YYY.YYY`}
            />

            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.explanationTitle")}</Paragraph>
            <Paragraph>
                <strong>||prod.de.tbs.toys^</strong>: {t("tonieboxes.boxFlashingCommon.adguard.prodDomainExplanation")}
            </Paragraph>
            <Paragraph>
                <strong>$dnsrewrite=NOERROR;A;XXX.XXX.XXX.XXX</strong>:{" "}
                {t("tonieboxes.boxFlashingCommon.adguard.dnsRewriteExplanation")}
            </Paragraph>
            <Paragraph>
                <strong>client=YYY.YYY.YYY.YYY</strong>: {t("tonieboxes.boxFlashingCommon.adguard.clientExplanation")}
            </Paragraph>

            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.step3Title")}</Paragraph>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.step3Instructions")}</Paragraph>

            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.step4Title")}</Paragraph>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.ipReservationInstructions")}</Paragraph>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.adguard.loggingMonitoringInstructions")}</Paragraph>
        </>
    );
}
