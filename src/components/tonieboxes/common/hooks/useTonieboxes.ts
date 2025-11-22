import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { TonieboxCardProps } from "../../../../types/tonieboxTypes";
import { useTeddyCloud } from "../../../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

export const useTonieboxes = () => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();

    const [tonieboxes, setTonieboxes] = useState<TonieboxCardProps[]>([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await api.apiGetTonieboxesIndex();
                setTonieboxes(data);
            } catch (error) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("tonieboxes.errorFetchingTonieboxes"),
                    t("tonieboxes.errorFetchingTonieboxes") + ": " + error,
                    t("tonieboxes.navigationTitle")
                );
            }
        };

        fetch();
    }, []);

    return tonieboxes;
};
