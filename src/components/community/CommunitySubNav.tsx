import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MenuProps } from "antd";
import {
    LikeOutlined,
    CommentOutlined,
    DeploymentUnitOutlined,
    FireOutlined,
    BranchesOutlined,
    FileTextOutlined,
    QuestionCircleOutlined,
    GlobalOutlined,
    MinusOutlined,
    PlusOutlined,
    AppstoreOutlined,
    QuestionOutlined,
} from "@ant-design/icons";
import { useTeddyCloud } from "../../TeddyCloudContext";

import { forumUrl } from "../../constants";

import { StyledSubMenu } from "../common/StyledComponents";
import i18n from "../../i18n";
import { TeddyCloudSection } from "../../types/pluginsMetaTypes";

export const CommunitySubNav = () => {
    const { t } = useTranslation();
    const { setNavOpen, setSubNavOpen, setCurrentTCSection } = useTeddyCloud();
    const currentLanguage = i18n.language;
    const [openKeys, setOpenKeys] = useState<string[]>([]);

    useEffect(() => {
        setCurrentTCSection(t("community.navigationTitle"));
    }, [currentLanguage]);

    const updateOpenKeys = (pathname: string) => {
        const newKeys: string[] = [];
        if (pathname.includes("/contribution")) {
            newKeys.push("contribution");
        }
        if (pathname.includes("/tcplugins")) {
            newKeys.push("tcplugins");
        }
        setOpenKeys((prevKeys) => Array.from(new Set([...prevKeys, ...newKeys])));
    };

    const { plugins } = useTeddyCloud();

    const pluginItems = plugins.map((plugin) => ({
        key: `tcplugins-${plugin.pluginId}`,
        label: (
            <Link
                to={`/community/tcplugins/${plugin.pluginId}`}
                onClick={() => {
                    setNavOpen(false);
                    setSubNavOpen(false);
                }}
            >
                {plugin.pluginName}
            </Link>
        ),
        icon: React.createElement(plugin.icon),
        title: plugin.pluginName,
    }));

    const filteredPluginItems = plugins
        .filter((p) => p.teddyCloudSection === TeddyCloudSection.Community)
        .map((plugin) => ({
            key: `plugin-${plugin.pluginId}`,
            label: (
                <Link
                    to={`/community/plugin/${plugin.pluginId}`}
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {plugin.pluginName}
                </Link>
            ),
            icon: React.createElement(plugin.icon),
            title: plugin.pluginName,
        }));

    useEffect(() => {
        updateOpenKeys(location.pathname);
    }, [location.pathname]);

    const onOpenChange = (keys: string[]) => {
        const latestOpenKey = keys.find((key) => !openKeys.includes(key));
        const latestCloseKey = openKeys.find((key) => !keys.includes(key));

        if (latestOpenKey) {
            setOpenKeys((prevKeys) => [...prevKeys, latestOpenKey]);
        } else if (latestCloseKey) {
            setOpenKeys((prevKeys) => prevKeys.filter((key) => key !== latestCloseKey));
        }
    };
    const customExpandIcon = ({ isOpen }: { isOpen?: boolean }) => {
        const isExpanded = isOpen ?? false;
        return isExpanded ? (
            <MinusOutlined style={{ margin: "16px 0 16px 16px" }} />
        ) : (
            <PlusOutlined style={{ margin: "16px 0 16px 16px" }} />
        );
    };

    const subnav: MenuProps["items"] = [
        {
            key: "community",
            label: (
                <Link
                    to="/community"
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {t("community.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(LikeOutlined),
            title: t("community.navigationTitle"),
        },
        {
            key: "tcplugins",
            label: (
                <Link
                    to="/community/tcplugins"
                    style={{ color: "currentColor", display: "flex", alignItems: "center", padding: "0 50px 0 0" }}
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {t("community.plugins.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(AppstoreOutlined),
            title: t("community.plugins.navigationTitle"),
            children: pluginItems,
        },
        {
            key: "request",
            label: (
                <Link
                    to="/community/supportrequestguide"
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {t("community.supportRequestGuide.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(QuestionOutlined),
            title: t("community.supportRequestGuide.navigationTitle"),
        },
        {
            key: "faq",
            label: (
                <Link
                    to="/community/faq"
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {t("community.faq.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(QuestionCircleOutlined),
            title: t("community.faq.navigationTitle"),
        },
        {
            key: "contribution",
            label: (
                <Link
                    to="/community/contribution"
                    style={{ color: "currentColor", display: "flex", alignItems: "center", padding: "0 50px 0 0" }}
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {t("community.contribution.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(DeploymentUnitOutlined),
            title: t("community.contribution.navigationTitle"),
            children: [
                {
                    key: "toniesJson",
                    label: (
                        <Link
                            to="/community/contribution/tonies-json"
                            onClick={() => {
                                setNavOpen(false);
                                setSubNavOpen(false);
                            }}
                        >
                            {t("community.contribution.toniesJson.navigationTitle")}
                        </Link>
                    ),
                    icon: React.createElement(FileTextOutlined),
                    title: t("community.contribution.toniesJson.navigationTitle"),
                },
                {
                    key: "translation",
                    label: (
                        <Link
                            to="/community/contribution/translations"
                            onClick={() => {
                                setNavOpen(false);
                                setSubNavOpen(false);
                            }}
                        >
                            {t("community.translations.navigationTitle")}
                        </Link>
                    ),
                    icon: React.createElement(GlobalOutlined),
                    title: t("community.translations.navigationTitle"),
                },
            ],
        },
        {
            key: "contributors",
            label: (
                <Link
                    to="/community/contributors"
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {t("community.contributors.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(FireOutlined),
            title: t("community.contributors.navigationTitle"),
        },
        {
            key: "changelog",
            label: (
                <Link
                    to="/community/changelog"
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {t("community.changelog.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(BranchesOutlined),
            title: t("community.changelog.navigationTitle"),
        },
        {
            key: "Forum",
            label: (
                <Link
                    to={forumUrl}
                    target="_blank"
                    onClick={() => {
                        setNavOpen(false);
                        setSubNavOpen(false);
                    }}
                >
                    {t("community.forum.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(CommentOutlined),
            title: t("community.forum.navigationTitle"),
        },
        ...filteredPluginItems,
    ];

    return (
        <StyledSubMenu
            mode="inline"
            defaultOpenKeys={["sub"]}
            openKeys={openKeys}
            selectedKeys={[]}
            onOpenChange={onOpenChange}
            items={subnav}
            expandIcon={({ isOpen }) => customExpandIcon({ isOpen })}
        />
    );
};
