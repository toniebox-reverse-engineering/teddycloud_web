import { useTranslation } from "react-i18next";
import {
  HiddenDesktop,
  StyledBreadcrumb,
  StyledBreadcrumbItem,
  StyledContent,
  StyledLayout,
  StyledSider,
} from "../../components/StyledComponents";
import { HomeSubNav } from "../../components/home/HomeSubNav";
import {useAuth} from "../../provider/AuthProvider";

export const HomePage = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <>
      <StyledSider>
        <HomeSubNav />
      </StyledSider>
      <StyledLayout>
        <HiddenDesktop>
          <HomeSubNav />
        </HiddenDesktop>
        <StyledBreadcrumb items={[{ title: t("home.navigationTitle") }]} />
        <StyledContent>
          <h1>{t(`home.title`)}</h1>
        </StyledContent>
      </StyledLayout>
    </>
  );
};
