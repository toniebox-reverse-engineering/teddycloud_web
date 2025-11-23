import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Empty, List } from "antd";

import { TonieboxCardProps } from "../../../types/tonieboxTypes";

import { TonieboxCard } from "../tonieboxcard/TonieboxCard";
import LoadingSpinner from "../../common/elements/LoadingSpinner";
import { useTeddyCloud } from "../../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../../types/teddyCloudNotificationTypes";
import { useCheckCC3200CFW } from "./hooks/useCheckCC3200CFW";

export const TonieboxesList: React.FC<{
    tonieboxCards: TonieboxCardProps[];
    readOnly?: boolean;
}> = ({ tonieboxCards, readOnly = false }) => {
    const { t } = useTranslation();
    const { addNotification, boxModelImages, boxModelImagesLoading } = useTeddyCloud();

    const checkCC3200CFW = useCheckCC3200CFW();

    useEffect(() => {
        if (!boxModelImagesLoading && boxModelImages.length === 0) {
            addNotification(
                NotificationTypeEnum.Error,
                t("settings.notifications.error"),
                t("tonieboxes.errorFetchingModels"),
                t("tonieboxes.navigationTitle")
            );
        }
    }, [boxModelImagesLoading, boxModelImages.length, addNotification, t]);

    if (boxModelImagesLoading) {
        return <LoadingSpinner />;
    }

    const noDataTonieboxes = (
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

    if (!tonieboxCards.length) {
        return noDataTonieboxes;
    }

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
                        tonieboxImages={boxModelImages}
                        readOnly={readOnly}
                        checkCC3200CFW={checkCC3200CFW}
                    />
                </List.Item>
            )}
            locale={{ emptyText: noDataTonieboxes }}
        />
    );
};
