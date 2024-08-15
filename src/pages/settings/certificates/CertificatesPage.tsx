import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Alert, Typography } from "antd";
import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../components/StyledComponents";
import { SettingsSubNav } from "../../../components/settings/SettingsSubNav";
import { CertificateDragNDrop } from "../../../components/form/CertificatesDragAndDrop";

export const CertificatesPage = () => {
    const { t } = useTranslation();
    const { Paragraph } = Typography;

    return (
        <>
            <StyledSider>
                <SettingsSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <SettingsSubNav />
                </HiddenDesktop>
                <BreadcrumbWrapper
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("settings.navigationTitle") },
                        { title: t("settings.certificates.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t(`settings.certificates.title`)}</h1>
                    <Paragraph>
                        <Alert
                            message={t("settings.certificates.information")}
                            description=<div>
                                {t("settings.certificates.hint")}{" "}
                                <Link to="/tonieboxes">{t("settings.tonieboxes")}</Link>.
                            </div>
                            type="info"
                            showIcon
                        />
                    </Paragraph>
                    <Paragraph>
                        <CertificateDragNDrop />
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
