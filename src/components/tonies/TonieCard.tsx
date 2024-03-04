import React from 'react';
import { Card } from 'antd';

const { Meta } = Card;


export type TagsTonieCardList = {
    tags: TonieCardProps[];
}
export type TonieCardProps = {
    uid: string;
    ruid: string;
    type: string;
    valid: boolean;
    exists: boolean;
    tonieInfo: {
        series: string;
        episode: string;
        model: string;
        picture: string;
    };
}

export const TonieCard: React.FC<{ tonieCard: TonieCardProps }> = ({ tonieCard }) => {
    return (
        <Card
            hoverable
            style={{ width: 240 }}
            cover={<img alt={`${tonieCard.tonieInfo.series} - ${tonieCard.tonieInfo.episode}`} src={tonieCard.tonieInfo.picture} />}
        >
            <Meta title={`${tonieCard.tonieInfo.series} - ${tonieCard.tonieInfo.episode}`} description={tonieCard.uid} />
            {/*
            <p><strong>Type:</strong> {tonieCard.type}</p>
            <p><strong>Model:</strong> {tonieCard.tonieInfo.model}</p>
            <p><strong>Valid:</strong> {tonieCard.valid ? 'Yes' : 'No'}</p>
            <p><strong>Exists:</strong> {tonieCard.exists ? 'Yes' : 'No'}</p>
            */}
        </Card>
    );
};