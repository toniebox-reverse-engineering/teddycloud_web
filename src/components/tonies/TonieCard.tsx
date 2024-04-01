import React, { useState } from 'react';
import { Card, Button, Input, Popover, message, Slider, Select, Modal } from 'antd';
import { InfoCircleOutlined, PlayCircleOutlined, PauseCircleOutlined, RetweetOutlined, DownloadOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import React, {useState} from 'react';
import {Card, Button, Popover, message, Modal} from 'antd';
import {
    InfoCircleOutlined,
    PlayCircleOutlined,
    RetweetOutlined,
    DownloadOutlined,
    EditOutlined
} from '@ant-design/icons';

import {useAudioContext} from '../audio/AudioContext';
import {FileBrowser} from './FileBrowser';
import { TonieArticleSearch } from './TonieArticleSearch';


const {Meta} = Card;


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

export const TonieCard: React.FC<{ tonieCard: TonieCardProps }> = ({tonieCard}) => {
    const [isLive, setIsLive] = useState(tonieCard.live);
    const [messageApi, contextHolder] = message.useMessage();
    const [downloadTriggerUrl, setDownloadTriggerUrl] = useState(tonieCard.downloadTriggerUrl);
    const [isValid, setIsValid] = useState(tonieCard.valid);
    const {playAudio} = useAudioContext();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    const [activeModel, setActiveModel] = useState(tonieCard.tonieInfo.model);
    const [selectedModel, setSelectedModel] = useState("");

    const [selectedFile, setSelectedFile] = useState<string>("");
    const handleFileSelectChange = (files: any[], path: string, special: string) => {
        if (files.length === 1) {
            const prefix = special === "library" ? "lib:/" : "content:/";
            const filePath = prefix + path + "/" + files[0].name;
            console.log(filePath);
            setSelectedFile(filePath);
        } else {
            setSelectedFile("");
        }
    }

    const showEditModal = () => {
        setSelectedFile("");
        setIsEditModalOpen(true);
    };
    const handleEditOk = async () => {
        setIsEditModalOpen(false);
        if (selectedFile === "") {
            message.error('Could not empty source!');
            return;
        }
        const url = `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/content/json/set/${tonieCard.ruid}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: "source=" + selectedFile
            });
            if (!response.ok) {
                throw new Error(response.status + " " + response.statusText);
            }
            message.success('Source set to ' + selectedFile + "!");
        } catch (error) {
            message.error('Could not set source! ' + error);
        }
    };
    const handleEditCancel = () => {
        setSelectedFile("");
        setIsEditModalOpen(false);
    };
    const handleEditClick = () => {
        showEditModal();
    }

    const showModelModal = () => {
        setSelectedModel(activeModel);
        setIsModelModalOpen(true);
        setIsMoreOpen(false);
    };
    const handleModelOk = async () => {
        setIsModelModalOpen(false);
    }
    const handleModelCancel = () => {
        setIsModelModalOpen(false);
    };
    const handleModelClick = () => {
        showModelModal();
    }

    const handleLiveClick = async () => {
        const url = `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/content/json/set/${tonieCard.ruid}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: "live=" + !isLive
            });
            if (!response.ok) {
                throw new Error(response.status + " " + response.statusText);
            }
            setIsLive(!isLive);
            if (!isLive) {
                message.success('Live enabled!');
            } else {
                message.success('Live disabled!');
            }
        } catch (error) {
            message.error('Could not change live flag! ' + error);
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

    const handleMoreOpenChange = (newOpen: boolean) => {
        setIsMoreOpen(newOpen);
    };

    const handleModelClearClick = () => {
        setSelectedModel(activeModel);
    };
    const handleModelSave = async () => {
        const url = `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/content/json/set/${tonieCard.ruid}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: "tonie_model=" + selectedModel
            });
            if (!response.ok) {
                throw new Error(response.status + " " + response.statusText);
            }
            setActiveModel(selectedModel);
            message.success("Set tonie model to " + selectedModel + "!");
        } catch (error) {
            message.error('Could not change tonie model! ' + error);
        }
    }
    const handleModelInputChange = (e: any) => {
        setSelectedModel(e.target.value);
    };

    const content = (
        <div>
            <p><strong>Model:</strong> {tonieCard.tonieInfo.model} <EditOutlined key="edit" onClick={handleModelClick} /></p>
            <p><strong>Valid:</strong> {tonieCard.valid ? 'Yes' : 'No'}</p>
            <p><strong>Exists:</strong> {tonieCard.exists ? 'Yes' : 'No'}</p>
            <ol>
                {tonieCard.tonieInfo.tracks.map((track, i) => (
                    <li key={i}>{track}</li>
                ))}
            </ol>
        </div>
    );
    const more = (
        <Popover open={isMoreOpen} onOpenChange={handleMoreOpenChange} content={content} title={`${tonieCard.tonieInfo.episode}`} trigger="click" placement="bottomRight">
            <Button icon={<InfoCircleOutlined/>}/>
        </Popover>
    )
    const searchResultChanged = (newValue: string) => {
        setSelectedModel(newValue);
    }
    return (
        <>
            {contextHolder}
            <Card
                extra={more}
                hoverable
                size="small"
                title={tonieCard.tonieInfo.series}
                cover={< img alt={`${tonieCard.tonieInfo.series} - ${tonieCard.tonieInfo.episode}`
                } src={tonieCard.tonieInfo.picture}/>}
                actions={
                    [
                        <EditOutlined key="edit" onClick={handleEditClick}/>,
                        isValid ?
                            (<PlayCircleOutlined key="playpause" onClick={handlePlayPauseClick}/>) :
                            (downloadTriggerUrl.length > 0 ?
                                    <DownloadOutlined key="download" onClick={handleBackgroundDownload}/> :
                                    <PlayCircleOutlined key="playpause" style={{color: 'lightgray'}}/>
                            ),
                        <RetweetOutlined key="live" style={{color: isLive ? 'red' : 'lightgray'}}
                                         onClick={handleLiveClick}/>
                    ]}
            >
                <Meta title={`${tonieCard.tonieInfo.episode}`} description={tonieCard.uid}/>
            </Card>
            <Modal title="Edit Tag" open={isEditModalOpen} onOk={handleEditOk} onCancel={handleEditCancel}>
                <FileBrowser special="library" maxSelectedRows={1} trackUrl={false} onFileSelectChange={handleFileSelectChange}/>
            </Modal>
            <Modal title={"Edit Model " + tonieCard.tonieInfo.model + " - " + title} open={isModelModalOpen} onOk={handleModelOk} onCancel={handleModelCancel}>
                <p><Input value={selectedModel} onChange={handleModelInputChange} addonBefore={<CloseOutlined onClick={handleModelClearClick} />}
                    addonAfter={activeModel == selectedModel ?
                        (<SaveOutlined key="saveModelNoClick" style={{ color: 'lightgray' }} />) :
                        (<SaveOutlined key="saveModel" onClick={handleModelSave} />)} /></p>
                <TonieArticleSearch placeholder="Search for a model" style={{ width: 500 }} onChange={searchResultChanged} />
            </Modal>
        </>
    );
};