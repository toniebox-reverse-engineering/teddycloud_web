import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { theme } from "antd";
import { Footer } from "antd/es/layout/layout";
import { HeartFilled } from "@ant-design/icons";
import styled from "styled-components";

import { gitHubSponsoringUrl, gitHubTCReleasesUrl } from "../../../constants";

import AudioPlayerFooter from "./AudioPlayerFooter";
import { HiddenDesktop, HiddenMobile } from "../StyledComponents";
import { useTeddyCloudVersion } from "../../../hooks/useTeddyCloudVersion";

const { useToken } = theme;

const StyledFooterComponent = styled(Footer)`
    position: fixed;
    bottom: 0;
    z-index: 10;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 24px;
    color: white;
`;

const StyledCenterPart = styled.div`
    margin: auto;
    display: flex;
    align-items: center;
`;

export const StyledFooter = () => {
    const { t } = useTranslation();
    const { token } = useToken();
    const [footerHeight, setFooterHeight] = useState(0);

    const { version, versionShort, commitGitShaShort } = useTeddyCloudVersion();

    const handleAudioPlayerVisibilityChange = () => {
        const footer = document.querySelector("footer");
        if (footer) {
            setFooterHeight(footer.offsetHeight);
        }
    };

    return (
        <>
            <div className="additional-footer-padding" style={{ paddingBottom: footerHeight }} />
            <StyledFooterComponent id="teddycloud-footer">
                <StyledCenterPart>
                    <AudioPlayerFooter onVisibilityChange={handleAudioPlayerVisibilityChange} />
                </StyledCenterPart>
                <StyledCenterPart>
                    <div>
                        <small style={{ display: "flex", color: token.colorText }}>
                            <Link to={gitHubTCReleasesUrl} target="_blank">
                                <HiddenDesktop>
                                    {versionShort} ({commitGitShaShort})
                                </HiddenDesktop>
                                <HiddenMobile>{version}</HiddenMobile>
                            </Link>
                            <div style={{ paddingLeft: 8 }}>-</div>
                            <HeartFilled style={{ color: "#eb2f96", paddingLeft: 8 }} />
                            <HiddenMobile style={{ paddingLeft: 8 }}>{t("footer.sponsorText")} </HiddenMobile>
                            <b>
                                <Link to={gitHubSponsoringUrl} target="_blank" style={{ paddingLeft: 8 }}>
                                    {t("footer.sponsor")}
                                </Link>
                            </b>
                        </small>
                    </div>
                </StyledCenterPart>
            </StyledFooterComponent>
        </>
    );
};
