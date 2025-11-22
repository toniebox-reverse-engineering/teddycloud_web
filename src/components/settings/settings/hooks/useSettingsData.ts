import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TeddyCloudApi, OptionsList } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import SettingsDataHandler from "../../../../data/SettingsDataHandler";
import { useTeddyCloud } from "../../../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

export const useSettingsData = () => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();

    const [options, setOptions] = useState<OptionsList | undefined>();
    const [settingsLevel, setSettingsLevel] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettingsLevel = async () => {
            try {
                const response = await api.apiGetTeddyCloudSettingRaw("core.settings_level");

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setSettingsLevel(data.toString());
            } catch (error) {
                console.error("Error fetching settings level: ", error);
            }
        };

        fetchSettingsLevel();
    }, []);

    useEffect(() => {
        if (!settingsLevel) return;

        const fetchOptions = async () => {
            setLoading(true);
            try {
                const optionsRequest = (await api.apiGetIndexGet("")) as OptionsList;
                if (optionsRequest?.options?.length && optionsRequest.options.length > 0) {
                    setOptions(optionsRequest);
                    SettingsDataHandler.getInstance().initializeSettings(optionsRequest.options, undefined);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();
    }, [settingsLevel]);

    const triggerWriteConfig = useCallback(async () => {
        try {
            await api.apiTriggerWriteConfigGet();
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("settings.errorWhileSavingConfig"),
                t("settings.errorWhileSavingConfigDetails") + error,
                t("tonieboxes.navigationTitle")
            );
        }
    }, [addNotification, t]);

    const handleChangeSettingsLevel = useCallback(
        async (value: string) => {
            try {
                await api.apiPostTeddyCloudSetting("core.settings_level", value);
                await triggerWriteConfig();
                setSettingsLevel(value);
            } catch (e) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("settings.errorWhileSavingConfig"),
                    t("settings.errorWhileSavingConfigDetails") + e,
                    t("tonieboxes.navigationTitle")
                );
            }
        },
        [addNotification, t, triggerWriteConfig]
    );

    return {
        options,
        settingsLevel,
        loading,
        handleChangeSettingsLevel,
    };
};
