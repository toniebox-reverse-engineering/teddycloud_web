import React, { useState } from 'react';
import { Card, Button, Popover, message, Slider } from 'antd';
import { InfoCircleOutlined, PlayCircleOutlined, PauseCircleOutlined, RetweetOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons';

import { useAudioContext } from '../audio/AudioContext';


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
    live: boolean;
    nocloud: boolean;
    source: string;
    audioUrl: string;
    downloadTriggerUrl: string;
    tonieInfo: {
        series: string;
        episode: string;
        model: string;
        picture: string;
        tracks: string[];
    };
}

export const TonieCard: React.FC<{ tonieCard: TonieCardProps }> = ({ tonieCard }) => {
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [isLive, setIsLive] = useState(tonieCard.live);
    const [progress, setProgress] = useState(0);
    const [messageApi, contextHolder] = message.useMessage();
    const [downloadTriggerUrl, setDownloadTriggerUrl] = useState(tonieCard.downloadTriggerUrl);
    const [isValid, setIsValid] = useState(tonieCard.valid);
    const { playAudio } = useAudioContext();

    const handleLiveClick = () => {
        setIsLive(!isLive);
        if (!isLive) {
            message.success('Live enabled!');
        } else {
            message.success('Live disabled!');
        }
    };
    const handlePlayPauseClick = () => {
        playAudio(process.env.REACT_APP_TEDDYCLOUD_API_URL + tonieCard.audioUrl, tonieCard.tonieInfo);
    };

    const handleBackgroundDownload = async () => {
        const url = process.env.REACT_APP_TEDDYCLOUD_API_URL + tonieCard.downloadTriggerUrl;
        setDownloadTriggerUrl("");
        try {
            messageApi.open({
                type: 'loading',
                content: 'Downloading...',
                duration: 0,
            });
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(response.status + " " + response.statusText);
            }
            const blob = await response.blob();
            messageApi.destroy();
            messageApi.open({
                type: 'success',
                content: "Downloaded file",
            });
            setIsValid(true);
        } catch (error) {
            messageApi.destroy();
            messageApi.open({
                type: 'error',
                content: "Error during background download: " + error,
            });
            setDownloadTriggerUrl(url);
        }
    }

    const content = (
        <div>
            <p><strong>Model:</strong> {tonieCard.tonieInfo.model}</p>
            <p><strong>Valid:</strong> {tonieCard.valid ? 'Yes' : 'No'}</p>
            <p><strong>Exists:</strong> {tonieCard.exists ? 'Yes' : 'No'}</p>
            <ol>
                {tonieCard.tonieInfo.tracks.map((track) => (
                    <li>{track}</li>
                ))}
            </ol>
        </div>
    );
    const title = `${tonieCard.tonieInfo.series} - ${tonieCard.tonieInfo.episode}`;
    const more = (
        <Popover content={content} title={`${tonieCard.tonieInfo.episode}`} trigger="click" placement="bottomRight">
            <Button icon={<InfoCircleOutlined />} />
        </Popover>
    )
    return (
        <>
            {contextHolder}
            <Card
                extra={more}
                hoverable
                size="small"
                title={tonieCard.tonieInfo.series}
                cover={< img alt={`${tonieCard.tonieInfo.series} - ${tonieCard.tonieInfo.episode}`
                } src={tonieCard.tonieInfo.picture} />}
                actions={
                    [
                        <EditOutlined key="edit" />,
                        isValid ?
                            (<PlayCircleOutlined key="playpause" onClick={handlePlayPauseClick} />) :
                            (downloadTriggerUrl.length > 0 ?
                                <DownloadOutlined key="download" onClick={handleBackgroundDownload} /> :
                                <PlayCircleOutlined key="playpause" style={{ color: 'lightgray' }} />
                            ),
                        <RetweetOutlined key="live" style={{ color: isLive ? 'red' : 'lightgray' }} onClick={handleLiveClick} />
                    ]}
            >
                <Meta title={`${tonieCard.tonieInfo.episode}`} description={tonieCard.uid} />
            </Card >
        </>
    );
};