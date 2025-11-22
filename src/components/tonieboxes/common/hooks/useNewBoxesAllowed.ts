import { useEffect, useState } from "react";
import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { useTranslation } from "react-i18next";
import { useTeddyCloud } from "../../../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

export const useNewBoxesAllowed = () => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();
    const [value, setValue] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const result = await api.apiGetNewBoxesAllowed();
                setValue(result);
            } catch (error) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("settings.errorFetchingSetting"),
                    t("settings.errorFetchingSettingDetails", { setting: "core.allowNewBox" }) + error,
                    t("tonieboxes.navigationTitle")
                );
            }
        };

        fetch();
    }, []);

    return value;
};
