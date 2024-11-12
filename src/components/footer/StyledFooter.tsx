import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { theme } from "antd";
import { Footer } from "antd/es/layout/layout";
import { HeartFilled } from "@ant-design/icons";
import styled from "styled-components";

import { gitHubSponsoringUrl, gitHubTCReleasesUrl } from "../../constants";

import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

import AudioPlayerFooter from "./AudioPlayerFooter";
import { HiddenDesktop, HiddenMobile } from "../StyledComponents";

const { useToken } = theme;

const StyledFooterComponent = styled(Footer)`
    position: fixed;
    bottom: 0;
    z-index: 10;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 50px;
    color: white;
`;

const StyledCenterPart = styled.div`
    margin: auto;
    display: flex;
    align-items: center;
`;

const api = new TeddyCloudApi(defaultAPIConfig());

export const StyledFooter = () => {
    const { t } = useTranslation();
    const { token } = useToken();
    const [footerHeight, setFooterHeight] = useState(0);

    const [version, setVersion] = useState("");
    const [versionShort, setVersionShort] = useState("");
    const [gitShaShort, setGitShaShort] = useState("");

    const handleAudioPlayerVisibilityChange = () => {
        const footer = document.querySelector("footer");
        if (footer) {
            setFooterHeight(footer.offsetHeight);
        }
    };

    useEffect(() => {
        api.apiGetTeddyCloudSettingRaw("internal.version.v_long")
            .then((response) => response.text())
            .then((data) => setVersion(data))
            .catch((error) => console.error("Error fetching data:", error));
        api.apiGetTeddyCloudSettingRaw("internal.version.v_short")
            .then((response) => response.text())
            .then((data) => setVersionShort(data))
            .catch((error) => console.error("Error fetching data:", error));
        api.apiGetTeddyCloudSettingRaw("internal.version.git_sha_short")
            .then((response) => response.text())
            .then((data) => setGitShaShort(data))
            .catch((error) => console.error("Error fetching data:", error));
    }, []);

    return (
        <>
            <div style={{ paddingBottom: footerHeight }} />

            <StyledFooterComponent>
                <StyledCenterPart>
                    <AudioPlayerFooter onVisibilityChange={handleAudioPlayerVisibilityChange} />
                </StyledCenterPart>
                <StyledCenterPart>
                    <div>
                        <small style={{ display: "flex", color: token.colorText }}>
                            <Link to={gitHubTCReleasesUrl} target="_blank">
                                <HiddenDesktop>
                                    {versionShort} ({gitShaShort})
                                </HiddenDesktop>
                                <HiddenMobile>{version}</HiddenMobile>
                            </Link>
                            <HiddenMobile style={{ paddingLeft: 8 }}>
                                -
                                <HeartFilled style={{ paddingLeft: 8, color: "#eb2f96" }} /> {t("footer.sponsorText")}{" "}
                                <b>
                                    <Link to={gitHubSponsoringUrl} target="_blank">
                                        {t("footer.sponsor")}
                                    </Link>
                                </b>
                            </HiddenMobile>
                        </small>
                    </div>
                </StyledCenterPart>
            </StyledFooterComponent>
        </>
    );
};
