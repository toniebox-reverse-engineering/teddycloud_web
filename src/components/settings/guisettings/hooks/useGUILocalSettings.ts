import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { useTeddyCloud } from "../../../../provider/TeddyCloudProvider";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { generateUUID } from "../../../../utils/ids/generateUUID";

type LocalSettings = Record<string, unknown>;

const api = new TeddyCloudApi(defaultAPIConfig());

const NOTIFICATIONS_STORAGE_KEY = "notifications";
const MAX_STORED_NOTIFICATIONS = 500;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const parseMaybeJson = (value: unknown): unknown => {
    if (typeof value !== "string") return value;

    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

const normalizeNotificationDate = (value: unknown): string => {
    const parsedDate =
        value instanceof Date
            ? new Date(value.getTime())
            : typeof value === "string" || typeof value === "number"
              ? new Date(value)
              : new Date();

    return Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
};

const normalizeStoredNotifications = (value: unknown): unknown[] => {
    const parsedValue = parseMaybeJson(value);
    if (!Array.isArray(parsedValue)) return [];

    const usedUuids = new Set<string>();

    return parsedValue.slice(0, MAX_STORED_NOTIFICATIONS).map((notification) => {
        const raw = isRecord(notification) ? notification : {};
        const rawUuid = typeof raw.uuid === "string" ? raw.uuid : "";
        const uuid = rawUuid && !usedUuids.has(rawUuid) ? rawUuid : generateUUID();
        usedUuids.add(uuid);

        return {
            uuid,
            date: normalizeNotificationDate(raw.date),
            type: typeof raw.type === "string" ? raw.type : NotificationTypeEnum.Info,
            title: typeof raw.title === "string" ? raw.title : "",
            description: typeof raw.description === "string" ? raw.description : "",
            context: typeof raw.context === "string" ? raw.context : "",
            flagConfirmed: Boolean(raw.flagConfirmed),
        };
    });
};

export const useGuiLocalSettings = () => {
    const { t } = useTranslation();
    const { addNotification, reloadNotifications } = useTeddyCloud();

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

                if (
                    !importedData ||
                    typeof importedData !== "object" ||
                    !("teddycloudExport" in importedData)
                ) {
                    throw new Error("Invalid Teddycloud JSON file");
                }

                const data = { ...(importedData as Record<string, unknown>) };
                delete data.teddycloudExport;

                Object.entries(data).forEach(([key, value]) => {
                    const valueToStore =
                        key === NOTIFICATIONS_STORAGE_KEY
                            ? normalizeStoredNotifications(value)
                            : value;

                    if (typeof valueToStore === "string") {
                        localStorage.setItem(key, valueToStore);
                    } else {
                        localStorage.setItem(key, JSON.stringify(valueToStore));
                    }
                });

                reloadNotifications();
                loadLocalSettings();

                addNotification(
                    NotificationTypeEnum.Success,
                    t("settings.guiSettings.jsonLoaded"),
                    t("settings.guiSettings.jsonLoadedDetails"),
                    t("settings.title"),
                    true,
                    false,
                );
            } catch (err) {
                console.error(err);
                addNotification(
                    NotificationTypeEnum.Error,
                    t("settings.guiSettings.jsonLoadFailed"),
                    t("settings.guiSettings.jsonLoadFailedDetails") + String(err),
                    t("settings.title"),
                );
            }
        },
        [addNotification, loadLocalSettings, reloadNotifications, t],
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
