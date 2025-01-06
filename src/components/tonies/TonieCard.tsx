import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, Divider, Form, Input, Modal, Tooltip, Typography, theme } from "antd";
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
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";

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
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();
    const [keyInfoModal, setKeyInfoModal] = useState(0);
    const [keyRadioStreamSearch, setKeyRadioStreamSearch] = useState(0);
    const [keyTonieArticleSearch, setKeyTonieArticleSearch] = useState(0);
    const [keySelectFileFileBrowser, setKeySelectFileFileBrowser] = useState(0);

    const [localTonieCard, setLocalTonieCard] = useState<TonieCardProps>(tonieCard);
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

    const [activeSource, setActiveSource] = useState(localTonieCard.source); // the stored source
    const [tempActiveSource, setTempActiveSource] = useState(localTonieCard.source); // the previously selected, but not saved source
    const [selectedSource, setSelectedSource] = useState(activeSource); // the current selected source
    const [tempSelectedSource, setTempSelectedSource] = useState(selectedSource); // the current selected but not confirmed source
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
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.errorFetchingUpdatedCard"),
                t("tonies.messages.errorFetchingUpdatedCardDetails", {
                    model: modelTitle,
                    ruid: localTonieCard.ruid,
                }).replace(' "" ', "") + error,
                t("tonies.title")
            );
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
            setTempSelectedSource(filePath);
        } else {
            setTempSelectedSource(activeSource);
        }
    };

    const showFileSelectModal = () => {
        setKeySelectFileFileBrowser(keySelectFileFileBrowser + 1);
        setSelectFileModalOpen(true);
    };

    const handleCancelSelectFile = () => {
        setSelectedSource(tempActiveSource ? tempActiveSource : activeSource);
        setSelectFileModalOpen(false);
    };

    const showModelModal = () => {
        setSelectedModel(activeModel);
        setSelectedSource(activeSource);
        setKeyRadioStreamSearch(keyRadioStreamSearch + 1);
        setKeyTonieArticleSearch(keyTonieArticleSearch + 1);
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
                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonies.messages.liveEnabled"),
                    t("tonies.messages.liveEnabledDetails", { model: modelTitle, ruid: localTonieCard.ruid }).replace(
                        ' "" ',
                        " "
                    ),
                    t("tonies.title")
                );
            } else {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonies.messages.liveDisabled"),
                    t("tonies.messages.liveDisabledDetails", { model: modelTitle, ruid: localTonieCard.ruid }).replace(
                        ' "" ',
                        " "
                    ),
                    t("tonies.title")
                );
            }
            fetchUpdatedTonieCard();
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.couldNotChangeLiveFlag"),
                t("tonies.messages.couldNotChangeLiveFlagDetails", {
                    model: modelTitle,
                    ruid: localTonieCard.ruid,
                }).replace(' "" ', "") + error,
                t("tonies.title")
            );
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
                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonies.messages.cloudAccessBlocked"),
                    t("tonies.messages.cloudAccessBlockedDetails", {
                        model: modelTitle,
                        ruid: localTonieCard.ruid,
                    }).replace(' "" ', " "),
                    t("tonies.title")
                );
            } else {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonies.messages.cloudAccessEnabled"),
                    t("tonies.messages.cloudAccessEnabledDetails", {
                        model: modelTitle,
                        ruid: localTonieCard.ruid,
                    }).replace(' "" ', " "),
                    t("tonies.title")
                );
            }
            fetchUpdatedTonieCard();
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.couldNotChangeCloudFlag"),
                t("tonies.messages.couldNotChangeCloudFlagDetails", {
                    model: modelTitle,
                    ruid: localTonieCard.ruid,
                }).replace(' "" ', "") + error,
                t("tonies.title")
            );
        }
    };

    const handlePlayPauseClick = async (url: string) => {
        playAudio(url, showSourceInfoPicture ? localTonieCard.sourceInfo : localTonieCard.tonieInfo, localTonieCard);
    };

    const handleBackgroundDownload = async () => {
        const path = localTonieCard.downloadTriggerUrl;
        setDownloadTriggerUrl("");
        const key = "loading" + localTonieCard.ruid;

        try {
            addLoadingNotification(
                key,
                t("tonies.messages.downloading"),
                t("tonies.messages.downloadingDetails", {
                    model: modelTitle,
                    ruid: localTonieCard.ruid,
                }).replace(' "" ', " ")
            );

            const response = await api.apiGetTeddyCloudApiRaw(path);
            // blob used that message is shown after download finished
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const blob = await response.blob();
            closeLoadingNotification(key);

            addNotification(
                NotificationTypeEnum.Success,
                t("tonies.messages.downloadedFile"),
                t("tonies.messages.downloadedFileDetails", { model: modelTitle, ruid: localTonieCard.ruid }).replace(
                    ' "" ',
                    " "
                ),
                t("tonies.title")
            );
            fetchUpdatedTonieCard();
        } catch (error) {
            closeLoadingNotification(key);
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.errorDuringDownload"),
                t("tonies.messages.errorDuringDownloadDetails", {
                    model: modelTitle,
                    ruid: localTonieCard.ruid,
                }).replace(' "" ', "") + error,
                t("tonies.title")
            );
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

            addNotification(
                NotificationTypeEnum.Success,
                t("tonies.messages.setTonieToModelSuccessful", {
                    selectedModel: selectedModel ? selectedModel : t("tonies.messages.setToEmptyValue"),
                }),
                t("tonies.messages.setTonieToModelSuccessfulDetails", {
                    ruid: localTonieCard.ruid,
                    selectedModel: selectedModel ? selectedModel : t("tonies.messages.setToEmptyValue"),
                }),
                t("tonies.title")
            );
            setInputValidationModel({ validateStatus: "", help: "" });
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.setTonieToModelFailed"),
                t("tonies.messages.setTonieToModelFailedDetails", {
                    ruid: localTonieCard.ruid,
                }) + error,
                t("tonies.title")
            );
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
            addNotification(
                NotificationTypeEnum.Success,
                t("tonies.messages.setTonieToSourceSuccessful"),
                t("tonies.messages.setTonieToSourceSuccessfulDetails", {
                    ruid: localTonieCard.ruid,
                    selectedSource: selectedSource ? selectedSource : t("tonies.messages.setToEmptyValue"),
                }),
                t("tonies.title")
            );
            setInputValidationSource({ validateStatus: "", help: "" });
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.setTonieToSourceFailed"),
                t("tonies.messages.setTonieToSourceFailedDetails", {
                    ruid: localTonieCard.ruid,
                }) + error,
                t("tonies.title")
            );
            setInputValidationSource({
                validateStatus: "error",
                help: t("tonies.messages.setTonieToSourceFailed") + error,
            });
            throw error;
        }

        if (!isNoCloud) {
            handleNoCloudClick();
        }
        if (selectedSource.startsWith("http") && !isLive) {
            handleLiveClick();
        } else if (!selectedSource.startsWith("http") && isLive) {
            handleLiveClick();
        }
    };

    const handleModelInputChange = (e: any) => {
        setSelectedModel(e.target.value);
    };
    const handleSourceInputChange = (e: any) => {
        setSelectedSource(e.target.value);
        setTempSelectedSource(e.target.value);
    };

    const toniePlayedOn = lastRUIDs
        .filter(([ruid]) => ruid === localTonieCard.ruid)
        .map(([, ruidTime, boxName]) => ({ ruidTime, boxName }));

    const searchModelResultChanged = (newValue: string) => {
        setSelectedModel(newValue);
    };

    const searchRadioResultChanged = (newValue: string) => {
        setSelectedSource(newValue);
        setTempActiveSource(newValue);
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
            onCancel={() => {
                setIsEditModalOpen(false);
                setTempSelectedSource("");
            }}
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
                        key="source"
                        value={selectedSource}
                        width="auto"
                        onChange={handleSourceInputChange}
                        addonBefore={[
                            <CloseOutlined
                                key="close-source"
                                onClick={() => {
                                    setSelectedSource("");
                                    setInputValidationSource({ validateStatus: "", help: "" });
                                }}
                            />,
                            <Divider key="divider-source" type="vertical" style={{ height: 16 }} />,
                            <RollbackOutlined
                                key="rollback-source"
                                onClick={() => {
                                    setSelectedSource(activeSource);
                                    setTempSelectedSource(activeSource);
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
                        key={keyRadioStreamSearch}
                    />
                </Form.Item>
            </div>
            <Divider orientation="left" orientationMargin="0">
                {t("tonies.editModal.model")}
            </Divider>
            <div>
                <Form.Item validateStatus={inputValidationModel.validateStatus} help={inputValidationModel.help}>
                    <Input
                        key="model"
                        value={selectedModel}
                        width="auto"
                        onChange={handleModelInputChange}
                        addonBefore={[
                            <CloseOutlined
                                key="close-model"
                                onClick={() => {
                                    setSelectedModel("");
                                    setInputValidationModel({ validateStatus: "", help: "" });
                                }}
                            />,
                            <Divider key="divider-model" type="vertical" style={{ height: 16 }} />,
                            <RollbackOutlined
                                key="rollback-model"
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
                        key={keyTonieArticleSearch}
                    />
                </Form.Item>
            </div>
        </Modal>
    );

    const selectFileModalFooter = (
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
            <Button
                type="primary"
                onClick={() => {
                    setSelectedSource(tempSelectedSource);
                    setTempActiveSource(tempSelectedSource);
                    setSelectFileModalOpen(false);
                }}
            >
                {t("tonies.selectFileModal.ok")}
            </Button>
        </div>
    );

    const selectFileModal = (
        <Modal
            className="sticky-footer"
            title={t("tonies.selectFileModal.selectFile")}
            open={isSelectFileModalOpen}
            onCancel={handleCancelSelectFile}
            width="auto"
            footer={selectFileModalFooter}
        >
            <SelectFileFileBrowser
                key={keySelectFileFileBrowser}
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
