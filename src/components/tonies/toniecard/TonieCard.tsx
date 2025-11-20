import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Checkbox, Tooltip, Typography, theme } from "antd";
import {
    CloudSyncOutlined,
    DownloadOutlined,
    EditOutlined,
    InfoCircleOutlined,
    PlayCircleOutlined,
    RetweetOutlined,
    StopOutlined,
} from "@ant-design/icons";

import { TonieCardProps } from "../../../types/tonieTypes";

import { defaultAPIConfig } from "../../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../../api";

import { useAudioContext } from "../../audio/AudioContext";
import TonieInformationModal from "../common/TonieInformationModal";
import { LanguageFlagIcon } from "../../../utils/languageUtil";
import { useTeddyCloud } from "../../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../../types/teddyCloudNotificationTypes";
import { TonieEditModal } from "./modals/TonieEditModal";
import { TonieSelectFileModal } from "./modals/TonieSelectFileModal";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Meta } = Card;
const { Text } = Typography;
const { useToken } = theme;

type ValidateStatus = "" | "success" | "warning" | "error" | "validating" | undefined;

export const TonieCard: React.FC<{
    tonieCard: TonieCardProps;
    lastRUIDs: Array<[string, string, string]>;
    overlay: string;
    readOnly: boolean;
    defaultLanguage?: string;
    showSourceInfo?: boolean;
    onHide: (ruid: string) => void;
    onUpdate: (updatedTonieCard: TonieCardProps) => void;
    selectionMode?: boolean;
    selected?: boolean;
    onToggleSelect: (ruid: string) => void;
}> = ({
    tonieCard,
    lastRUIDs,
    overlay,
    readOnly,
    defaultLanguage = "",
    showSourceInfo = true,
    onHide,
    onUpdate,
    selectionMode = false,
    selected = false,
    onToggleSelect,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { addNotification, addLoadingNotification, closeLoadingNotification, toniesCloudAvailable } = useTeddyCloud();
    const { playAudio } = useAudioContext();

    // ------------------------
    // UI / Modal State
    // ------------------------

    const [keyInfoModal, setKeyInfoModal] = useState(0);
    const [keyRadioStreamSearch, setKeyRadioStreamSearch] = useState(0);
    const [keyTonieArticleSearch, setKeyTonieArticleSearch] = useState(0);
    const [keySelectFileFileBrowser, setKeySelectFileFileBrowser] = useState(0);

    const [isInformationModalOpen, setInformationModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSelectFileModalOpen, setSelectFileModalOpen] = useState(false);

    // ------------------------
    // Form / Input State
    // ------------------------

    const [selectedModel, setSelectedModel] = useState<string>(tonieCard.tonieInfo.model || "");
    const [selectedSource, setSelectedSource] = useState<string>(tonieCard.source || "");
    const [tempSelectedSource, setTempSelectedSource] = useState<string>(tonieCard.source || "");

    useEffect(() => {
        setSelectedModel(tonieCard.tonieInfo.model || "");
    }, [tonieCard.tonieInfo.model]);

    useEffect(() => {
        setSelectedSource(tonieCard.source || "");
        setTempSelectedSource(tonieCard.source || "");
    }, [tonieCard.source]);

    const [inputValidationModel, setInputValidationModel] = useState<{
        validateStatus: ValidateStatus;
        help: string;
    }>({
        validateStatus: "",
        help: "",
    });

    const [inputValidationSource, setInputValidationSource] = useState<{
        validateStatus: ValidateStatus;
        help: string;
    }>({
        validateStatus: "",
        help: "",
    });

    // ------------------------
    // Derived data
    // ------------------------

    const modelTitle =
        `${tonieCard.tonieInfo.series}` + (tonieCard.tonieInfo.episode ? ` - ${tonieCard.tonieInfo.episode}` : "");

    const sourceTitle =
        "sourceInfo" in tonieCard
            ? `${tonieCard.sourceInfo.series}` +
              (tonieCard.sourceInfo.episode ? ` - ${tonieCard.sourceInfo.episode}` : "")
            : "";

    const showSourceInfoPicture =
        showSourceInfo &&
        "sourceInfo" in tonieCard &&
        ((tonieCard.sourceInfo.picture !== tonieCard.tonieInfo.picture && modelTitle !== sourceTitle) ||
            (tonieCard.sourceInfo.picture === tonieCard.tonieInfo.picture && modelTitle !== sourceTitle));

    const toniePlayedOn = lastRUIDs
        .filter(([ruid]) => ruid === tonieCard.ruid)
        .map(([, ruidTime, boxName]) => ({ ruidTime, boxName }));

    const picture = tonieCard.tonieInfo.picture || "/img_unknown.png";
    const pictureLooksUnknown = picture.endsWith("img_unknown.png");

    const hasPendingChanges =
        selectedSource !== (tonieCard.source || "") || selectedModel !== (tonieCard.tonieInfo.model || "");

    // ------------------------
    // API helper
    // ------------------------

    const fetchUpdatedTonieCard = async () => {
        try {
            const updatedTonieCard = await api.apiGetTagInfo(tonieCard.ruid, overlay);
            onUpdate(updatedTonieCard);
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.errorFetchingUpdatedCard"),
                t("tonies.messages.errorFetchingUpdatedCardDetails", {
                    model: modelTitle,
                    ruid: tonieCard.ruid,
                }).replace(' "" ', "") + error,
                t("tonies.title")
            );
        }
    };

    // ------------------------
    // Handlers – feature flags
    // ------------------------

    const handleLiveClick = async () => {
        try {
            const nextLive = !tonieCard.live;
            await api.apiPostTeddyCloudContentJson(tonieCard.ruid, "live=" + nextLive, overlay);

            if (nextLive) {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonies.messages.liveEnabled"),
                    t("tonies.messages.liveEnabledDetails", { model: modelTitle, ruid: tonieCard.ruid }).replace(
                        ' "" ',
                        " "
                    ),
                    t("tonies.title")
                );
            } else {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonies.messages.liveDisabled"),
                    t("tonies.messages.liveDisabledDetails", { model: modelTitle, ruid: tonieCard.ruid }).replace(
                        ' "" ',
                        " "
                    ),
                    t("tonies.title")
                );
            }

            await fetchUpdatedTonieCard();
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.couldNotChangeLiveFlag"),
                t("tonies.messages.couldNotChangeLiveFlagDetails", {
                    model: modelTitle,
                    ruid: tonieCard.ruid,
                }).replace(' "" ', "") + error,
                t("tonies.title")
            );
        }
    };

    const handleNoCloudClick = async () => {
        try {
            const nextNoCloud = !tonieCard.nocloud;
            await api.apiPostTeddyCloudContentJson(tonieCard.ruid, "nocloud=" + nextNoCloud, overlay);

            if (nextNoCloud) {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonies.messages.cloudAccessBlocked"),
                    t("tonies.messages.cloudAccessBlockedDetails", {
                        model: modelTitle,
                        ruid: tonieCard.ruid,
                    }).replace(' "" ', " "),
                    t("tonies.title")
                );
            } else {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonies.messages.cloudAccessEnabled"),
                    t("tonies.messages.cloudAccessEnabledDetails", {
                        model: modelTitle,
                        ruid: tonieCard.ruid,
                    }).replace(' "" ', " "),
                    t("tonies.title")
                );
            }

            await fetchUpdatedTonieCard();
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.couldNotChangeCloudFlag"),
                t("tonies.messages.couldNotChangeCloudFlagDetails", {
                    model: modelTitle,
                    ruid: tonieCard.ruid,
                }).replace(' "" ', "") + error,
                t("tonies.title")
            );
        }
    };

    // ------------------------
    // Handlers – playback / download
    // ------------------------

    const handlePlayPauseClick = (url: string) => {
        playAudio(url, showSourceInfoPicture ? tonieCard.sourceInfo : tonieCard.tonieInfo, tonieCard);
    };

    const handleBackgroundDownload = async () => {
        const path = tonieCard.downloadTriggerUrl;
        if (!path) return;

        const key = "loading" + tonieCard.ruid;

        try {
            addLoadingNotification(
                key,
                t("tonies.messages.downloading"),
                t("tonies.messages.downloadingDetails", {
                    model: modelTitle,
                    ruid: tonieCard.ruid,
                }).replace(' "" ', " ")
            );

            const response = await api.apiGetTeddyCloudApiRaw(path);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const blob = await response.blob();
            closeLoadingNotification(key);

            addNotification(
                NotificationTypeEnum.Success,
                t("tonies.messages.downloadedFile"),
                t("tonies.messages.downloadedFileDetails", { model: modelTitle, ruid: tonieCard.ruid }).replace(
                    ' "" ',
                    " "
                ),
                t("tonies.title")
            );
            await fetchUpdatedTonieCard();
        } catch (error) {
            closeLoadingNotification(key);
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.errorDuringDownload"),
                t("tonies.messages.errorDuringDownloadDetails", {
                    model: modelTitle,
                    ruid: tonieCard.ruid,
                }).replace(' "" ', "") + error,
                t("tonies.title")
            );
        }
    };

    // ------------------------
    // Handlers – model/source persistence
    // ------------------------

    const handleModelSave = async () => {
        try {
            await api.apiPostTeddyCloudContentJson(
                tonieCard.ruid,
                "tonie_model=" + encodeURIComponent(selectedModel),
                overlay
            );

            addNotification(
                NotificationTypeEnum.Success,
                t("tonies.messages.setTonieToModelSuccessful", {
                    selectedModel: selectedModel ? selectedModel : t("tonies.messages.setToEmptyValue"),
                }),
                t("tonies.messages.setTonieToModelSuccessfulDetails", {
                    ruid: tonieCard.ruid,
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
                    ruid: tonieCard.ruid,
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
                tonieCard.ruid,
                "source=" + encodeURIComponent(selectedSource),
                overlay
            );

            addNotification(
                NotificationTypeEnum.Success,
                t("tonies.messages.setTonieToSourceSuccessful"),
                t("tonies.messages.setTonieToSourceSuccessfulDetails", {
                    ruid: tonieCard.ruid,
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
                    ruid: tonieCard.ruid,
                }) + error,
                t("tonies.title")
            );
            setInputValidationSource({
                validateStatus: "error",
                help: t("tonies.messages.setTonieToSourceFailed") + error,
            });
            throw error;
        }

        // Flags nachziehen
        if (!tonieCard.nocloud) {
            await handleNoCloudClick();
        }
        if (selectedSource.startsWith("http") && !tonieCard.live) {
            await handleLiveClick();
        } else if (!selectedSource.startsWith("http") && tonieCard.live) {
            await handleLiveClick();
        }
    };

    const handleSaveChanges = async () => {
        try {
            if ((tonieCard.source || "") !== selectedSource) {
                await handleSourceSave();
            }
            if ((tonieCard.tonieInfo.model || "") !== selectedModel) {
                await handleModelSave();
            }
        } catch {
            await fetchUpdatedTonieCard();
            return;
        }
        setIsEditModalOpen(false);
        await fetchUpdatedTonieCard();
    };

    // ------------------------
    // Handlers – File selection
    // ------------------------

    const handleFileSelectChange = (files: any[], path: string, special: string) => {
        if (files && files.length === 1) {
            const prefix = special === "library" ? "lib:/" : "content:/";
            const filePath = prefix + path + "/" + files[0].name;
            setTempSelectedSource(filePath);
        } else {
            setTempSelectedSource(selectedSource);
        }
    };

    const handleCancelSelectFile = () => {
        setTempSelectedSource(selectedSource);
        setSelectFileModalOpen(false);
    };

    const handleConfirmSelectFile = () => {
        setSelectedSource(tempSelectedSource);
        setSelectFileModalOpen(false);
    };

    const showFileSelectModal = () => {
        setKeySelectFileFileBrowser((prev) => prev + 1);
        setSelectFileModalOpen(true);
    };

    // ------------------------
    // Handlers – Search
    // ------------------------

    const searchModelResultChanged = (newValue: string) => {
        setSelectedModel(newValue);
    };

    const searchRadioResultChanged = (newValue: string) => {
        setSelectedSource(newValue);
    };

    // ------------------------
    // Handlers – Modals
    // ------------------------

    const showModelModal = () => {
        setSelectedModel(tonieCard.tonieInfo.model || "");
        setSelectedSource(tonieCard.source || "");
        setTempSelectedSource(tonieCard.source || "");
        setKeyRadioStreamSearch((prev) => prev + 1);
        setKeyTonieArticleSearch((prev) => prev + 1);
        setIsEditModalOpen(true);
    };

    const editModalTitle = (
        <>
            <h3 style={{ lineHeight: 0 }}>
                {t("tonies.editModal.title")}
                {tonieCard.tonieInfo.model ? " (" + tonieCard.tonieInfo.model + ")" : ""}
            </h3>
            {tonieCard.tonieInfo.series ? <Text type="secondary">{modelTitle}</Text> : " "}
        </>
    );

    // ------------------------
    // Card actions
    // ------------------------

    const infoAction = (
        <InfoCircleOutlined
            key="info"
            onClick={() => {
                setKeyInfoModal((prev) => prev + 1);
                setInformationModalOpen(true);
            }}
        />
    );

    const playAction =
        tonieCard.valid || (tonieCard.source || "").startsWith("http") ? (
            <PlayCircleOutlined
                key="playpause"
                onClick={() =>
                    handlePlayPauseClick(
                        tonieCard.valid
                            ? import.meta.env.VITE_APP_TEDDYCLOUD_API_URL + tonieCard.audioUrl
                            : tonieCard.source
                    )
                }
            />
        ) : tonieCard.downloadTriggerUrl && tonieCard.downloadTriggerUrl.length > 0 && !readOnly ? (
            !toniesCloudAvailable ? (
                <Tooltip title={t("tonies.connectionToBoxineNotAvailable")}>
                    <div style={{ position: "relative", display: "inline-block" }}>
                        <StopOutlined
                            style={{
                                position: "absolute",
                                top: 4,
                                left: 0,
                                color: token.colorError,
                            }}
                        />
                        <DownloadOutlined />
                    </div>
                </Tooltip>
            ) : (
                <DownloadOutlined key="download" onClick={handleBackgroundDownload} />
            )
        ) : (
            <Tooltip placement="top" title={t("tonies.noPlayableContentHint")}>
                <PlayCircleOutlined key="playpause" style={{ cursor: "default", color: token.colorTextDisabled }} />
            </Tooltip>
        );

    const cloudAction = (
        <CloudSyncOutlined
            key="nocloud"
            className={tonieCard.nocloud ? "no-cloud" : "cloud"}
            style={
                readOnly
                    ? {
                          cursor: "default",
                          color: tonieCard.nocloud ? token.colorError : token.colorTextDisabled,
                      }
                    : {
                          color: tonieCard.nocloud ? token.colorError : token.colorTextDescription,
                      }
            }
            onClick={readOnly ? undefined : handleNoCloudClick}
        />
    );

    const liveAction = (
        <RetweetOutlined
            key="live"
            className={tonieCard.live ? "live" : "not-live"}
            style={
                readOnly
                    ? { cursor: "default", color: tonieCard.live ? token.colorError : token.colorTextDisabled }
                    : { color: tonieCard.live ? token.colorError : token.colorTextDescription }
            }
            onClick={readOnly ? undefined : handleLiveClick}
        />
    );

    const actions = readOnly
        ? [infoAction, playAction, cloudAction, liveAction]
        : [infoAction, <EditOutlined key="edit" onClick={showModelModal} />, playAction, cloudAction, liveAction];

    // ------------------------
    // Render
    // ------------------------

    return (
        <>
            <Card
                hoverable={false}
                key={tonieCard.ruid}
                size="small"
                style={{
                    background: selected ? token.colorBgTextHover : token.colorBgContainerDisabled,
                    borderTop: toniePlayedOn && toniePlayedOn.length > 0 ? "3px #1677ff inset" : "reset",
                    paddingTop: toniePlayedOn && toniePlayedOn.length > 0 ? "unset" : 2,
                }}
                title={
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                            {tonieCard.tonieInfo.series
                                ? tonieCard.tonieInfo.series
                                : t("tonies.unsetTonie") + " " + tonieCard.tonieInfo.model}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                            {tonieCard.tonieInfo.language && defaultLanguage !== tonieCard.tonieInfo.language ? (
                                <Tooltip
                                    placement="top"
                                    zIndex={2}
                                    title={t("languageUtil." + tonieCard.tonieInfo.language, {
                                        defaultValue:
                                            t("languageUtil.unknownLanguageCode") + tonieCard.tonieInfo.language,
                                    })}
                                >
                                    <Text style={{ height: 20, width: "auto" }}>
                                        <LanguageFlagIcon
                                            name={tonieCard.tonieInfo.language.toUpperCase().split("-")[1]}
                                            height={20}
                                        />
                                    </Text>
                                </Tooltip>
                            ) : (
                                ""
                            )}
                            {readOnly ? (
                                ""
                            ) : selectionMode ? (
                                <Checkbox
                                    checked={selected}
                                    onChange={() => onToggleSelect && onToggleSelect(tonieCard.ruid)}
                                />
                            ) : (
                                ""
                            )}
                        </div>
                    </div>
                }
                cover={
                    <div style={{ position: "relative" }}>
                        <img
                            alt={`${tonieCard.tonieInfo.series} - ${tonieCard.tonieInfo.episode}`}
                            src={picture}
                            style={
                                pictureLooksUnknown
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
                                    src={tonieCard.sourceInfo.picture}
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
                <Meta title={`${tonieCard.tonieInfo.episode}`} description={tonieCard.uid} />
            </Card>

            <TonieInformationModal
                open={isInformationModalOpen}
                onClose={() => setInformationModalOpen(false)}
                tonieCardOrTAFRecord={tonieCard}
                showSourceInfo={showSourceInfo}
                readOnly={readOnly}
                lastRUIDs={lastRUIDs}
                onHide={onHide}
                overlay={overlay}
                key={keyInfoModal}
            />

            <TonieSelectFileModal
                open={isSelectFileModalOpen}
                tempSelectedSource={tempSelectedSource}
                onTempSelectedSourceChange={setTempSelectedSource}
                onCancel={handleCancelSelectFile}
                onConfirm={handleConfirmSelectFile}
                keySelectFileFileBrowser={keySelectFileFileBrowser}
                onFileSelectChange={handleFileSelectChange}
            />

            <TonieEditModal
                open={isEditModalOpen}
                title={editModalTitle}
                onCancel={() => setIsEditModalOpen(false)}
                onSave={handleSaveChanges}
                selectedSource={selectedSource}
                onSelectedSourceChange={(value) => {
                    setSelectedSource(value);
                    setTempSelectedSource(value);
                }}
                originalSource={tonieCard.source || ""}
                inputValidationSource={inputValidationSource}
                setInputValidationSource={setInputValidationSource}
                keyRadioStreamSearch={keyRadioStreamSearch}
                onSearchRadioChange={searchRadioResultChanged}
                selectedModel={selectedModel}
                onSelectedModelChange={setSelectedModel}
                originalModel={tonieCard.tonieInfo.model || ""}
                inputValidationModel={inputValidationModel}
                setInputValidationModel={setInputValidationModel}
                keyTonieArticleSearch={keyTonieArticleSearch}
                onSearchModelChange={searchModelResultChanged}
                hasPendingChanges={hasPendingChanges}
                onOpenFileSelectModal={showFileSelectModal}
            />
        </>
    );
};
