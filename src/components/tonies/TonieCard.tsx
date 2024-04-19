import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, Popover, message, Slider, Select, Modal } from 'antd';
import { InfoCircleOutlined, PlayCircleOutlined, PauseCircleOutlined, CloudSyncOutlined, RetweetOutlined, DownloadOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';

import { useAudioContext } from '../audio/AudioContext';
import { FileBrowser } from './FileBrowser';
import { TonieArticleSearch } from './TonieArticleSearch';

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
    const [isLive, setIsLive] = useState(tonieCard.live);
    const [isNoCloud, setIsNoCloud] = useState(tonieCard.nocloud);
    const [messageApi, contextHolder] = message.useMessage();
    const [downloadTriggerUrl, setDownloadTriggerUrl] = useState(tonieCard.downloadTriggerUrl);
    const [isValid, setIsValid] = useState(tonieCard.valid);
    const { playAudio } = useAudioContext();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    const [activeModel, setActiveModel] = useState(tonieCard.tonieInfo.model);
    const [selectedModel, setSelectedModel] = useState("");

    const [selectedFile, setSelectedFile] = useState<string>("");
    const handleFileSelectChange = (files: any[], path: string, special: string) => {
        if (files.length == 1) {
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
            message.error(t("tonies.messages.couldNotEmptySource"));
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
            message.success(t("tonies.messages.sourceSetSuccessful", {selectedFile: selectedFile}));
        } catch (error) {
            message.error(t("tonies.messages.sourceCouldNotSet") + error);
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
                message.success(t("tonies.messages.liveEnabled"));
            } else {
                message.success(t("tonies.messages.liveDisabled"));
            }
        } catch (error) {
            message.error(t("tonies.messages.sourceCouldNotChangeLiveFlag") + error);
        }
    };
    const handleNoCloudClick = async () => {
        const url = `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/content/json/set/${tonieCard.ruid}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: "nocloud=" + !isNoCloud
            });
            if (!response.ok) {
                throw new Error(response.status + " " + response.statusText);
            }
            setIsNoCloud(!isNoCloud);
            if (!isNoCloud) {
                message.success(t("tonies.messages.cloudAccessBlocked"));
            } else {
                message.success(t("tonies.messages.cloudAccessEnabled"));
            }
        } catch (error) {
            message.error(t("tonies.messages.sourceCouldNotChangeCloudFlag") + error);
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
                content: t("tonies.messages.downloading"),
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
                content: t("tonies.messages.downloadedFile"),
            });
            setIsValid(true);
        } catch (error) {
            messageApi.destroy();
            messageApi.open({
                type: 'error',
                content: t("tonies.messages.errorDuringDownload") + error,
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
            message.success( t("tonies.messages.setTonieToModelSuccessful", {selectedModel: selectedModel}));
        } catch (error) {
            message.error(t("tonies.messages.setTonieToModelFailed") + error);
        }
    }
    const handleModelInputChange = (e: any) => {
        setSelectedModel(e.target.value);
    };

    const content = (
        <div>
            <p><strong>{t("tonies.infoModal.model")}</strong> {tonieCard.tonieInfo.model} <EditOutlined key="edit" onClick={handleModelClick} /></p>
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
    const more = (
        <Popover open={isMoreOpen} onOpenChange={handleMoreOpenChange} content={content} title={`${tonieCard.tonieInfo.episode}`} trigger="click" placement="bottomRight">
            <Button icon={<InfoCircleOutlined />} />
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
                } src={tonieCard.tonieInfo.picture} />}
                actions={
                    [
                        <EditOutlined key="edit" onClick={handleEditClick} />,
                        isValid ?
                            (<PlayCircleOutlined key="playpause" onClick={handlePlayPauseClick} />) :
                            (downloadTriggerUrl.length > 0 ?
                                <DownloadOutlined key="download" onClick={handleBackgroundDownload} /> :
                                <PlayCircleOutlined key="playpause" style={{ color: 'lightgray' }} />
                            ),
                        <CloudSyncOutlined key="nocloud" style={{ color: isNoCloud ? 'red' : 'lightgray' }} onClick={handleNoCloudClick} />,
                        <RetweetOutlined key="live" style={{ color: isLive ? 'red' : 'lightgray' }} onClick={handleLiveClick} />
                    ]}
            >
                <Meta title={`${tonieCard.tonieInfo.episode}`} description={tonieCard.uid} />
            </Card >
            <Modal title={t("tonies.editTagModal.editTag")} open={isEditModalOpen} onOk={handleEditOk} onCancel={handleEditCancel}>
                <FileBrowser special="library" maxSelectedRows={1} trackUrl={false} onFileSelectChange={handleFileSelectChange} />
            </Modal>
            <Modal title={t("tonies.editModelModal.editModel") + tonieCard.tonieInfo.model + " - " + title} open={isModelModalOpen} onOk={handleModelOk} onCancel={handleModelCancel}>
                <p><Input value={selectedModel} onChange={handleModelInputChange} addonBefore={<CloseOutlined onClick={handleModelClearClick} />}
                    addonAfter={activeModel == selectedModel ?
                        (<SaveOutlined key="saveModelNoClick" style={{ color: 'lightgray' }} />) :
                        (<SaveOutlined key="saveModel" onClick={handleModelSave} />)} /></p>
                <TonieArticleSearch placeholder={t("tonies.editModelModal.placeholderSearchForAModel")} style={{ width: 500 }} onChange={searchResultChanged} />
            </Modal>
        </>
    );
};