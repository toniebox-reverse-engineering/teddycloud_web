import { MenuProps } from "antd";
import { HomeOutlined } from "@ant-design/icons";
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
        },
        {
            key: "statistics",
            label: <Link to="/home/stats">{t("home.stats.navigationTitle")}</Link>,
            icon: React.createElement(WifiOutlined),
        },
        {
            key: "hiddenMeeting",
            label: <Link to="/home/tonieMeeting"></Link>,
        },
    ];

    return (
        <StyledSubMenu
            mode="inline"
            //defaultSelectedKeys={["1"]}
            defaultOpenKeys={["sub"]}
            items={subnav}
        />
    );
};
