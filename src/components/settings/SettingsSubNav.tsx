import { MenuProps, message } from "antd";
import { SafetyCertificateOutlined, SettingOutlined, PoweroffOutlined } from "@ant-design/icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { StyledSubMenu } from "../StyledComponents";
import { BoxineApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

const api = new BoxineApi(defaultAPIConfig());

export const SettingsSubNav = () => {
    const { t } = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();

    const restartServer = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/triggerRestart`);
            const data = await response.text();

            if (data.toString() !== "OK") {
                message.error(t("settings.restartFailed"));
                return;
            }
        } catch (error) {
            message.error(t("settings.restartFailed"));
            return;
        }

        messageApi.open({
            type: "loading",
            content: t("settings.restartInProgress"),
            duration: 0,
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));

        let attempts = 0;
        while (attempts < 10) {
            try {
                const timeRequest = (await api.v1TimeGet()) as String;
                if (timeRequest.length === 10) {
                    messageApi.destroy();
                    messageApi.open({
                        type: "success",
                        content: t("settings.restartComplete"),
                    });
                    window.location.href = `${process.env.REACT_APP_TEDDYCLOUD_WEB_BASE}`;
                    return;
                }
            } catch (e) {
                // Increment attempts and wait for 3 seconds
                attempts++;
                await new Promise((resolve) => setTimeout(resolve, 3000));
            }
        }
        messageApi.destroy();
        messageApi.open({
            type: "error",
            content: t("settings.restartFailed"),
        });
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
            key: "restart_server",
            label: <label onClick={restartServer}>{t("settings.restartServer")}</label>,
            icon: React.createElement(PoweroffOutlined),
        },
    ];

    return (
        <>
            {contextHolder}
            <StyledSubMenu
                mode="inline"
                //defaultSelectedKeys={["1"]}
                defaultOpenKeys={["sub"]}
                items={subnav}
            />
        </>
    );
};
