import { useTranslation } from "react-i18next";
import { Header } from "antd/es/layout/layout";
import styled from "styled-components";
import { MenuOutlined } from "@ant-design/icons";

import logoImg from "../../assets/logo.png";
import { Button, Drawer, Menu, MenuProps } from "antd";
import { Link } from "react-router-dom";
import { ServerStatus } from "./ServerStatus";
import { useState } from "react";
import { HiddenDesktop, HiddenMobile } from "../StyledComponents";
import { StyledLanguageSwitcher } from "./StyledLanguageSwitcher";

const StyledLogo = styled.img`
  height: 32px;
`;
const StyledHeaderComponent = styled(Header)`
  color: white;
  display: flex;
  align-items: center;
  padding-left: 16px;
  padding-right: 16px;
`;

const StyledRightPart = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
`;

const StyledLeftPart = styled.div`
  margin-right: 12px;
  display: flex;
  align-items: center;
`;

export const StyledHeader = () => {
  const { t } = useTranslation();
  const [navOpen, setNavOpen] = useState(false);

  const mainNav: MenuProps["items"] = [
    {
      key: "/",
      label: <Link to="/">{t("home.navigationTitle")}</Link>,
      onClick: () => setNavOpen(false),
    },
    {
      key: "tonies",
      label: <Link to="/tonies">{t("tonies.navigationTitle")}</Link>,
      onClick: () => setNavOpen(false),
    },
    {
      key: "tonieboxes",
      label: <Link to="/tonieboxes">{t("tonieboxes.navigationTitle")}</Link>,
      onClick: () => setNavOpen(false),
    },
    {
      key: "settings",
      label: <Link to="/settings">{t("settings.navigationTitle")}</Link>,
      onClick: () => setNavOpen(false),
    },
  ];
  return (
    <StyledHeaderComponent>
      <Link to="/" style={{ color: "white" }}>
        <StyledLeftPart>
          <StyledLogo src={logoImg} />
          <HiddenMobile> TeddyCloud Server</HiddenMobile>
        </StyledLeftPart>
      </Link>
      <HiddenMobile>
        <Menu theme="dark" mode="horizontal" items={mainNav} style={{ width: "calc(100vw - 480px)" }} />
      </HiddenMobile>
      <StyledRightPart>
        <ServerStatus />
        <StyledLanguageSwitcher />
        <HiddenDesktop>
          <Button
            className="barsMenu"
            type="primary"
            onClick={() => setNavOpen(true)}
            icon={<MenuOutlined />}
          />
          <Drawer
            placement="right"
            open={navOpen}
            onClose={() => setNavOpen(false)}
          >
            <Menu mode="vertical" items={mainNav} />
            <StyledLanguageSwitcher />
          </Drawer>
        </HiddenDesktop>
      </StyledRightPart>
    </StyledHeaderComponent>
  );
};
