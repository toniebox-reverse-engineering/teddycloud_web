import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";

type LocalSettings = Record<string, unknown>;

const api = new TeddyCloudApi(defaultAPIConfig());

export const useGuiLocalSettings = () => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();

    const [localSettings, setLocalSettings] = useState<LocalSettings>({});

    const loadLocalSettings = useCallback(() => {
        const entries: LocalSettings = {};

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            const rawValue = localStorage.getItem(key);
            if (rawValue === null) continue;

            try {
                entries[key] = JSON.parse(rawValue);
            } catch {
                entries[key] = rawValue;
            }
        }

        setLocalSettings(entries);
    }, []);

    useEffect(() => {
        loadLocalSettings();
    }, [loadLocalSettings]);

    const exportLocalStorage = useCallback(async () => {
        const exportData: Record<string, unknown> = {};
        let tcversion = "";

        try {
            const response = await api.apiGetTeddyCloudSettingRaw("internal.version.v_long");
            tcversion = await response.text();
        } catch (error) {
            console.error("Error fetching data:", error);
        }

        exportData.teddycloudExport = {
            teddycloudVersion: tcversion,
            exportVersion: "1.0",
            exportedAt: new Date().toISOString(),
        };

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            const rawValue = localStorage.getItem(key);
            if (rawValue === null) continue;

            try {
                exportData[key] = JSON.parse(rawValue);
            } catch {
                exportData[key] = rawValue;
            }
        }

        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, "0");
        const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        const filename = `teddycloud_local_storage_${dateStr}_${timeStr}.json`;

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }, []);

    const importFromJsonString = useCallback(
        (jsonString: string) => {
            try {
                const importedData = JSON.parse(jsonString);

                if (!importedData || typeof importedData !== "object" || !("teddycloudExport" in importedData)) {
                    throw new Error("Invalid Teddycloud JSON file");
                }

                const data = importedData as Record<string, unknown>;
                delete data.teddycloudExport;

                Object.entries(data).forEach(([key, value]) => {
                    if (typeof value === "string") {
                        localStorage.setItem(key, value);
                    } else {
                        localStorage.setItem(key, JSON.stringify(value));
                    }
                });

                loadLocalSettings();

                addNotification(
                    NotificationTypeEnum.Success,
                    t("settings.guiSettings.jsonLoaded"),
                    t("settings.guiSettings.jsonLoadedDetails"),
                    t("settings.title")
                );
            } catch (err) {
                console.error(err);
                addNotification(
                    NotificationTypeEnum.Error,
                    t("settings.guiSettings.jsonLoadFailed"),
                    t("settings.guiSettings.jsonLoadFailedDetails") + String(err),
                    t("settings.title")
                );
            }
        },
        [addNotification, loadLocalSettings, t]
    );

    const settingKeys = useMemo(() => Object.keys(localSettings), [localSettings]);

    return {
        localSettings,
        settingKeys,
        exportLocalStorage,
        importFromJsonString,
        reload: loadLocalSettings,
    };
};
