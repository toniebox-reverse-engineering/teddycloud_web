import { MenuProps, message } from "antd";
import {
    SafetyCertificateOutlined,
    SettingOutlined,
    PoweroffOutlined,
    FileSearchOutlined,
    SyncOutlined,
    HistoryOutlined,
} from "@ant-design/icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { StyledSubMenu } from "../StyledComponents";
import { restartServer } from "../../utils/restartServer";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export const SettingsSubNav = () => {
    const { t } = useTranslation();
    const [selectedKey, setSelectedKey] = useState("");
    const [messageApi, contextHolder] = message.useMessage();
    const handleRestartServer = async () => {
        await restartServer(true);
        setSelectedKey("");
    };

    const extractBaseUrl = (fullUrl: URL) => {
        const url = new URL(fullUrl);
        const port = url.port ? `:${url.port}` : "";
        return `${url.protocol}//${url.hostname}${port}`;
    };

    const handleReloadToniesJson = async () => {
        const hideLoading = message.loading(t("settings.toniesJsonReloadInProgress"), 0);

        try {
            const response = await api.apiGetTeddyCloudApiRaw("/api/toniesJsonReload");
            const data = await response.text();
            setSelectedKey("");

            if (data.toString() !== "OK") {
                hideLoading();
                messageApi.open({
                    type: "error",
                    content: t("settings.toniesJsonReloadFailed"),
                });
            } else {
                hideLoading();
                messageApi.open({
                    type: "success",
                    content: t("settings.toniesJsonReloadSuccessful"),
                });
            }
        } catch (error) {
            hideLoading();
            messageApi.open({
                type: "error",
                content: t("settings.toniesJsonReloadFailed"),
            });
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
            {contextHolder}
            <StyledSubMenu mode="inline" selectedKeys={[selectedKey]} defaultOpenKeys={["sub"]} items={subnav} />
        </>
    );
};
