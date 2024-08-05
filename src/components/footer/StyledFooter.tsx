import { Footer } from "antd/es/layout/layout";
import styled from "styled-components";

import { Link } from "react-router-dom";
import { HiddenDesktop, HiddenMobile } from "../StyledComponents";
import AudioPlayerFooter from "./AudioPlayerFooter";

import { useEffect, useState } from "react";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

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
    const [footerHeight, setFooterHeight] = useState(0);

    const [version, setVersion] = useState("");
    const [versionShort, setVersionShort] = useState("");

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
                        <small>
                            <Link
                                to="https://github.com/toniebox-reverse-engineering/teddycloud/releases/"
                                target="_blank"
                            >
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
