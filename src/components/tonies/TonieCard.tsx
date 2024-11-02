import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, Divider, Form, Input, Modal, Tooltip, Typography, message, theme } from "antd";
import {
    CloseOutlined,
    CloudSyncOutlined,
    DownloadOutlined,
    EditOutlined,
    FolderOpenOutlined,
    InfoCircleOutlined,
    PlayCircleOutlined,
    RetweetOutlined,
    RollbackOutlined,
    SaveFilled,
} from "@ant-design/icons";

import { TonieCardProps } from "../../types/tonieTypes";

import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";

import { useAudioContext } from "../audio/AudioContext";
import { TonieArticleSearch } from "./TonieArticleSearch";
import { SelectFileFileBrowser } from "../utils/SelectFileFileBrowser";
import { RadioStreamSearch } from "../utils/RadioStreamSearch";
import TonieInformationModal from "../utils/TonieInformationModal";
import LanguageFlagSVG from "../../utils/languageUtil";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Meta } = Card;
const { Text } = Typography;
const { useToken } = theme;

export const TonieCard: React.FC<{
    tonieCard: TonieCardProps;
    lastRUIDs: Array<[string, string, string]>;
    overlay: string;
    readOnly: boolean;
    defaultLanguage?: string;
    showSourceInfo?: boolean;
    onHide: (ruid: string) => void;
    onUpdate: (updatedTonieCard: TonieCardProps) => void;
}> = ({ tonieCard, lastRUIDs, overlay, readOnly, defaultLanguage = "", showSourceInfo = true, onHide, onUpdate }) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const [keyInfoModal, setKeyInfoModal] = useState(0);
    const [localTonieCard, setLocalTonieCard] = useState<TonieCardProps>(tonieCard);
    const [messageApi, contextHolder] = message.useMessage();
    const [isNoCloud, setIsNoCloud] = useState(localTonieCard.nocloud);
    const [isLive, setIsLive] = useState(localTonieCard.live);
    const [downloadTriggerUrl, setDownloadTriggerUrl] = useState(localTonieCard.downloadTriggerUrl);
    const { playAudio } = useAudioContext();
    const [isInformationModalOpen, setInformationModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSelectFileModalOpen, setSelectFileModalOpen] = useState(false);

    const [activeModel, setActiveModel] = useState(localTonieCard.tonieInfo.model);
    const [selectedModel, setSelectedModel] = useState("");
    const [inputValidationModel, setInputValidationModel] = useState<{
        validateStatus: ValidateStatus;
        help: string;
    }>({
        validateStatus: "",
        help: "",
    });

    const [activeSource, setActiveSource] = useState(localTonieCard.source);
    const [selectedSource, setSelectedSource] = useState("");
    const [inputValidationSource, setInputValidationSource] = useState<{
        validateStatus: ValidateStatus;
        help: string;
    }>({
        validateStatus: "",
        help: "",
    });

    type ValidateStatus = "" | "success" | "warning" | "error" | "validating" | undefined;

    const fetchUpdatedTonieCard = async () => {
        try {
            const updatedTonieCard = await api.apiGetTagInfo(localTonieCard.ruid, overlay);
            setLocalTonieCard(updatedTonieCard);
            onUpdate(updatedTonieCard);
        } catch (error) {
            message.error("Error fetching updated card: " + error);
        }
    };

    const modelTitle =
        `${localTonieCard.tonieInfo.series}` +
        (localTonieCard.tonieInfo.episode ? ` - ${localTonieCard.tonieInfo.episode}` : "");

    const sourceTitle =
        "sourceInfo" in localTonieCard
            ? `${localTonieCard.sourceInfo.series}` +
              (localTonieCard.sourceInfo.episode ? ` - ${localTonieCard.sourceInfo.episode}` : "")
            : "";

    const showSourceInfoPicture =
        showSourceInfo &&
        "sourceInfo" in localTonieCard &&
        ((localTonieCard.sourceInfo.picture !== localTonieCard.tonieInfo.picture && modelTitle !== sourceTitle) ||
            (localTonieCard.sourceInfo.picture === localTonieCard.tonieInfo.picture && modelTitle !== sourceTitle));

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
        setSelectFileModalOpen(true);
    };

    const handleCancelSelectFile = () => {
        setSelectedSource(activeSource);
        setSelectFileModalOpen(false);
    };

    const showModelModal = () => {
        setSelectedModel(activeModel);
        setSelectedSource(activeSource);
        setIsEditModalOpen(true);
    };

    const handleSaveChanges = async () => {
        try {
            if (activeSource !== selectedSource) {
                await handleSourceSave();
            }
            if (activeModel !== selectedModel) {
                await handleModelSave();
            }
        } catch (error) {
            fetchUpdatedTonieCard();
            return;
        }
        setIsEditModalOpen(false);
        fetchUpdatedTonieCard();
    };

    const handleLiveClick = async () => {
        try {
            await api.apiPostTeddyCloudContentJson(localTonieCard.ruid, "live=" + !isLive, overlay);
            setIsLive(!isLive);
            if (!isLive) {
                message.success(t("tonies.messages.liveEnabled"));
            } else {
                message.success(t("tonies.messages.liveDisabled"));
            }
            fetchUpdatedTonieCard();
        } catch (error) {
            message.error(t("tonies.messages.couldNotChangeLiveFlag") + error);
        }
    };

    const handleNoCloudClick = async () => {
        try {
            await api.apiPostTeddyCloudContentJson(localTonieCard.ruid, "nocloud=" + !isNoCloud, overlay);
            setLocalTonieCard({
                ...localTonieCard,
                nocloud: !isNoCloud,
            });
            setIsNoCloud(!isNoCloud);
            if (!isNoCloud) {
                message.success(t("tonies.messages.cloudAccessBlocked"));
            } else {
                message.success(t("tonies.messages.cloudAccessEnabled"));
            }
            fetchUpdatedTonieCard();
        } catch (error) {
            message.error(t("tonies.messages.couldNotChangeCloudFlag") + error);
        }
    };

    const handlePlayPauseClick = async (url: string) => {
        console.log(localTonieCard);
        playAudio(url, showSourceInfoPicture ? localTonieCard.sourceInfo : localTonieCard.tonieInfo, localTonieCard);
    };

    const handleBackgroundDownload = async () => {
        const path = localTonieCard.downloadTriggerUrl;
        setDownloadTriggerUrl("");
        try {
            messageApi.open({
                type: "loading",
                content: t("tonies.messages.downloading"),
                duration: 0,
            });
            const response = await api.apiGetTeddyCloudApiRaw(path);

            // blob used that message is shown after download finished
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const blob = await response.blob();

            messageApi.destroy();
            messageApi.open({
                type: "success",
                content: t("tonies.messages.downloadedFile"),
            });
            fetchUpdatedTonieCard();
        } catch (error) {
            messageApi.destroy();
            messageApi.open({
                type: "error",
                content: t("tonies.messages.errorDuringDownload") + error,
            });
            // this could be a kind of problem if auth is necessary for accessing the API
            setDownloadTriggerUrl(import.meta.env.VITE_APP_TEDDYCLOUD_API_URL + path);
        }
    };

    const handleModelSave = async () => {
        try {
            await api.apiPostTeddyCloudContentJson(
                localTonieCard.ruid,
                "tonie_model=" + encodeURIComponent(selectedModel),
                overlay
            );
            setActiveModel(selectedModel);
            message.success(
                t("tonies.messages.setTonieToModelSuccessful", {
                    selectedModel: selectedModel ? selectedModel : t("tonies.messages.setToEmptyValue"),
                })
            );
            setInputValidationModel({ validateStatus: "", help: "" });
        } catch (error) {
            message.error(t("tonies.messages.setTonieToModelFailed") + error);
            setInputValidationModel({
                validateStatus: "error",
                help: t("tonies.messages.setTonieToModelFailed") + error,
            });
            throw error;
        }
    };

    const handleSourceSave = async () => {
        try {
            await api.apiPostTeddyCloudContentJson(
                localTonieCard.ruid,
                "source=" + encodeURIComponent(selectedSource),
                overlay
            );
            setActiveSource(selectedSource);
            message.success(
                t("tonies.messages.setTonieToSourceSuccessful", {
                    selectedSource: selectedSource ? selectedSource : t("tonies.messages.setToEmptyValue"),
                })
            );
            setInputValidationSource({ validateStatus: "", help: "" });
        } catch (error) {
            message.error(t("tonies.messages.setTonieToSourceFailed") + error);
            setInputValidationSource({
                validateStatus: "error",
                help: t("tonies.messages.setTonieToSourceFailed") + error,
            });
            throw error;
        }

        if (!isNoCloud) {
            handleNoCloudClick();
        }
    };

    const handleModelInputChange = (e: any) => {
        setSelectedModel(e.target.value);
    };
    const handleSourceInputChange = (e: any) => {
        setSelectedSource(e.target.value);
    };

    const toniePlayedOn = lastRUIDs
        .filter(([ruid]) => ruid === localTonieCard.ruid)
        .map(([, ruidTime, boxName]) => ({ ruidTime, boxName }));

    const searchModelResultChanged = (newValue: string) => {
        setSelectedModel(newValue);
    };

    const searchRadioResultChanged = (newValue: string) => {
        setSelectedSource(newValue);
    };

    const editModalTitel = (
        <>
            <h3 style={{ lineHeight: 0 }}>
                {t("tonies.editModal.title")}
                {localTonieCard.tonieInfo.model ? " (" + localTonieCard.tonieInfo.model + ")" : ""}
            </h3>
            {localTonieCard.tonieInfo.series ? <Text type="secondary">{modelTitle}</Text> : " "}
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
            width={700}
        >
            <Divider orientation="left" orientationMargin="0">
                {t("tonies.editModal.source")}
            </Divider>
            <div>
                <Form.Item validateStatus={inputValidationSource.validateStatus} help={inputValidationSource.help}>
                    <Input
                        value={selectedSource}
                        width="auto"
                        onChange={handleSourceInputChange}
                        addonBefore={[
                            <CloseOutlined
                                onClick={() => {
                                    setSelectedSource("");
                                    setInputValidationSource({ validateStatus: "", help: "" });
                                }}
                            />,
                            <Divider type="vertical" style={{ height: 16 }} />,

                            <RollbackOutlined
                                onClick={() => {
                                    setSelectedSource(activeSource);
                                    setInputValidationSource({ validateStatus: "", help: "" });
                                }}
                                style={{
                                    color: activeSource === selectedSource ? token.colorTextDisabled : token.colorText,
                                    cursor: activeSource === selectedSource ? "default" : "pointer",
                                }}
                            />,
                        ]}
                        addonAfter={<FolderOpenOutlined onClick={() => showFileSelectModal()} />}
                    />
                    <RadioStreamSearch
                        placeholder={t("tonies.editModal.placeholderSearchForARadioStream")}
                        onChange={searchRadioResultChanged}
                    />
                </Form.Item>
            </div>
            <Divider orientation="left" orientationMargin="0">
                {t("tonies.editModal.model")}
            </Divider>
            <div>
                <Form.Item validateStatus={inputValidationModel.validateStatus} help={inputValidationModel.help}>
                    <Input
                        value={selectedModel}
                        width="auto"
                        onChange={handleModelInputChange}
                        addonBefore={[
                            <CloseOutlined
                                onClick={() => {
                                    setSelectedModel("");
                                    setInputValidationModel({ validateStatus: "", help: "" });
                                }}
                            />,
                            <Divider type="vertical" style={{ height: 16 }} />,
                            <RollbackOutlined
                                onClick={() => {
                                    setSelectedModel(activeModel);
                                    setInputValidationModel({ validateStatus: "", help: "" });
                                }}
                                style={{
                                    color: activeModel === selectedModel ? token.colorTextDisabled : token.colorText,
                                    cursor: activeModel === selectedModel ? "default" : "pointer",
                                }}
                            />,
                        ]}
                    />
                    <TonieArticleSearch
                        placeholder={t("tonies.editModal.placeholderSearchForAModel")}
                        onChange={searchModelResultChanged}
                    />
                </Form.Item>
            </div>
        </Modal>
    );

    const selectModalFooter = (
        <div
            style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                padding: "16px 0",
                margin: "-24px -24px -12px -24px",
                background: token.colorBgElevated,
            }}
        >
            <Button onClick={handleCancelSelectFile}>{t("tonies.selectFileModal.cancel")}</Button>
            <Button type="primary" onClick={() => setSelectFileModalOpen(false)}>
                {t("tonies.selectFileModal.ok")}
            </Button>
        </div>
    );

    const selectFileModal = (
        <Modal
            className="sticky-footer"
            title={t("tonies.selectFileModal.selectFile")}
            open={isSelectFileModalOpen}
            onOk={() => setSelectFileModalOpen(false)}
            onCancel={handleCancelSelectFile}
            width="auto"
            footer={selectModalFooter}
        >
            <SelectFileFileBrowser
                special="library"
                maxSelectedRows={1}
                trackUrl={false}
                filetypeFilter={[".taf", ".tap"]}
                onFileSelectChange={handleFileSelectChange}
            />
        </Modal>
    );

    const actions = readOnly
        ? [
              <InfoCircleOutlined
                  key="info"
                  onClick={() => {
                      setKeyInfoModal(keyInfoModal + 1);
                      setInformationModalOpen(true);
                  }}
              />,
              localTonieCard.valid || activeSource.startsWith("http") ? (
                  <PlayCircleOutlined
                      key="playpause"
                      onClick={() =>
                          handlePlayPauseClick(
                              localTonieCard.valid
                                  ? import.meta.env.VITE_APP_TEDDYCLOUD_API_URL + localTonieCard.audioUrl
                                  : activeSource
                          )
                      }
                  />
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
              <InfoCircleOutlined
                  key="info"
                  onClick={() => {
                      setKeyInfoModal(keyInfoModal + 1);
                      setInformationModalOpen(true);
                  }}
              />,
              <EditOutlined key="edit" onClick={showModelModal} />,
              localTonieCard.valid || activeSource.startsWith("http") ? (
                  <PlayCircleOutlined
                      key="playpause"
                      onClick={() =>
                          handlePlayPauseClick(
                              localTonieCard.valid
                                  ? import.meta.env.VITE_APP_TEDDYCLOUD_API_URL + localTonieCard.audioUrl
                                  : activeSource
                          )
                      }
                  />
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
                key={localTonieCard.ruid}
                size="small"
                style={
                    toniePlayedOn && toniePlayedOn.length > 0
                        ? { background: token.colorBgContainerDisabled, borderTop: "3px #1677ff inset" }
                        : { background: token.colorBgContainerDisabled, paddingTop: "2px" }
                }
                title={
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                            {localTonieCard.tonieInfo.series ? localTonieCard.tonieInfo.series : t("tonies.unsetTonie")}
                        </div>
                        {defaultLanguage !== localTonieCard.tonieInfo.language ? (
                            <Tooltip
                                placement="top"
                                zIndex={2}
                                title={t("languageUtil." + localTonieCard.tonieInfo.language)}
                            >
                                <Text style={{ height: 20, width: "auto" }}>
                                    <LanguageFlagSVG countryCode={localTonieCard.tonieInfo.language} height={20} />
                                </Text>
                            </Tooltip>
                        ) : (
                            ""
                        )}
                    </div>
                }
                cover={
                    <div style={{ position: "relative" }}>
                        <img
                            alt={`${localTonieCard.tonieInfo.series} - ${localTonieCard.tonieInfo.episode}`}
                            src={
                                localTonieCard.tonieInfo.picture ? localTonieCard.tonieInfo.picture : "/img_unknown.png"
                            }
                            style={
                                localTonieCard.tonieInfo.picture.endsWith("img_unknown.png")
                                    ? { padding: 8, paddingTop: 10, width: "100%" }
                                    : { padding: 8, width: "100%" }
                            }
                        />
                        {showSourceInfoPicture ? (
                            <Tooltip
                                title={
                                    `${sourceTitle}`
                                        ? t("tonies.alternativeSource", {
                                              originalTonie: '"' + modelTitle + '"',
                                              assignedContent: '"' + sourceTitle + '"',
                                          }).replace(' "" ', " ")
                                        : t("tonies.alternativeSourceUnknown", {
                                              originalTonie: '"' + modelTitle + '"',
                                          }).replace(' "" ', " ")
                                }
                                placement="bottom"
                            >
                                <img
                                    src={localTonieCard.sourceInfo.picture}
                                    alt=""
                                    style={{
                                        bottom: 0,
                                        padding: 8,
                                        position: "absolute",
                                        right: 20,
                                        height: "50%",
                                        width: "auto",
                                    }}
                                />
                            </Tooltip>
                        ) : (
                            ""
                        )}
                    </div>
                }
                actions={actions}
            >
                <Meta title={`${localTonieCard.tonieInfo.episode}`} description={localTonieCard.uid} />
            </Card>
            <TonieInformationModal
                open={isInformationModalOpen}
                onClose={() => setInformationModalOpen(false)}
                tonieCardOrTAFRecord={localTonieCard}
                showSourceInfo={showSourceInfo}
                readOnly={readOnly}
                lastRUIDs={lastRUIDs}
                onHide={onHide}
                overlay={overlay}
                key={keyInfoModal}
            />
            {selectFileModal}
            {editModal}
        </>
    );
};
