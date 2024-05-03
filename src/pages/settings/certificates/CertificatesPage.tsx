import { useTranslation } from "react-i18next";
import {
  HiddenDesktop,
  StyledBreadcrumb,
  StyledContent,
  StyledLayout,
  StyledSider,
} from "../../../components/StyledComponents";
import { SettingsSubNav } from "../../../components/settings/SettingsSubNav";
import { CertificateDragNDrop } from "../../../components/settings/CertificatesDragNDrop";

export const CertificatesPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <StyledSider>
        <SettingsSubNav />
      </StyledSider>
      <StyledLayout>
        <HiddenDesktop>
          <SettingsSubNav />
        </HiddenDesktop>
        <StyledBreadcrumb
          items={[
            { title: t("home.navigationTitle") },
            { title: t("settings.navigationTitle") },
            { title: t("settings.certificates.navigationTitle") },
          ]}
        />
        <StyledContent>
          <h1>{t(`settings.certificates.title`)}</h1>
          <div>
            <CertificateDragNDrop/>
          </div>
        </StyledContent>
      </StyledLayout>
    </>
  );
};
