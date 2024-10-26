import React, { useState } from "react";
import { Empty, List } from "antd";
import { TonieboxCard, TonieboxCardProps } from "../../components/tonieboxes/TonieboxCard";
import GetBoxModelImages from "../../utils/boxModels";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "../common/LoadingSpinner";

export const TonieboxesList: React.FC<{
    tonieboxCards: TonieboxCardProps[];
}> = ({ tonieboxCards }) => {
    const { t } = useTranslation();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loading, setLoading] = useState(true);

    const boxModelImages = GetBoxModelImages();

    // Check if boxModelImages are loaded
    if (boxModelImages.length === 0 && loading) {
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
                    <TonieboxCard tonieboxCard={toniebox} tonieboxImages={boxModelImages} />
                </List.Item>
            )}
            locale={{ emptyText: noDataTonieboxes() }}
        />
    );
};
