import {
    CloseOutlined,
    CloudSyncOutlined,
    DownloadOutlined,
    EditOutlined,
    FolderOpenOutlined,
    InfoCircleOutlined,
    PlayCircleOutlined,
    RetweetOutlined,
    SaveFilled,
} from "@ant-design/icons";
import { Button, Card, Divider, Input, Modal, Typography, message, theme } from "antd";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAudioContext } from "../audio/AudioContext";
import { FileBrowser } from "./FileBrowser";
import { TonieArticleSearch } from "./TonieArticleSearch";

const { Meta } = Card;
const { Text } = Typography;
const { useToken } = theme;

export type TagsTonieCardList = {
    tags: TonieCardProps[];
};
export type TonieInfo = {
    series: string;
    episode: string;
    model: string;
    picture: string;
    tracks: string[];
};
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
};

export const TonieCard: React.FC<{
    tonieCard: TonieCardProps;
    lastRUIDs: Array<[string, string]>;
    overlay: string;
    readOnly: boolean;
}> = ({ tonieCard, lastRUIDs, overlay, readOnly }) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const [messageApi, contextHolder] = message.useMessage();
    const [isValid, setIsValid] = useState(tonieCard.valid);
    const [isNoCloud, setIsNoCloud] = useState(tonieCard.nocloud);
    const [isLive, setIsLive] = useState(tonieCard.live);
    const [downloadTriggerUrl, setDownloadTriggerUrl] = useState(tonieCard.downloadTriggerUrl);
    const [audioUrl, setAudioUrl] = useState(tonieCard.audioUrl);
    const { playAudio } = useAudioContext();

    const [isInformationModalOpen, setInformationModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSelectFileModalOpen, seSelectFileModalOpen] = useState(false);

    const [activeModel, setActiveModel] = useState(tonieCard.tonieInfo.model);
    const [selectedModel, setSelectedModel] = useState("");

    const [activeSource, setActiveSource] = useState(tonieCard.source);
    const [selectedSource, setSelectedSource] = useState("");

    useEffect(() => {
        // Update states when tonieCard prop changes
        setIsValid(tonieCard.valid);
        setIsLive(tonieCard.live);
        setIsNoCloud(tonieCard.nocloud);
        setActiveSource(tonieCard.source);
        setActiveModel(tonieCard.tonieInfo.model);
        setAudioUrl(tonieCard.audioUrl);
        setDownloadTriggerUrl(tonieCard.downloadTriggerUrl);
    }, [tonieCard]);

    const handleFileSelectChange = (files: any[], path: string, special: string) => {
        if (files && files.length === 1) {
            const prefix = special === "library" ? "lib:/" : "content:/";
            const filePath = prefix + path + "/" + files[0].name;
            setSelectedSource(filePath);
        } else {
            setSelectedSource(activeSource);
        }
    };

    const showFileSelectModal = () => {
        seSelectFileModalOpen(true);
    };

    const handleCancelSelectFile = () => {
        setSelectedSource(activeSource);
        seSelectFileModalOpen(false);
    };

    const showModelModal = () => {
        setSelectedModel(activeModel);
        setSelectedSource(activeSource);

        setIsEditModalOpen(true);
    };

    const handleSaveChanges = async () => {
        setIsEditModalOpen(false);
        if (activeSource !== selectedSource) handleSourceSave();

        if (activeModel !== selectedModel) handleModelSave();
    };

    const handleLiveClick = async () => {
        const url =
            `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/content/json/set/${tonieCard.ruid}` +
            (overlay ? `?overlay=${overlay}` : "");
        try {
            const response = await fetch(url, {
                method: "POST",
                body: "live=" + !isLive,
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
        const url =
            `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/content/json/set/${tonieCard.ruid}` +
            (overlay ? `?overlay=${overlay}` : "");
        try {
            const response = await fetch(url, {
                method: "POST",
                body: "nocloud=" + !isNoCloud,
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

    const handlePlayPauseClick = async () => {
        const url = process.env.REACT_APP_TEDDYCLOUD_API_URL + tonieCard.audioUrl;
        playAudio(url, tonieCard.tonieInfo);
    };

    const handleBackgroundDownload = async () => {
        const url = process.env.REACT_APP_TEDDYCLOUD_API_URL + tonieCard.downloadTriggerUrl;
        setDownloadTriggerUrl("");
        try {
            messageApi.open({
                type: "loading",
                content: t("tonies.messages.downloading"),
                duration: 0,
            });
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(response.status + " " + response.statusText);
            }

            // blob used that message is shown after download finished
            const blob = await response.blob();

            messageApi.destroy();
            messageApi.open({
                type: "success",
                content: t("tonies.messages.downloadedFile"),
            });
            setIsValid(true);
        } catch (error) {
            messageApi.destroy();
            messageApi.open({
                type: "error",
                content: t("tonies.messages.errorDuringDownload") + error,
            });
            setDownloadTriggerUrl(url);
        }
    };

    const handleModelSave = async () => {
        const url =
            `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/content/json/set/${tonieCard.ruid}` +
            (overlay ? `?overlay=${overlay}` : "");
        try {
            const response = await fetch(url, {
                method: "POST",
                body: "tonie_model=" + selectedModel,
            });
            if (!response.ok) {
                throw new Error(response.status + " " + response.statusText);
            }
            setActiveModel(selectedModel);
            message.success(
                t("tonies.messages.setTonieToModelSuccessful", {
                    selectedModel: selectedModel ? selectedModel : t("tonies.messages.setToEmptyValue"),
                })
            );
        } catch (error) {
            message.error(t("tonies.messages.setTonieToModelFailed") + error);
        }
    };

    const handleSourceSave = async () => {
        const url =
            `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/content/json/set/${tonieCard.ruid}` +
            (overlay ? `?overlay=${overlay}` : "");
        try {
            const response = await fetch(url, {
                method: "POST",
                body: "source=" + selectedSource,
            });
            if (!response.ok) {
                throw new Error(response.status + " " + response.statusText);
            }
            setActiveSource(selectedSource);
            selectedSource ? setIsValid(true) : setIsValid(false);
            message.success(
                t("tonies.messages.setTonieToSourceSuccessful", {
                    selectedSource: selectedSource ? selectedSource : t("tonies.messages.setToEmptyValue"),
                })
            );
        } catch (error) {
            message.error(t("tonies.messages.setTonieToSourceFailed") + error);
        }
    };

    const handleModelInputChange = (e: any) => {
        setSelectedModel(e.target.value);
    };
    const handleSourceInputChange = (e: any) => {
        setSelectedSource(e.target.value);
    };

    const toniePlayedOn = lastRUIDs.filter(([ruid]) => ruid === tonieCard.ruid).map(([, boxName]) => boxName);

    const title =
        `${tonieCard.tonieInfo.series}` + (tonieCard.tonieInfo.episode ? ` - ${tonieCard.tonieInfo.episode}` : "");

    const searchModelResultChanged = (newValue: string) => {
        setSelectedModel(newValue);
    };

    const informationModalTitel = (
        <>
            <h3>
                {title ? title : t("tonies.informationModal.unknownModel")}
                <br />
                <Text type="secondary">{tonieCard.uid}</Text>
            </h3>
        </>
    );

    const informationModalFooter = (
        <Button type="primary" onClick={() => setInformationModalOpen(false)}>
            {t("tonies.informationModal.ok")}
        </Button>
    );

    const informationModal = (
        <Modal
            title={informationModalTitel}
            footer={informationModalFooter}
            open={isInformationModalOpen}
            keyboard={true}
            closable={false}
            maskClosable={true}
            onCancel={() => setInformationModalOpen(false)}
        >
            {toniePlayedOn && toniePlayedOn.length > 0 ? (
                <>
                    <strong>{t("tonies.lastPlayedOnModal.lastPlayedOnMessage")}:</strong>
                    <ul>
                        {toniePlayedOn.map((boxName, index) => (
                            <li key={index}>{boxName}</li>
                        ))}
                    </ul>
                </>
            ) : (
                <></>
            )}
            <div>
                <p>
                    <strong>{t("tonies.infoModal.valid")}</strong>{" "}
                    {tonieCard.valid ? t("tonies.infoModal.yes") : t("tonies.infoModal.no")}
                </p>
                <p>
                    <strong>{t("tonies.infoModal.exists")}</strong>{" "}
                    {tonieCard.exists ? t("tonies.infoModal.yes") : t("tonies.infoModal.no")}
                </p>
                {tonieCard.tonieInfo.tracks && tonieCard.tonieInfo.tracks.length > 0 ? (
                    <>
                        <strong>{t("tonies.infoModal.tracklist")}</strong>
                        <ol>
                            {tonieCard.tonieInfo.tracks.map((track, index) => (
                                <li key={index}>{track}</li>
                            ))}
                        </ol>
                    </>
                ) : (
                    <></>
                )}
            </div>
        </Modal>
    );

    const editModalTitel = (
        <>
            <h3 style={{ lineHeight: 0 }}>
                {t("tonies.editModal.title")}
                {tonieCard.tonieInfo.model ? " (" + tonieCard.tonieInfo.model + ")" : ""}
            </h3>
            {tonieCard.tonieInfo.series ? <Text type="secondary">{title}</Text> : " "}
        </>
    );

    const editModalFooter = (
        <>
            <Button
                type="primary"
                onClick={handleSaveChanges}
                disabled={activeSource === selectedSource && activeModel === selectedModel}
            >
                <SaveFilled key="saveClick" /> {t("tonies.editModal.save")}
            </Button>
        </>
    );

    const editModal = (
        <Modal
            open={isEditModalOpen}
            onCancel={() => setIsEditModalOpen(false)}
            title={editModalTitel}
            footer={editModalFooter}
        >
            <Divider orientation="left" orientationMargin="0">
                {t("tonies.editModal.source")}
            </Divider>
            <div>
                <Input
                    value={selectedSource}
                    width="auto"
                    onChange={handleSourceInputChange}
                    addonBefore={<CloseOutlined onClick={() => setSelectedSource(activeSource)} />}
                    addonAfter={<FolderOpenOutlined onClick={() => showFileSelectModal()} />}
                />
            </div>
            <Divider orientation="left" orientationMargin="0">
                {t("tonies.editModal.model")}
            </Divider>
            <div>
                <p>
                    <Input
                        value={selectedModel}
                        width="auto"
                        onChange={handleModelInputChange}
                        addonBefore={<CloseOutlined onClick={() => setSelectedModel(activeModel)} />}
                    />
                </p>
                <TonieArticleSearch
                    placeholder={t("tonies.editModal.placeholderSearchForAModel")}
                    onChange={searchModelResultChanged}
                />
            </div>
        </Modal>
    );

    const selectFileModal = (
        <Modal
            title={t("tonies.selectFileModal.selectFile")}
            open={isSelectFileModalOpen}
            onOk={() => seSelectFileModalOpen(false)}
            onCancel={handleCancelSelectFile}
            width="auto"
        >
            <FileBrowser
                special="library"
                maxSelectedRows={1}
                trackUrl={false}
                onFileSelectChange={handleFileSelectChange}
            />
        </Modal>
    );

    const actions = readOnly
        ? [
              <InfoCircleOutlined key="info" onClick={() => setInformationModalOpen(true)} />,
              isValid ? (
                  <PlayCircleOutlined key="playpause" onClick={handlePlayPauseClick} />
              ) : (
                  <PlayCircleOutlined key="playpause" style={{ cursor: "default", color: token.colorTextDisabled }} />
              ),
              <CloudSyncOutlined
                  key="nocloud"
                  style={{ cursor: "default", color: isNoCloud ? "red" : token.colorTextDisabled }}
              />,
              <RetweetOutlined
                  key="live"
                  style={{ cursor: "default", color: isLive ? "red" : token.colorTextDisabled }}
              />,
          ]
        : [
              <InfoCircleOutlined key="info" onClick={() => setInformationModalOpen(true)} />,
              <EditOutlined key="edit" onClick={showModelModal} />,
              isValid ? (
                  <PlayCircleOutlined key="playpause" onClick={handlePlayPauseClick} />
              ) : downloadTriggerUrl && downloadTriggerUrl.length > 0 ? (
                  <DownloadOutlined key="download" onClick={handleBackgroundDownload} />
              ) : (
                  <PlayCircleOutlined key="playpause" style={{ cursor: "default", color: token.colorTextDisabled }} />
              ),
              <CloudSyncOutlined
                  key="nocloud"
                  style={{ color: isNoCloud ? "red" : token.colorTextDescription }}
                  onClick={handleNoCloudClick}
              />,
              <RetweetOutlined
                  key="live"
                  style={{ color: isLive ? "red" : token.colorTextDescription }}
                  onClick={handleLiveClick}
              />,
          ];

    return (
        <>
            {contextHolder}
            <Card
                hoverable={false}
                key={tonieCard.ruid}
                size="small"
                style={
                    toniePlayedOn && toniePlayedOn.length > 0
                        ? { background: token.colorBgContainerDisabled, borderTop: "3px #1677ff inset" }
                        : { background: token.colorBgContainerDisabled, paddingTop: "2px" }
                }
                title={tonieCard.tonieInfo.series ? tonieCard.tonieInfo.series : t("tonies.unsetTonie")}
                cover={
                    <img
                        alt={`${tonieCard.tonieInfo.series} - ${tonieCard.tonieInfo.episode}`}
                        src={tonieCard.tonieInfo.picture}
                        style={tonieCard.tonieInfo.picture.includes("unknown") ? { paddingTop: "10px" } : {}}
                    />
                }
                actions={actions}
            >
                <Meta title={`${tonieCard.tonieInfo.episode}`} description={tonieCard.uid} />
            </Card>
            {selectFileModal}
            {editModal}
            {informationModal}
        </>
    );
};
