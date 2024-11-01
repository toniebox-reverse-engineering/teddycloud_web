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
} from "@ant-design/icons";

import { forumUrl } from "../../constants";

import { StyledSubMenu } from "../StyledComponents";

export const CommunitySubNav = () => {
    const { t } = useTranslation();
    const [openKeys, setOpenKeys] = useState<string[]>([]);

    const updateOpenKeys = (pathname: string) => {
        const newKeys: string[] = [];
        if (pathname.includes("/contribution")) {
            newKeys.push("contribution");
        }
        setOpenKeys((prevKeys) => Array.from(new Set([...prevKeys, ...newKeys])));
    };

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

    const subnav: MenuProps["items"] = [
        {
            key: "community",
            label: <Link to="/community">{t("community.navigationTitle")}</Link>,
            icon: React.createElement(LikeOutlined),
            title: t("community.navigationTitle"),
        },
        {
            key: "faq",
            label: <Link to="/community/faq">{t("community.faq.navigationTitle")}</Link>,
            icon: React.createElement(QuestionCircleOutlined),
            title: t("community.faq.navigationTitle"),
        },
        {
            key: "contribution",
            label: (
                <Link
                    to="/community/contribution"
                    style={{ color: "currentColor", display: "flex", alignItems: "center", padding: "0 50px 0 0" }}
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
                        <Link to="/community/contribution/tonies-json">
                            {t("community.contribution.toniesJson.navigationTitle")}
                        </Link>
                    ),
                    icon: React.createElement(FileTextOutlined),
                    title: t("community.contribution.toniesJson.navigationTitle"),
                },
                {
                    key: "translation",
                    label: (
                        <Link to="/community/contribution/translations">
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
            label: <Link to="/community/contributors">{t("community.contributors.navigationTitle")}</Link>,
            icon: React.createElement(FireOutlined),
            title: t("community.contributors.navigationTitle"),
        },
        {
            key: "changelog",
            label: <Link to="/community/changelog">{t("community.changelog.navigationTitle")}</Link>,
            icon: React.createElement(BranchesOutlined),
            title: t("community.changelog.navigationTitle"),
        },
        {
            key: "Forum",
            label: (
                <Link to={forumUrl} target="_blank">
                    {t("community.forum.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(CommentOutlined),
            title: t("community.forum.navigationTitle"),
        },
    ];

    return (
        <StyledSubMenu
            mode="inline"
            defaultOpenKeys={["sub"]}
            openKeys={openKeys}
            selectedKeys={[]}
            onOpenChange={onOpenChange}
            items={subnav}
        />
    );
};
