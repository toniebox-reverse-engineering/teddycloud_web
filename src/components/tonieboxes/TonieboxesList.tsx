import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Empty, List } from "antd";

import { TonieboxCardProps } from "../../types/tonieboxTypes";

import { TonieboxCard } from "../tonieboxes/TonieboxCard";
import LoadingSpinner from "../utils/LoadingSpinner";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export const TonieboxesList: React.FC<{
    tonieboxCards: TonieboxCardProps[];
    readOnly?: boolean;
}> = ({ tonieboxCards, readOnly = false }) => {
    const { t } = useTranslation();
    const { addNotification, boxModelImages } = useTeddyCloud();
    const [checkCC3200CFW, setCheckCC3200CFW] = useState<boolean>(false);

    useEffect(() => {
        if (!boxModelImages.loading && boxModelImages.boxModelImages.length === 0) {
            addNotification(
                NotificationTypeEnum.Error,
                t("settings.notifications.error"),
                t("tonieboxes.errorFetchingModels"),
                t("tonieboxes.navigationTitle")
            );
        }
    }, [boxModelImages.loading, boxModelImages.boxModelImages.length]);

    useEffect(() => {
        const fetchCheckCC3200CFW = async () => {
            const response = await api.apiGetTeddyCloudSettingRaw("frontend.check_cc300_cfw");
            const checkCC3200CFW = (await response.text()) === "true";
            setCheckCC3200CFW(checkCC3200CFW);
        };
        fetchCheckCC3200CFW();
    }, []);

    if (boxModelImages.loading) {
        return <LoadingSpinner />;
    }

    const noDataTonieboxes = () => (
        <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
                <div>
                    <p>{t("tonieboxes.noData")}</p>
                    <p>{t("tonieboxes.noDataText")}</p>
                </div>
            }
        />
    );

    return (
        <List
            grid={{
                gutter: 16,
                xs: 1,
                sm: 2,
                md: 2,
                lg: 3,
                xl: 3,
                xxl: 4,
            }}
            dataSource={tonieboxCards}
            renderItem={(toniebox) => (
                <List.Item id={toniebox.ID}>
                    <TonieboxCard
                        tonieboxCard={toniebox}
                        tonieboxImages={boxModelImages.boxModelImages}
                        readOnly={readOnly}
                        checkCC3200CFW={checkCC3200CFW}
                    />
                </List.Item>
            )}
            locale={{ emptyText: noDataTonieboxes() }}
        />
    );
};
