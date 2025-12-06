import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { theme, Layout } from "antd";
import { HeartFilled } from "@ant-design/icons";
import styled from "styled-components";

import { gitHubSponsoringUrl, gitHubTCReleasesUrl } from "../../../constants/urls";

import AudioPlayerFooter from "./AudioPlayerFooter";
import { HiddenDesktop, HiddenMobile } from "../StyledComponents";
import { useTeddyCloudVersion } from "../../../hooks/useTeddyCloudVersion";

const { useToken } = theme;
const { Footer } = Layout;

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

const AdditionalFooterPadding = styled.div<{ height: number }>`
    padding-bottom: ${({ height }) => height}px;
`;

export const StyledFooter = () => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { colorText } = token;

    const [footerHeight, setFooterHeight] = useState(0);
    const footerRef = useRef<HTMLDivElement | null>(null);

    const { version, versionShort, commitGitShaShort } = useTeddyCloudVersion();

    const handleAudioPlayerVisibilityChange = useCallback(() => {
        if (footerRef.current) {
            setFooterHeight(footerRef.current.offsetHeight);
        }
    }, []);

    return (
        <>
            <AdditionalFooterPadding height={footerHeight} />
            <StyledFooterComponent id="teddycloud-footer" ref={footerRef}>
                <StyledCenterPart>
                    <AudioPlayerFooter onVisibilityChange={handleAudioPlayerVisibilityChange} />
                </StyledCenterPart>
                <StyledCenterPart>
                    <small style={{ display: "flex", color: colorText }}>
                        <Link to={gitHubTCReleasesUrl} target="_blank">
                            <HiddenDesktop>
                                {versionShort} ({commitGitShaShort})
                            </HiddenDesktop>
                            <HiddenMobile>{version}</HiddenMobile>
                        </Link>
                        <span style={{ paddingLeft: 8 }}>-</span>
                        <HeartFilled style={{ color: "#eb2f96", paddingLeft: 8 }} />
                        <HiddenMobile style={{ paddingLeft: 8 }}>{t("footer.sponsorText")} </HiddenMobile>
                        <b>
                            <Link to={gitHubSponsoringUrl} target="_blank" style={{ paddingLeft: 8 }}>
                                {t("footer.sponsor")}
                            </Link>
                        </b>
                    </small>
                </StyledCenterPart>
            </StyledFooterComponent>
        </>
    );
};
