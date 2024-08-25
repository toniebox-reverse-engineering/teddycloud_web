import { MenuProps } from "antd";
import { ContainerOutlined, HomeOutlined } from "@ant-design/icons";
import { WifiOutlined } from "@ant-design/icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { StyledSubMenu } from "../StyledComponents";

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
            key: "hiddenMeeting",
            label: <Link to="/home/tonieMeeting"></Link>,
        },
    ];

    return <StyledSubMenu mode="inline" defaultOpenKeys={["sub"]} items={subnav} />;
};
