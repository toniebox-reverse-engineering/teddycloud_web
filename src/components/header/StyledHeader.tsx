import { useTranslation } from "react-i18next";
import { Header } from "antd/es/layout/layout";
import styled from "styled-components";
import { MenuOutlined, LogoutOutlined } from "@ant-design/icons";

import logoImg from "../../assets/logo.png";
import { Button, Drawer, Menu, MenuProps } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { ServerStatus } from "./ServerStatus";
import { useState } from "react";
import { HiddenDesktop, HiddenMobile } from "../StyledComponents";
import { StyledLanguageSwitcher } from "./StyledLanguageSwitcher";
import { useAuth } from "../../provider/AuthProvider";

const StyledLogo = styled.img`
  height: 32px;
`;
const StyledHeaderComponent = styled(Header)`
  color: white;
  display: flex;
  align-items: center;
`;

const StyledRightPart = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
`;

export const StyledHeader = () => {
  const { t } = useTranslation();
  const [navOpen, setNavOpen] = useState(false);

  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const mainNav: MenuProps["items"] = [
    { key: "/", label: <Link to="/">{t("home.navigationTitle")}</Link> },
    {
      key: "settings",
      label: <Link to="/settings">{t("settings.navigationTitle")}</Link>,
    },
    {
      key: "tonies",
      label: <Link to="/tonies">{t("tonies.navigationTitle")}</Link>,
    },
  ];

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <StyledHeaderComponent>
      <StyledLogo src={logoImg} />
      <HiddenMobile> TeddyCloud Server</HiddenMobile>

      <HiddenMobile>
        <Menu theme="dark" mode="horizontal" items={mainNav} />
      </HiddenMobile>
      <StyledRightPart>
        <ServerStatus />
        { isAuthenticated ? (
          <Button
            className="Logout"
            type="primary"
            onClick={() => handleLogout()}
            icon={<LogoutOutlined />}
          />
            ) : (
              <span />
              ) }
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
            <Menu theme="dark" mode="vertical" items={mainNav} />
            <StyledLanguageSwitcher />
          </Drawer>
        </HiddenDesktop>
      </StyledRightPart>
    </StyledHeaderComponent>
  );
};
