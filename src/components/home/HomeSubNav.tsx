import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MenuProps } from "antd";
import { CodeSandboxOutlined, ContainerOutlined, HeartOutlined, HomeOutlined, WifiOutlined } from "@ant-design/icons";
import i18n from "../../i18n";

import { useTeddyCloud } from "../../TeddyCloudContext";
import { StyledSubMenu } from "../StyledComponents";
import { gitHubSponsoringUrl } from "../../constants";
import { TeddyCloudSection } from "../../types/pluginsMetaTypes";

export const HomeSubNav = () => {
    const { t } = useTranslation();
    const { setNavOpen, setSubNavOpen, setCurrentTCSection, plugins } = useTeddyCloud();
    const currentLanguage = i18n.language;

    useEffect(() => {
        setCurrentTCSection(t("home.navigationTitle"));
    }, [currentLanguage]);

    const pluginItems = plugins
        .filter((p) => p.teddyCloudSection === TeddyCloudSection.Home)
        .map((plugin) => ({
            key: `plugin-${plugin.pluginId}`,
            label: (
                <Link
                    to={`/home/plugin/${plugin.pluginId}`}
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {plugin.pluginName}
                </Link>
            ),
            icon: React.createElement(CodeSandboxOutlined),
            title: plugin.pluginName,
        }));

    const subnav: MenuProps["items"] = [
        {
            key: "home",
            label: (
                <Link
                    to="/"
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {t("home.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(HomeOutlined),
            title: t("home.navigationTitle"),
        },
        {
            key: "features",
            label: (
                <Link
                    to="/home/features"
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {t("home.features.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(ContainerOutlined),
            title: t("home.features.navigationTitle"),
        },
        {
            key: "statistics",
            label: (
                <Link
                    to="/home/stats"
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {t("home.stats.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(WifiOutlined),
            title: t("home.stats.navigationTitle"),
        },
        {
            key: "sponsor",
            label: (
                <Link
                    to={gitHubSponsoringUrl}
                    target="_blank"
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {t("home.sponsor.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(HeartOutlined),
            title: t("home.sponsor.navigationTitle"),
        },
        ...pluginItems,
        {
            key: "hiddenMeeting",
            label: (
                <Link
                    to="/home/tonieMeeting"
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                ></Link>
            ),
        },
    ];

    return <StyledSubMenu mode="inline" selectedKeys={[]} defaultOpenKeys={["sub"]} items={subnav} />;
};
