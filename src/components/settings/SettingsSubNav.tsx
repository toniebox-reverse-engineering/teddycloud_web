import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MenuProps } from "antd";
import {
    SafetyCertificateOutlined,
    SettingOutlined,
    PoweroffOutlined,
    FileSearchOutlined,
    SyncOutlined,
    HistoryOutlined,
    BellOutlined,
} from "@ant-design/icons";

import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

import { StyledSubMenu } from "../StyledComponents";
import { restartServer } from "../../utils/restartServer";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

export const SettingsSubNav = () => {
    const { t } = useTranslation();
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();
    const [selectedKey, setSelectedKey] = useState("");

    const extractBaseUrl = (fullUrl: URL) => {
        const url = new URL(fullUrl);
        const port = url.port ? `:${url.port}` : "";
        return `${url.protocol}//${url.hostname}${port}`;
    };

    const handleRestartServer = async () => {
        await restartServer(true, addNotification, addLoadingNotification, closeLoadingNotification);
        setSelectedKey("");
    };

    const handleReloadToniesJson = async () => {
        const key = "reloadToniesJson";
        addLoadingNotification(key, t("settings.toniesJsonReload"), t("settings.toniesJsonReloadInProgress"));

        try {
            const response = await api.apiGetTeddyCloudApiRaw("/api/toniesJsonReload");
            const data = await response.text();
            setSelectedKey("");

            closeLoadingNotification(key);
            if (data.toString() !== "OK") {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("settings.toniesJsonReloadFailed"),
                    t("settings.toniesJsonReloadFailed") + ": " + data.toString(),
                    t("settings.navigationTitle")
                );
            } else {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("settings.toniesJsonReloadSuccessful"),
                    t("settings.toniesJsonReloadSuccessful"),
                    t("settings.navigationTitle")
                );
            }
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("settings.toniesJsonReloadFailed"),
                t("settings.toniesJsonReloadFailed") + ": " + error,
                t("settings.navigationTitle")
            );
        }
    };

    const subnav: MenuProps["items"] = [
        {
            key: "general",
            label: <Link to="/settings">{t("settings.general.navigationTitle")}</Link>,
            icon: React.createElement(SettingOutlined),
            title: t("settings.general.navigationTitle"),
        },
        {
            key: "certificates",
            label: <Link to="/settings/certificates">{t("settings.certificates.navigationTitle")}</Link>,
            icon: React.createElement(SafetyCertificateOutlined),
            title: t("settings.certificates.navigationTitle"),
        },
        {
            key: "rtnl",
            label: <Link to="/settings/rtnl">{t("settings.rtnl.navigationTitle")}</Link>,
            icon: React.createElement(FileSearchOutlined),
            title: t("settings.rtnl.navigationTitle"),
        },
        {
            key: "notifications",
            label: <Link to="/settings/notifications">{t("settings.notifications.navigationTitle")}</Link>,
            icon: React.createElement(BellOutlined),
            title: t("settings.notifications.navigationTitle"),
        },
        {
            key: "reload_toniesJson",
            label: <label style={{ cursor: "pointer" }}>{t("settings.toniesJsonReload")}</label>,
            onClick: handleReloadToniesJson,
            icon: React.createElement(SyncOutlined),
            title: t("settings.toniesJsonReload"),
        },
        {
            key: "restart_server",
            label: <label style={{ cursor: "pointer" }}>{t("settings.restartServer")}</label>,
            onClick: handleRestartServer,
            icon: React.createElement(PoweroffOutlined),
            title: t("settings.restartServer"),
        },
        {
            key: "legacy",
            label: (
                <Link to={`${extractBaseUrl(new URL(window.location.href))}/legacy.html`} target="_blank">
                    {t("settings.legacyGui")}
                </Link>
            ),
            icon: React.createElement(HistoryOutlined),
            title: t("settings.legacyGui"),
        },
    ];

    return (
        <>
            <StyledSubMenu mode="inline" selectedKeys={[selectedKey]} defaultOpenKeys={["sub"]} items={subnav} />
        </>
    );
};
