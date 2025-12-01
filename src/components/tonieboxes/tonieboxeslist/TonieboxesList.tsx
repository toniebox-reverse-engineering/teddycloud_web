import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Empty, Flex, Grid } from "antd";

import { TonieboxCardProps } from "../../../types/tonieboxTypes";

import { TonieboxCard } from "../tonieboxcard/TonieboxCard";
import LoadingSpinner from "../../common/elements/LoadingSpinner";
import { useTeddyCloud } from "../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../types/teddyCloudNotificationTypes";
import { useGetSettingCheckCC3200CFW } from "./hooks/useGetSettingCheckCC3200CFW";

export const TonieboxesList: React.FC<{
    tonieboxCards: TonieboxCardProps[];
    readOnly?: boolean;
}> = ({ tonieboxCards, readOnly = false }) => {
    const { t } = useTranslation();
    const { addNotification, boxModelImages, boxModelImagesLoading } = useTeddyCloud();
    const screens = Grid.useBreakpoint();

    const columns = screens.xxl ? 4 : screens.xl ? 3 : screens.lg ? 3 : screens.md ? 2 : screens.sm ? 2 : 1;

    const checkCC3200CFW = useGetSettingCheckCC3200CFW();

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
        <Flex wrap gap={16}>
            {tonieboxCards.length === 0 ? (
                <div style={{ width: "100%", textAlign: "center" }}>{noDataTonieboxes}</div>
            ) : (
                tonieboxCards.map((toniebox) => (
                    <div
                        key={toniebox.ID}
                        style={{
                            flex: `0 0 calc(${100 / columns}% - 16px)`,
                            maxWidth: `calc(${100 / columns}% - 16px)`,
                        }}
                    >
                        <TonieboxCard
                            tonieboxCard={toniebox}
                            tonieboxImages={boxModelImages}
                            readOnly={readOnly}
                            checkCC3200CFW={checkCC3200CFW}
                        />
                    </div>
                ))
            )}
        </Flex>
    );
};
