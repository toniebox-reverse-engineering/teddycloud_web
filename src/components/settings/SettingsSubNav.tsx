import { MenuProps } from "antd";
import { SafetyCertificateOutlined, SettingOutlined, PoweroffOutlined, FileSearchOutlined } from "@ant-design/icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { StyledSubMenu } from "../StyledComponents";
import { restartServer } from "../../util/restartServer";

export const SettingsSubNav = () => {
    const { t } = useTranslation();

    const handleRestartServer = async () => {
        await restartServer(true);
    };

    const subnav: MenuProps["items"] = [
        {
            key: "general",
            label: <Link to="/settings">{t("settings.general.navigationTitle")}</Link>,
            icon: React.createElement(SettingOutlined),
        },
        {
            key: "certificates",
            label: <Link to="/settings/certificates">{t("settings.certificates.navigationTitle")}</Link>,
            icon: React.createElement(SafetyCertificateOutlined),
        },
        {
            key: "rtnl",
            label: <Link to="/settings/rtnl">{t("settings.rtnl.navigationTitle")}</Link>,
            icon: React.createElement(FileSearchOutlined),
        },
        {
            key: "restart_server",
            label: <label onClick={handleRestartServer}>{t("settings.restartServer")}</label>,
            icon: React.createElement(PoweroffOutlined),
        },
    ];

    return (
        <>
            <StyledSubMenu
                mode="inline"
                //defaultSelectedKeys={["1"]}
                defaultOpenKeys={["sub"]}
                items={subnav}
            />
        </>
    );
};
