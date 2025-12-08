import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { theme, Layout } from "antd";
import { ExclamationCircleOutlined, HeartFilled } from "@ant-design/icons";
import styled from "styled-components";

import { gitHubSponsoringUrl, gitHubTCCommitTreeBaseUrl, gitHubTCReleasesUrl } from "../../../constants/urls";

import AudioPlayerFooter from "./AudioPlayerFooter";
import { HiddenDesktop, HiddenMobile } from "../StyledComponents";
import { useTeddyCloudVersion } from "../../../hooks/useTeddyCloudVersion";

const { useToken } = theme;
const { Footer } = Layout;

const StyledFooterComponent = styled(Footer)<{ $sticky: boolean }>`
    position: ${({ $sticky }) => ($sticky ? "fixed" : "static")};
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

    const {
        version,
        versionShort,
        commitGitShaShort,
        commitGitSha,
        latestReleaseVersion,
        latestDevelopSHA,
        newVersionAvailable,
        isDevelopVersion,
    } = useTeddyCloudVersion();

    const [isAudioPlayerVisible, setIsAudioPlayerVisible] = useState(false);
    const [footerHeight, setFooterHeight] = useState(0);
    const footerRef = useRef<HTMLDivElement | null>(null);

    const handleAudioPlayerVisibilityChange = useCallback((visible: boolean) => {
        setIsAudioPlayerVisible(visible);

        if (visible && footerRef.current) {
            setFooterHeight(footerRef.current.offsetHeight);
        } else {
            setFooterHeight(0);
        }
    }, []);

    return (
        <>
            {isAudioPlayerVisible && <AdditionalFooterPadding height={footerHeight} />}
            <StyledFooterComponent id="teddycloud-footer" ref={footerRef} $sticky={isAudioPlayerVisible}>
                <StyledCenterPart>
                    <AudioPlayerFooter onVisibilityChange={handleAudioPlayerVisibilityChange} />
                </StyledCenterPart>
                <StyledCenterPart>
                    <small style={{ display: "flex", color: colorText, whiteSpace: "nowrap" }}>
                        <Link
                            to={
                                isDevelopVersion
                                    ? gitHubTCCommitTreeBaseUrl + commitGitSha
                                    : gitHubTCReleasesUrl + "tag/tc_" + versionShort
                            }
                            target="_blank"
                        >
                            <HiddenDesktop>
                                {versionShort} ({commitGitShaShort})
                            </HiddenDesktop>
                            <HiddenMobile>{version}</HiddenMobile>
                        </Link>
                        {newVersionAvailable && (
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    paddingLeft: 8,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                <span style={{ paddingRight: 8 }}>-</span>
                                <Link
                                    to={
                                        isDevelopVersion
                                            ? gitHubTCCommitTreeBaseUrl + latestDevelopSHA
                                            : gitHubTCReleasesUrl + "tag/" + latestReleaseVersion
                                    }
                                    target="_blank"
                                    style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}
                                >
                                    <ExclamationCircleOutlined style={{ color: token.colorWarningText }} />
                                    <span style={{ paddingLeft: 8 }}>{t("teddycloud.newVersionShort")}</span>
                                </Link>
                            </span>
                        )}
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
