import { useTranslation } from "react-i18next";
import { BoxineApi, TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";

const apiTC = new TeddyCloudApi(defaultAPIConfig());
const api = new BoxineApi(defaultAPIConfig());

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const restartServer = async (
    redirectToBase = true,
    addNotification: Function,
    addLoadingNotification: Function,
    closeLoadingNotification: Function
) => {
    const { t } = useTranslation();
    const key = "restart-tc";
    addLoadingNotification(key, t("settings.restartTC"), t("settings.tryToRestartTC"));

    try {
        const response = await apiTC.apiGetTeddyCloudApiRaw(`/api/triggerRestart`);
        const data = await response.text();

        if (data.toString() !== "OK") {
            closeLoadingNotification(key);
            addNotification(
                NotificationTypeEnum.Error,
                t("settings.restartFailed"),
                t("settings.restartFailed") + ": " + data.toString(),
                t("settings.navigationTitle")
            );
            return;
        }
    } catch (error) {
        closeLoadingNotification(key);
        addNotification(
            NotificationTypeEnum.Error,
            t("settings.restartFailed"),
            t("settings.restartFailed") + ": " + error,
            t("settings.navigationTitle")
        );
        return;
    }

    addLoadingNotification(key, t("settings.restartTC"), t("settings.restartInProgress"));

    // Wait 3 seconds before starting to poll
    await sleep(3000);

    let attempts = 0;

    while (attempts < 10) {
        try {
            const timeRequest = (await api.v1TimeGet()) as string;

            if (timeRequest.length === 10) {
                closeLoadingNotification(key);
                addNotification(
                    NotificationTypeEnum.Success,
                    t("settings.restartComplete"),
                    t("settings.restartComplete"),
                    t("settings.navigationTitle")
                );

                if (redirectToBase) {
                    window.location.href = `${import.meta.env.VITE_APP_TEDDYCLOUD_WEB_BASE}`;
                }
                return;
            }
        } catch (e) {
            // Increment attempts and wait for 3 seconds
            attempts++;
            await sleep(3000);
        }
    }

    closeLoadingNotification(key);
    addNotification(
        NotificationTypeEnum.Error,
        t("settings.restartFailed"),
        t("settings.restartFailed"),
        t("settings.navigationTitle")
    );
};
