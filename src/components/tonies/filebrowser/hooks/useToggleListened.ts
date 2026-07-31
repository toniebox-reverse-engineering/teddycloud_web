import { useTranslation } from "react-i18next";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { useTeddyCloud } from "../../../../provider/TeddyCloudProvider";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { Record } from "../../../../types/fileBrowserTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

interface UseToggleListenedParams {
    path: string;
    special: string;
    overlay?: string;
    setRebuildList: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useToggleListened({ path, special, overlay, setRebuildList }: UseToggleListenedParams) {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();

    const toggleListened = async (record: Record) => {
        try {
            await api.apiPostFileSetListened(path + "/" + record.name, special, !record.listened, overlay);
            setRebuildList((prev) => !prev);
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("fileBrowser.messages.toggleListenedFailed"),
                t("fileBrowser.messages.toggleListenedFailedDetails", { file: record.name }) + error,
                t("fileBrowser.title"),
            );
        }
    };

    return { toggleListened };
}
