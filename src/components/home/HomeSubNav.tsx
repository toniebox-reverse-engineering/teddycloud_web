import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MenuProps } from "antd";
import { ContainerOutlined, HeartOutlined, HomeOutlined, WifiOutlined } from "@ant-design/icons";

import { StyledSubMenu } from "../StyledComponents";
import { gitHubSponsoringUrl } from "../../constants";

export const HomeSubNav = () => {
    const { t } = useTranslation();

    const subnav: MenuProps["items"] = [
        {
            key: "home",
            label: <Link to="/">{t("home.navigationTitle")}</Link>,
            icon: React.createElement(HomeOutlined),
            title: t("home.navigationTitle"),
        },
        {
            key: "features",
            label: <Link to="/home/features">{t("home.features.navigationTitle")}</Link>,
            icon: React.createElement(ContainerOutlined),
            title: t("home.features.navigationTitle"),
        },
        {
            key: "statistics",
            label: <Link to="/home/stats">{t("home.stats.navigationTitle")}</Link>,
            icon: React.createElement(WifiOutlined),
            title: t("home.stats.navigationTitle"),
        },
        {
            key: "sponsor",
            label: (
                <Link to={gitHubSponsoringUrl} target="_blank">
                    {t("home.sponsor.navigationTitle")}
                </Link>
            ),
            icon: React.createElement(HeartOutlined),
            title: t("home.sponsor.navigationTitle"),
        },
        {
            key: "hiddenMeeting",
            label: <Link to="/home/tonieMeeting"></Link>,
        },
    ];

    return <StyledSubMenu mode="inline" selectedKeys={[]} defaultOpenKeys={["sub"]} items={subnav} />;
};
