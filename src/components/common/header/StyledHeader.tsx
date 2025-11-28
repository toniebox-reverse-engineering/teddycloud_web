import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button, Drawer, Menu, MenuProps, theme } from "antd";
import { Header } from "antd/es/layout/layout";
import { MenuOutlined, PlusOutlined } from "@ant-design/icons";

import logoImg from "../../../assets/logo.png";

import { ServerStatus } from "./ServerStatus";
import { StyledLanguageSwitcher } from "./StyledLanguageSwitcher";
import { HiddenDesktop, HiddenMobile } from "../StyledComponents";
import NotificationButton from "../buttons/NotificationButton";
import { useTeddyCloud } from "../../../contexts/TeddyCloudContext";
import { HomeSubNav } from "../../home/HomeSubNav";
import { CommunitySubNav } from "../../community/CommunitySubNav";
import { SettingsSubNav } from "../../settings/SettingsSubNav";
import { ToniesSubNav } from "../../tonies/ToniesSubNav";
import { TonieboxesSubNav } from "../../tonieboxes/TonieboxesSubNav";

const { useToken } = theme;

const StyledLogo = styled.img`
    height: 32px;
`;

const StyledHeaderComponent = styled(Header)`
    color: white;
    display: flex;
    align-items: center;
    padding: 0 16px;
    background: #141414;
`;

const StyledRightPart = styled.div`
    margin-left: auto;
    display: flex;
    align-items: center;
`;

const StyledMenu = styled(Menu)`
    .ant-menu-title-content {
        width: 100%;
    }
`;

const NoHoverButton = styled(Button)`
    &:hover {
        background: transparent !important;
    }
`;

export const StyledHeader = ({ themeSwitch, themeMode }: { themeSwitch: React.ReactNode; themeMode: string }) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const location = useLocation();

    const { unconfirmedCount, navOpen, setNavOpen, subNavOpen, setSubNavOpen, currentTCSection, setCurrentTCSection } =
        useTeddyCloud();

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Responsive Detection
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Closing on desktop switch
    useEffect(() => {
        if (!isMobile) {
            setNavOpen(false);
            setSubNavOpen(false);
        }
    }, [isMobile, setNavOpen, setSubNavOpen]);

    // Theme-color meta tag sync
    useEffect(() => {
        let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
        if (!meta) {
            meta = document.createElement("meta");
            meta.name = "theme-color";
            document.head.appendChild(meta);
        }
        meta.content = token.colorBgBase;
    }, [token.colorBgBase]);

    // Scrollbar color sync
    useEffect(() => {
        const root = document.documentElement;
        if (themeMode === "matrix") {
            root.style.scrollbarColor = "#00ff00 #000000";
        } else {
            root.style.scrollbarColor = `${token.colorTextDescription} ${token.colorBgContainer}`;
        }
    }, [themeMode, token]);

    // Helper: Navigation Item
    const NavItem = useCallback(
        ({ title, to }: { title: string; to: string }) => {
            const handleClickMain = () => setNavOpen(false);
            const handleExpand = () => {
                setCurrentTCSection(title);
                if (isMobile) setSubNavOpen(true);
            };

            if (isMobile) {
                return (
                    <div
                        style={{
                            display: "flex",
                            gap: 16,
                            width: "100%",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Link to={to} onClick={handleClickMain}>
                            {title}
                        </Link>
                        <NoHoverButton
                            type="text"
                            icon={<PlusOutlined style={{ margin: 16 }} />}
                            onClick={handleExpand}
                        />
                    </div>
                );
            }

            return (
                <Link to={to} onClick={handleClickMain}>
                    {title}
                </Link>
            );
        },
        [isMobile, setCurrentTCSection, setSubNavOpen, setNavOpen]
    );

    // Main Navigation Items
    const mainNav: MenuProps["items"] = useMemo(
        () => [
            { key: "/", label: <NavItem title={t("home.navigationTitle")} to="/" /> },
            { key: "tonies", label: <NavItem title={t("tonies.navigationTitle")} to="/tonies" /> },
            { key: "tonieboxes", label: <NavItem title={t("tonieboxes.navigationTitle")} to="/tonieboxes" /> },
            { key: "settings", label: <NavItem title={t("settings.navigationTitle")} to="/settings" /> },
            { key: "community", label: <NavItem title={t("community.navigationTitle")} to="/community" /> },
        ],
        [NavItem, t]
    );

    // Get selected navigation key
    const selectedKey = useMemo(() => {
        const part = location.pathname.split("/")[1];
        return !part || part === "home" ? "/" : part;
    }, [location.pathname]);

    // Render sub nav
    const renderSubNav = () => {
        switch (currentTCSection) {
            case t("community.navigationTitle"):
                return <CommunitySubNav />;
            case t("settings.navigationTitle"):
                return <SettingsSubNav />;
            case t("tonies.navigationTitle"):
                return <ToniesSubNav />;
            case t("tonieboxes.navigationTitle"):
                return <TonieboxesSubNav />;
            default:
                return <HomeSubNav />;
        }
    };

    return (
        <StyledHeaderComponent id="teddycloud-header">
            <Link to="/" style={{ color: "white", display: "flex", alignItems: "center", marginRight: 16 }}>
                <StyledLogo className="teddycloud-logo" src={logoImg} />
                <HiddenMobile style={{ textWrap: "nowrap" }}> TeddyCloud</HiddenMobile>
            </Link>

            <HiddenMobile>
                <Menu
                    theme="dark"
                    mode="horizontal"
                    items={mainNav}
                    selectedKeys={[selectedKey]}
                    style={{ width: "calc(100vw - 510px)" }}
                />
            </HiddenMobile>

            <StyledRightPart>
                <ServerStatus />
                {themeSwitch}
                <StyledLanguageSwitcher />
                <NotificationButton notificationCount={unconfirmedCount} />

                <HiddenDesktop style={{ marginLeft: 8 }}>
                    <Button type="primary" icon={<MenuOutlined />} onClick={() => setNavOpen(true)} />

                    <Drawer placement="right" open={navOpen} onClose={() => setNavOpen(false)} title="TeddyCloud">
                        <StyledMenu
                            mode="vertical"
                            items={mainNav}
                            selectedKeys={[selectedKey]}
                            style={{ background: "transparent", borderRight: "none" }}
                        />

                        <Drawer
                            placement="right"
                            open={subNavOpen}
                            onClose={() => setSubNavOpen(false)}
                            title={currentTCSection}
                        >
                            {renderSubNav()}
                        </Drawer>
                    </Drawer>
                </HiddenDesktop>
            </StyledRightPart>
        </StyledHeaderComponent>
    );
};
