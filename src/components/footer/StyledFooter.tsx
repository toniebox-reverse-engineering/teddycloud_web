import { useTranslation } from "react-i18next";
import { Footer } from "antd/es/layout/layout";
import styled from "styled-components";
import { MenuOutlined } from "@ant-design/icons";

import logoImg from "../../assets/logo.png";
import { Button, Drawer, Menu, MenuProps } from "antd";
import { Link } from "react-router-dom";
import { HiddenDesktop, HiddenMobile } from "../StyledComponents";
import AudioPlayerFooter from "./AudioPlayerFooter";

import { useEffect, useState } from 'react';

const StyledLogo = styled.img`
  height: 32px;
`;
const StyledFooterComponent = styled(Footer)`
  position: fixed;
  bottom: 0;
  width: 100%;
  display: flex;
  align-items: center;
`;

const StyledCenterPart = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
`;
const StyledRightPart = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
`;

export const StyledFooter = () => {
  const { t } = useTranslation();
  const [footerHeight, setFooterHeight] = useState(0);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (footer) {
      setFooterHeight(footer.offsetHeight);
    }
  }, []);

  return (
    <>
      <div style={{ paddingBottom: footerHeight }} />

      <StyledFooterComponent>
        <HiddenMobile>

        </HiddenMobile>

        <StyledCenterPart>
          <AudioPlayerFooter />
        </StyledCenterPart>

        <StyledRightPart>
        </StyledRightPart>
      </StyledFooterComponent>
    </>
  );
};
