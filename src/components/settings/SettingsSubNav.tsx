import { MenuProps, message } from "antd";
import {
    SafetyCertificateOutlined,
    SettingOutlined,
    PoweroffOutlined,
    FileSearchOutlined,
    SyncOutlined,
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

    const handleUpdateToniesJson = async () => {
        try {
            const response = await api.apiGetTeddyCloudApiRaw("/api/toniesJsonUpdate");
            const data = await response.text();
            setSelectedKey("");

            if (data.toString() !== "Triggered tonies.json update") {
                messageApi.open({
                    type: "error",
                    content: t("settings.tonieJsonUpdateFailed"),
                });
            } else {
                messageApi.open({
                    type: "success",
                    content: t("settings.tonieJsonUpdateTriggered"),
                });
            }
        } catch (error) {
            messageApi.open({
                type: "error",
                content: t("settings.tonieJsonUpdateFailed"),
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
            key: "update_toniesJson",
            label: <label style={{ cursor: "pointer" }}>{t("settings.updateToniesJson")}</label>,
            onClick: handleUpdateToniesJson,
            icon: React.createElement(SyncOutlined),
            title: t("settings.updateToniesJson"),
        },
        {
            key: "restart_server",
            label: <label style={{ cursor: "pointer" }}>{t("settings.restartServer")}</label>,
            onClick: handleRestartServer,
            icon: React.createElement(PoweroffOutlined),
            title: t("settings.restartServer"),
        },
    ];

    return (
        <>
            {contextHolder}
            <StyledSubMenu mode="inline" selectedKeys={[selectedKey]} defaultOpenKeys={["sub"]} items={subnav} />
        </>
    );
};
