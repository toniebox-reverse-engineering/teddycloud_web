import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button, Drawer, Menu, MenuProps, Modal, theme } from "antd";
import { Header } from "antd/es/layout/layout";
import { MenuOutlined } from "@ant-design/icons";

import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

import logoImg from "../../assets/logo.png";

import { ServerStatus } from "./ServerStatus";
import { StyledLanguageSwitcher } from "./StyledLanguageSwitcher";
import { HiddenDesktop, HiddenMobile } from "../StyledComponents";
import NotificationButton from "../utils/NotificationButton";
import { useTeddyCloud } from "../../TeddyCloudContext";

const api = new TeddyCloudApi(defaultAPIConfig());

const { useToken } = theme;

const StyledLogo = styled.img`
    height: 32px;
`;

const StyledHeaderComponent = styled(Header)`
    color: white;
    display: flex;
    align-items: center;
    padding-left: 16px;
    padding-right: 16px;
    background: #141414;
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

export const StyledHeader = ({ themeSwitch }: { themeSwitch: React.ReactNode }) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { unconfirmedCount } = useTeddyCloud();
    const [navOpen, setNavOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const themeColorMetaTag = document.querySelector('meta[name="theme-color"]');
        if (themeColorMetaTag) {
            themeColorMetaTag.setAttribute("content", token.colorBgBase);
        } else {
            const meta = document.createElement("meta");
            meta.name = "theme-color";
            meta.content = token.colorBgBase;
            document.head.appendChild(meta);
        }
    }, [token.colorBgBase]);

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
        {
            key: "community",
            label: <Link to="/community">{t("community.navigationTitle")}</Link>,
            onClick: () => setNavOpen(false),
        },
    ];

    let selectedKey = location.pathname.split("/")[1];
    if (!selectedKey) selectedKey = "/";
    if (selectedKey === "home") selectedKey = "/";

    const showWarningDialogMismatchFrontendBackend = () => {
        Modal.error({
            title: t("home.error"),
            content: t("home.errorWebVersionMismatch"),
            okText: t("home.errorConfirm"),
        });
    };

    useEffect(() => {
        const checkVersionMismatch = async () => {
            const fetchIgnoreWebVersionMismatch = async () => {
                try {
                    const ignoreWebVersionMismatchResponse = await api.apiGetTeddyCloudSettingRaw(
                        "frontend.ignore_web_version_mismatch"
                    );
                    const ignoreWebVersionMismatch = (await ignoreWebVersionMismatchResponse.text()) === "true";
                    return ignoreWebVersionMismatch;
                } catch (err) {
                    console.log("Something went wrong getting ignoreWebVersionMismatch.");
                    return false;
                }
            };

            const fetchWebGitShaMatching = async () => {
                try {
                    const expectedWebGitShaResponse = await api.apiGetTeddyCloudSettingRaw(
                        "internal.version_web.git_sha"
                    );
                    const expectedWebGitSha = await expectedWebGitShaResponse.text();

                    const actualWebGitShaResponse = await fetch(
                        import.meta.env.VITE_APP_TEDDYCLOUD_API_URL + `/web/web_version.json`
                    );
                    const actualWebGitShaData = await actualWebGitShaResponse.json();
                    const actualWebGitSha = actualWebGitShaData.web_gitSha;

                    console.log("expected Web Git Sha: ", expectedWebGitSha);
                    console.log("actual Web Git Sha: ", actualWebGitSha);

                    if (expectedWebGitSha !== actualWebGitSha) {
                        showWarningDialogMismatchFrontendBackend();
                    }
                } catch (err) {
                    console.log("Something went wrong getting gitSha.");
                }
            };

            if (import.meta.env.MODE === "production") {
                const ignoreMismatch = await fetchIgnoreWebVersionMismatch();
                if (!ignoreMismatch) {
                    await fetchWebGitShaMatching();
                }
            }
        };

        checkVersionMismatch();
    }, []);

    return (
        <StyledHeaderComponent>
            <Link to="/" style={{ color: "white" }}>
                <StyledLeftPart>
                    <StyledLogo src={logoImg} />
                    <HiddenMobile style={{ textWrap: "nowrap" }}> TeddyCloud Server</HiddenMobile>
                </StyledLeftPart>
            </Link>
            <HiddenMobile>
                <Menu
                    theme="dark"
                    mode="horizontal"
                    items={mainNav}
                    selectedKeys={[selectedKey]}
                    style={{
                        width: "calc(100vw - 510px)",
                        background: "#141414 !important",
                    }}
                />
            </HiddenMobile>
            <StyledRightPart>
                <ServerStatus />
                {themeSwitch}
                <StyledLanguageSwitcher />
                <NotificationButton notificationCount={unconfirmedCount} />
                <HiddenDesktop style={{ marginLeft: 8 }}>
                    <Button
                        className="barsMenu"
                        type="primary"
                        onClick={() => setNavOpen(true)}
                        icon={<MenuOutlined />}
                    />
                    <Drawer placement="right" open={navOpen} onClose={() => setNavOpen(false)}>
                        <Menu mode="vertical" items={mainNav} selectedKeys={[selectedKey]} />
                    </Drawer>
                </HiddenDesktop>
            </StyledRightPart>
        </StyledHeaderComponent>
    );
};
