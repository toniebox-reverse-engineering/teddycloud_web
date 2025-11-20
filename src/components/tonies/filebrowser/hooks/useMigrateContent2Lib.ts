import { TeddyCloudApi } from "../../../../api";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";

interface UseMigrateContent2LibParams {
    t: (key: string, vars?: any) => string;
    api: TeddyCloudApi;
    addNotification: (...args: any[]) => void;
    addLoadingNotification: (...args: any[]) => void;
    closeLoadingNotification: (...args: any[]) => void;
    setRebuildList: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useMigrateContent2Lib({
    t,
    api,
    addNotification,
    addLoadingNotification,
    closeLoadingNotification,
    setRebuildList,
}: UseMigrateContent2LibParams) {
    const migrateContent2Lib = async (ruid: string, libroot: boolean, overlay?: string) => {
        const key = "migrating-" + ruid;
        const body = `ruid=${ruid}&libroot=${libroot}`;

        addLoadingNotification(
            key,
            t("fileBrowser.messages.migrationOngoing"),
            t("fileBrowser.messages.migrationOngoingDetails", { ruid })
        );

        try {
            const response = await api.apiPostTeddyCloudRaw("/api/migrateContent2Lib", body, overlay);
            const data = await response.text();

            closeLoadingNotification(key);

            if (data === "OK") {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("fileBrowser.messages.migrationSuccessful"),
                    t("fileBrowser.messages.migrationSuccessfulDetails", { ruid }),
                    t("fileBrowser.title")
                );
                setRebuildList((prev) => !prev);
            } else {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("fileBrowser.messages.migrationFailed"),
                    t("fileBrowser.messages.migrationFailedDetails", { ruid }).replace(": ", ""),
                    t("fileBrowser.title")
                );
            }
        } catch (error) {
            closeLoadingNotification(key);
            addNotification(
                NotificationTypeEnum.Success,
                t("fileBrowser.messages.migrationFailed"),
                t("fileBrowser.messages.migrationFailedDetails", { ruid }) + error,
                t("fileBrowser.title")
            );
        }
    };

    return { migrateContent2Lib };
}
