import { useTranslation } from "react-i18next";
import {
  HiddenDesktop,
  StyledBreadcrumb,
  StyledContent,
  StyledLayout,
  StyledSider,
} from "../../components/StyledComponents";
import { HomeSubNav } from "../../components/home/HomeSubNav";

export const HomePage = () => {
  const { t } = useTranslation();

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
