import { useTranslation } from "react-i18next";
import { Header } from "antd/es/layout/layout";
import styled from "styled-components";

import logoImg from "../../assets/logo.png";
import { Menu, MenuProps } from "antd";
import { Link } from "react-router-dom";
import { changeLanguage } from "i18next";
import { ServerStatus } from "./ServerStatus";

const StyledLogo = styled.img`
  height: 32px;
`;
const StyledHeaderComponent = styled(Header)`
  color: white;
  display: flex;
  align-items: center;
`;

const StyledLanguageSwitcher = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  > span {
    margin-left: 8px;
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  }
`;

export const StyledHeader = () => {
  const { t } = useTranslation();
  const mainNav: MenuProps["items"] = [
    { key: "/", label: <Link to="/">{t("home.navigationTitle")}</Link> },
    {
      key: "/settings",
      label: <Link to="/settings">{t("settings.navigationTitle")}</Link>,
    },
  ];
  return (
    <StyledHeaderComponent>
      <StyledLogo src={logoImg} /> TeddyCloud Server
      <Menu theme="dark" mode="horizontal" items={mainNav} />
      <ServerStatus />
      <StyledLanguageSwitcher>
        <div>{t("language.change")}</div>
        <span onClick={() => changeLanguage("en")}>EN</span>
        <span onClick={() => changeLanguage("de")}>DE</span>
      </StyledLanguageSwitcher>
    </StyledHeaderComponent>
  );
};
