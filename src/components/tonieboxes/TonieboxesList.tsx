import React, { useState } from "react";
import { List } from "antd";
import { TonieboxCard, TonieboxCardProps } from "../../components/tonieboxes/TonieboxCard";
import GetBoxModelImages from "../../utils/boxModels";

export const TonieboxesList: React.FC<{
    tonieboxCards: TonieboxCardProps[];
}> = ({ tonieboxCards }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loading, setLoading] = useState(true);
    const boxModelImages = GetBoxModelImages();

    // Check if boxModelImages are loaded
    if (boxModelImages.length === 0 && loading) {
        return <div>Loading...</div>;
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
                    <TonieboxCard tonieboxCard={toniebox} tonieboxImages={boxModelImages} />
                </List.Item>
            )}
        />
    );
};
