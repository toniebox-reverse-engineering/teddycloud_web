import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { useTranslation } from "react-i18next";

const api = new TeddyCloudApi(defaultAPIConfig());

interface UseMigrateContent2LibParams {
    setRebuildList: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useMigrateContent2Lib({ setRebuildList }: UseMigrateContent2LibParams) {
    const { t } = useTranslation();
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();

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
