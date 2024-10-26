import React, { useEffect, useState } from "react";
import { Empty, List, message } from "antd";
import { TonieboxCard, TonieboxCardProps } from "../../components/tonieboxes/TonieboxCard";
import GetBoxModelImages from "../../utils/boxModels";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "../common/LoadingSpinner";

export const TonieboxesList: React.FC<{
    tonieboxCards: TonieboxCardProps[];
}> = ({ tonieboxCards }) => {
    const { t } = useTranslation();
    const boxModelImages = GetBoxModelImages();

    useEffect(() => {
        if (!boxModelImages.loading && boxModelImages.boxModelImages.length === 0) {
            message.error("Error fetching Toniebox models");
        }
    }, [boxModelImages.loading, boxModelImages.boxModelImages.length]);

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
                    <TonieboxCard tonieboxCard={toniebox} tonieboxImages={boxModelImages.boxModelImages} />
                </List.Item>
            )}
            locale={{ emptyText: noDataTonieboxes() }}
        />
    );
};
