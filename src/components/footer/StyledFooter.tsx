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
  flex-direction: column;
  align-items: center;
`;

const StyledCenterPart = styled.div`
  margin: auto;
  display: flex;
  align-items: center;
`;

export const StyledFooter = () => {
  const { t } = useTranslation();
  const [footerHeight, setFooterHeight] = useState(0);
  const [version, setVersion] = useState('');
  const [versionShort, setVersionShort] = useState('');

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (footer) {
      setFooterHeight(footer.offsetHeight);
    }
    fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/get/internal.version.v_long`)
          .then(response => response.text()) // Parse response as text
          .then(data => setVersion(data))    // Set fetched data to state
          .catch(error => console.error('Error fetching data:', error));
          fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/get/internal.version.v_short`)
          .then(response => response.text()) // Parse response as text
          .then(data => setVersionShort(data))    // Set fetched data to state
          .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <>
      <div style={{ paddingBottom: footerHeight }} />

      <StyledFooterComponent>

        <StyledCenterPart>
          <AudioPlayerFooter />
        </StyledCenterPart>
        <StyledCenterPart>
          <div style={{ marginTop: "8px" }}>
            <small>
                <Link to="https://github.com/toniebox-reverse-engineering/teddycloud/releases/" target="_blank">
                    <HiddenDesktop>{versionShort}</HiddenDesktop>
                    <HiddenMobile>{version}</HiddenMobile>
                </Link>
            </small>
          </div>
        </StyledCenterPart>
      </StyledFooterComponent>
    </>
  );
};
