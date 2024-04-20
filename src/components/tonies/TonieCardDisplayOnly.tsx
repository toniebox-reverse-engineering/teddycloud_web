import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Popover } from 'antd';
import { InfoCircleOutlined, PlayCircleOutlined, PauseCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { useAudioContext } from '../audio/AudioContext';
const { Meta } = Card;

export type TagsTonieCardList = {
    tags: TonieCardProps[];
}
export type TonieInfo = {
    series: string;
     episode: string;
    model: string;
    picture: string;
    tracks: string[];
}
export type TonieCardProps = {
    uid: string;
    ruid: string;
    type: string;
    valid: boolean;
    exists: boolean;
    live: boolean;
    nocloud: boolean;
    source: string;
    audioUrl: string;
    downloadTriggerUrl: string;
    tonieInfo: TonieInfo;
}

export const TonieCard: React.FC<{ tonieCard: TonieCardProps }> = ({ tonieCard }) => {
    const { t } = useTranslation();

    const { playAudio } = useAudioContext();
    const [isValid, setIsValid] = useState(tonieCard.valid);
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    const showModelModal = () => {
        setIsMoreOpen(false);
    };

    const handlePlayPauseClick = () => {
        playAudio(process.env.REACT_APP_TEDDYCLOUD_API_URL + tonieCard.audioUrl, tonieCard.tonieInfo);
    };

    const handleMoreOpenChange = (newOpen: boolean) => {
        setIsMoreOpen(newOpen);
    };

    const content = (
        <div>
            <p><strong>{t("tonies.infoModal.model")}</strong> {tonieCard.tonieInfo.model}</p>
            <p><strong>{t("tonies.infoModal.valid")}</strong> {tonieCard.valid ? t("tonies.infoModal.yes") : t("tonies.infoModal.no")}</p>
            <p><strong>{t("tonies.infoModal.exists")}</strong> {tonieCard.exists ?  t("tonies.infoModal.yes") : t("tonies.infoModal.no")}</p>
            <ol>
                {tonieCard.tonieInfo.tracks.map((track) => (
                    <li>{track}</li>
                ))}
            </ol>
        </div>
    );
    const title = `${tonieCard.tonieInfo.series} - ${tonieCard.tonieInfo.episode}`;
    const more = [
        tonieCard.valid ?
        (<Button icon={<PlayCircleOutlined/>} key="playpause" onClick={handlePlayPauseClick} />) :
        (<Button icon={<PlayCircleOutlined/>} key="playpause" style={{ color: 'lightgray' }} />)
        ,
        (
        <Popover open={isMoreOpen} onOpenChange={handleMoreOpenChange} content={content} title={`${tonieCard.tonieInfo.episode}`} trigger="click" placement="bottomRight">
           <Button icon={<InfoCircleOutlined />} style={{ margin: '8px 0 8px 8px' }} />
        </Popover>
    )];

    return (
        <>
            <Card
                extra={more}
                hoverable
                size="small"
                title={tonieCard.tonieInfo.series}
                cover={< img alt={`${tonieCard.tonieInfo.series} - ${tonieCard.tonieInfo.episode}`
                } src={tonieCard.tonieInfo.picture} />}
            >
                <Meta title={`${tonieCard.tonieInfo.episode}`} description={tonieCard.uid} />
            </Card >

        </>
    );
};