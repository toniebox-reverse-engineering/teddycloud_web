import { MenuProps } from "antd";
import {
    LikeOutlined,
    CommentOutlined,
    DeploymentUnitOutlined,
    FireOutlined,
    BranchesOutlined,
    FileTextOutlined,
    QuestionCircleOutlined,
} from "@ant-design/icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { StyledSubMenu } from "../StyledComponents";

export const CommunitySubNav = () => {
    const { t } = useTranslation();

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
                <Link to="/community/contribution" style={{ color: "currentColor" }}>
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
                <Link to="https://forum.revvox.de/" target="_blank">
                    {t("community.forum.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(CommentOutlined),
            title: t("community.forum.navigationTitle"),
        },
    ];

    return <StyledSubMenu mode="inline" defaultOpenKeys={["sub"]} items={subnav} />;
};
