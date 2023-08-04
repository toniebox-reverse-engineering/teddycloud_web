import { useTranslation } from "react-i18next";
import { Header } from "antd/es/layout/layout";
import styled from "styled-components";
import { MenuOutlined } from "@ant-design/icons";

import logoImg from "../../assets/logo.png";
import { Button, Drawer, Menu, MenuProps } from "antd";
import { Link } from "react-router-dom";
import { changeLanguage } from "i18next";
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
`;

const StyledRightPart = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
`;

export const StyledHeader = () => {
  const { t } = useTranslation();
  const [navOpen, setNavOpen] = useState(false);

  const mainNav: MenuProps["items"] = [
    { key: "/", label: <Link to="/">{t("home.navigationTitle")}</Link> },
    {
      key: "/settings",
      label: <Link to="/settings">{t("settings.navigationTitle")}</Link>,
    },
  ];
  return (
    <StyledHeaderComponent>
      <StyledLogo src={logoImg} />
      <HiddenMobile> TeddyCloud Server</HiddenMobile>

      <HiddenMobile>
        <Menu theme="dark" mode="horizontal" items={mainNav} />
      </HiddenMobile>
      <StyledRightPart>
        <ServerStatus />
        <HiddenMobile>
          <StyledLanguageSwitcher />
        </HiddenMobile>
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
