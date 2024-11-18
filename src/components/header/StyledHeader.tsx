import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button, Drawer, Menu, MenuProps, Modal, theme } from "antd";
import { Header } from "antd/es/layout/layout";
import { MenuOutlined, PlusOutlined } from "@ant-design/icons";

import logoImg from "../../assets/logo.png";

import { ServerStatus } from "./ServerStatus";
import { StyledLanguageSwitcher } from "./StyledLanguageSwitcher";
import { HiddenDesktop, HiddenMobile } from "../StyledComponents";
import NotificationButton from "../utils/NotificationButton";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { HomeSubNav } from "../home/HomeSubNav";
import { CommunitySubNav } from "../community/CommunitySubNav";
import { SettingsSubNav } from "../settings/SettingsSubNav";
import { ToniesSubNav } from "../tonies/ToniesSubNav";
import { TonieboxesSubNav } from "../tonieboxes/TonieboxesSubNav";

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
export const StyledHeader = ({ themeSwitch }: { themeSwitch: React.ReactNode }) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { unconfirmedCount, navOpen, setNavOpen, subNavOpen, setSubNavOpen, currentTCSection, setCurrentTCSection } =
        useTeddyCloud();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

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

    const NavItem = ({ title, to, isMobile = false }: { title: string; to: string; isMobile?: boolean }) => {
        const handleLinkClick = () => {
            setNavOpen(false); // Use the function directly from the parent
        };

        const handleButtonClick = () => {
            setCurrentTCSection(title); // Use the function directly from the parent
            if (isMobile) {
                setSubNavOpen(true); // Use the function directly from the parent
            }
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
                    <Link to={to} onClick={handleLinkClick}>
                        {title}
                    </Link>
                    <NoHoverButton
                        type="text"
                        style={{ width: "100%", justifyContent: "end" }}
                        icon={<PlusOutlined style={{ margin: 16 }} />}
                        onClick={handleButtonClick}
                    />
                </div>
            );
        }

        return (
            <Link to={to} onClick={handleLinkClick}>
                {title}
            </Link>
        );
    };

    const mainNav: MenuProps["items"] = [
        {
            key: "/",
            label: <NavItem title={t("home.navigationTitle")} to="/" isMobile={isMobile} />,
        },
        {
            key: "tonies",
            label: <NavItem title={t("tonies.navigationTitle")} to="/tonies" isMobile={isMobile} />,
        },
        {
            key: "tonieboxes",
            label: <NavItem title={t("tonieboxes.navigationTitle")} to="/tonieboxes" isMobile={isMobile} />,
        },
        {
            key: "settings",
            label: <NavItem title={t("settings.navigationTitle")} to="/settings" isMobile={isMobile} />,
        },
        {
            key: "community",
            label: <NavItem title={t("community.navigationTitle")} to="/community" isMobile={isMobile} />,
        },
    ];

    let selectedKey = location.pathname.split("/")[1];
    if (!selectedKey) selectedKey = "/";
    if (selectedKey === "home") selectedKey = "/";

    const renderSubNav = () => {
        if (currentTCSection === t("community.navigationTitle")) {
            return <CommunitySubNav />;
        }
        if (currentTCSection === t("settings.navigationTitle")) {
            return <SettingsSubNav />;
        }
        if (currentTCSection === t("tonies.navigationTitle")) {
            return <ToniesSubNav />;
        }
        if (currentTCSection === t("tonieboxes.navigationTitle")) {
            return <TonieboxesSubNav />;
        }
        return <HomeSubNav />;
    };

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
                    <Drawer placement="right" open={navOpen} onClose={() => setNavOpen(false)} title="TeddyCloud">
                        <StyledMenu mode="vertical" items={mainNav} selectedKeys={[selectedKey]} />
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
