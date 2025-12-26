import { useEffect, useState } from "react";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { useTranslation } from "react-i18next";
import { useTeddyCloud } from "../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

export const useNewBoxesAllowed = () => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();

    const [value, setValue] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const response = await api.apiGetTeddyCloudSettingRaw("core.allowNewBox");
                const result = (await response.text()) === "true";
                setValue(result);
            } catch (error) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("settings.errorFetchingSetting"),
                    t("settings.errorFetchingSettingDetails", { setting: "core.allowNewBox" }) + error,
                    t("tonieboxes.navigationTitle")
                );
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    return { value, loading };
};
