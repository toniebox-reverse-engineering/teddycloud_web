import Item from "antd/es/list/Item";
import { useTranslation } from "react-i18next";
import {
  StyledBreadcrumb,
  StyledBreadcrumbItem,
  StyledContent,
  StyledLayout,
  StyledSider,
} from "../../components/StyledComponents";

export const ToniesPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <StyledSider>&nbsp;</StyledSider>
      <StyledLayout>
        <StyledBreadcrumb items={[{ title: t("tonies.navigationTitle") }]} />
        <StyledContent>
          <h1>{t(`tonies.title`)}</h1>
        </StyledContent>
      </StyledLayout>
    </>
  );
};
