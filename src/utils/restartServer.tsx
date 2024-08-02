import { message } from "antd";
import { t } from "i18next";
import { BoxineApi } from "../api";
import { defaultAPIConfig } from "../config/defaultApiConfig";
import { TeddyCloudApi } from "../api";

const apiTC = new TeddyCloudApi(defaultAPIConfig());

const api = new BoxineApi(defaultAPIConfig());

export const restartServer = async (redirectToBase = true) => {
    try {
        const response = await apiTC.apiGetTeddyCloudApiRaw(`/api/triggerRestart`);
        const data = await response.text();

        if (data.toString() !== "OK") {
            message.error(t("settings.restartFailed"));
            return;
        }
    } catch (error) {
        message.error(t("settings.restartFailed"));
        return;
    }

    const hideLoading = message.loading(t("settings.restartInProgress"), 0);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    let attempts = 0;
    while (attempts < 10) {
        try {
            const timeRequest = (await api.v1TimeGet()) as String;
            if (timeRequest.length === 10) {
                hideLoading();
                message.success(t("settings.restartComplete"));
                if (redirectToBase) {
                    window.location.href = `${process.env.REACT_APP_TEDDYCLOUD_WEB_BASE}`;
                }
                return;
            }
        } catch (e) {
            // Increment attempts and wait for 3 seconds
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 3000));
        }
    }
    hideLoading();
    message.error(t("settings.restartFailed"));
};
