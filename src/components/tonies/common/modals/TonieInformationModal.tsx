import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Typography, Button, Tooltip, Spin, theme, List } from "antd";
import { DownloadOutlined, LoadingOutlined, PlayCircleOutlined } from "@ant-design/icons";

import { Record } from "../../../../types/fileBrowserTypes";
import { TonieCardProps } from "../../../../types/tonieTypes";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";

import ConfirmationDialog from "../../../common/modals/ConfirmationModal";

import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { useAudioContext } from "../../../../contexts/AudioContext";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Text } = Typography;
const { useToken } = theme;

type TonieCardTAFRecord = TonieCardProps | Record;

interface InformationModalProps {
    open: boolean;
    onClose: () => void;
    tonieCardOrTAFRecord: TonieCardTAFRecord;
    showSourceInfo?: boolean;
    readOnly?: boolean;
    lastRUIDs?: Array<[string, string, string]>;
    overlay?: string;
    onHide?: (ruid: string) => void;
}

const TonieInformationModal: React.FC<InformationModalProps> = ({
    open,
    onClose,
    tonieCardOrTAFRecord,
    showSourceInfo = false,
    readOnly,
    lastRUIDs,
    overlay,
    onHide,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { playAudio } = useAudioContext();
    const { addNotification } = useTeddyCloud();

    const [isConfirmHideModalOpen, setIsConfirmHideModalOpen] = useState(false);

    // show source information if alternative source is set
    const [informationFromSource, setInformationFromSource] = useState<boolean>(false);
    const [sourcePic, setSourcePic] = useState<string>("");
    const [sourceTracks, setSourceTracks] = useState<string[]>([]);

    const [isDownloading, setIsDownloading] = useState<boolean>(false);

    useEffect(() => {
        if (
            showSourceInfo &&
            "sourceInfo" in tonieCardOrTAFRecord &&
            ((tonieCardOrTAFRecord.sourceInfo.picture !== tonieCardOrTAFRecord.tonieInfo.picture &&
                modelTitle !== sourceTitle) ||
                (tonieCardOrTAFRecord.sourceInfo.picture === tonieCardOrTAFRecord.tonieInfo.picture &&
                    modelTitle !== sourceTitle) ||
                tonieCardOrTAFRecord.sourceInfo.series !== tonieCardOrTAFRecord.tonieInfo.series ||
                tonieCardOrTAFRecord.sourceInfo.episode !== tonieCardOrTAFRecord.tonieInfo.episode ||
                tonieCardOrTAFRecord.sourceInfo.tracks.join(".") !== tonieCardOrTAFRecord.tonieInfo.tracks.join("."))
        ) {
            setInformationFromSource(true);
            setSourcePic(tonieCardOrTAFRecord.sourceInfo.picture);
            setSourceTracks(tonieCardOrTAFRecord.sourceInfo.tracks);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tonieCardOrTAFRecord, open]);

    const handlePlayPauseClick = async (url: string, startTime?: number) => {
        playAudio(
            url,
            showSourceInfo && "sourceInfo" in tonieCardOrTAFRecord
                ? tonieCardOrTAFRecord.sourceInfo
                : tonieCardOrTAFRecord.tonieInfo,
            tonieCardOrTAFRecord,
            startTime
        );
    };

    const handleDownload = async (url: string, filename: string) => {
        setIsDownloading(true);
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        setIsDownloading(false);
    };

    const toniePlayedOn =
        lastRUIDs && "ruid" in tonieCardOrTAFRecord
            ? lastRUIDs
                  .filter(([ruid]) => ruid === tonieCardOrTAFRecord.ruid)
                  .map(([, ruidTime, boxName]) => ({ ruidTime, boxName }))
            : null;

    const tonieInfoString =
        tonieCardOrTAFRecord.tonieInfo?.series +
        (tonieCardOrTAFRecord?.tonieInfo?.episode ? " - " + tonieCardOrTAFRecord.tonieInfo?.episode : "") +
        (tonieCardOrTAFRecord.tonieInfo?.model ? " (" + tonieCardOrTAFRecord.tonieInfo?.model + ")" : "");

    const modelTitle =
        `${tonieCardOrTAFRecord.tonieInfo?.series}` +
        (tonieCardOrTAFRecord.tonieInfo?.episode ? ` - ${tonieCardOrTAFRecord.tonieInfo?.episode}` : "");

    const sourceTitle =
        "sourceInfo" in tonieCardOrTAFRecord
            ? `${tonieCardOrTAFRecord.sourceInfo?.series}` +
              (tonieCardOrTAFRecord.sourceInfo?.episode ? ` - ${tonieCardOrTAFRecord.sourceInfo?.episode}` : "")
            : "";

    const title = informationFromSource ? sourceTitle : modelTitle;

    const trackSecondsMatchSourceTracks = (tonieCardOrTAFRecord: TonieCardTAFRecord, tracksLength: number) => {
        const trackSeconds =
            "trackSeconds" in tonieCardOrTAFRecord
                ? tonieCardOrTAFRecord.trackSeconds
                : tonieCardOrTAFRecord.tafHeader?.trackSeconds;
        return trackSeconds?.length === tracksLength;
    };

    const getTrackStartTime = (tonieCardOrTAFRecord: TonieCardTAFRecord, index: number) => {
        const trackSeconds =
            "trackSeconds" in tonieCardOrTAFRecord
                ? tonieCardOrTAFRecord.trackSeconds
                : tonieCardOrTAFRecord.tafHeader?.trackSeconds;
        return (trackSeconds && trackSeconds[index]) || 0;
    };

    // hide tag functions
    const showHideConfirmDialog = () => {
        setIsConfirmHideModalOpen(true);
    };

    const handleConfirmHide = () => {
        hideTag();
        setIsConfirmHideModalOpen(false);
    };

    const handleCancelHide = () => {
        setIsConfirmHideModalOpen(false);
    };

    const hideTag = async () => {
        if (onHide && "ruid" in tonieCardOrTAFRecord && tonieCardOrTAFRecord.ruid) {
            try {
                await api.apiPostTeddyCloudContentJson(tonieCardOrTAFRecord.ruid, "hide=true", overlay);
                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonies.messages.hideTonieSuccessful"),
                    t("tonies.messages.hideTonieSuccessfulDetails", { ruid: tonieCardOrTAFRecord.ruid }),
                    t("tonies.navigationTitle")
                );
                onHide(tonieCardOrTAFRecord.ruid);
            } catch (error) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("tonies.messages.hideTonieFailed"),
                    t("tonies.messages.hideTonieFailedDetails", { ruid: tonieCardOrTAFRecord.ruid }) + error,
                    t("tonies.navigationTitle")
                );
            }
        }
    };

    const confirmHideTonieModal = (
        <ConfirmationDialog
            title={t("tonies.confirmHideModal.title")}
            open={isConfirmHideModalOpen}
            okText={t("tonies.confirmHideModal.hide")}
            cancelText={t("tonies.confirmHideModal.cancel")}
            content={t("tonies.confirmHideModal.confirmHideDialog", {
                tonieToHide: tonieInfoString
                    ? tonieInfoString
                    : "uid" in tonieCardOrTAFRecord
                    ? tonieCardOrTAFRecord.uid
                    : "",
            })}
            handleOk={handleConfirmHide}
            handleCancel={handleCancelHide}
        />
    );

    const informationModalTitle = (
        <>
            <h3>
                {title
                    ? title
                    : "model" in tonieCardOrTAFRecord.tonieInfo && tonieCardOrTAFRecord.tonieInfo.model
                    ? t("tonies.unsetTonie") + " " + tonieCardOrTAFRecord.tonieInfo.model
                    : t("tonies.informationModal.unknownModel")}
                <br />
                {"uid" in tonieCardOrTAFRecord && tonieCardOrTAFRecord.uid ? (
                    <Text type="secondary">{tonieCardOrTAFRecord.uid}</Text>
                ) : (
                    ""
                )}
            </h3>
        </>
    );

    const informationModalFooter = (
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <div>
                {"ruid" in tonieCardOrTAFRecord && tonieCardOrTAFRecord.ruid ? (
                    !readOnly ? (
                        <Button onClick={showHideConfirmDialog}>{t("tonies.informationModal.hideTag")}</Button>
                    ) : (
                        ""
                    )
                ) : (
                    ""
                )}
            </div>
            <Button type="primary" onClick={onClose}>
                {t("tonies.informationModal.ok")}
            </Button>
        </div>
    );

    const informationModal = (
        <>
            <Modal
                title={informationModalTitle}
                footer={informationModalFooter}
                open={open}
                keyboard={true}
                closable={false}
                maskClosable={true}
                onCancel={onClose}
            >
                <div style={{ position: "relative" }}>
                    {
                        <img
                            src={
                                tonieCardOrTAFRecord.tonieInfo?.picture
                                    ? tonieCardOrTAFRecord.tonieInfo?.picture
                                    : "/img_unknown.png"
                            }
                            alt=""
                            style={{ width: "100%" }}
                        />
                    }
                    {informationFromSource ? (
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
                                src={sourcePic}
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
                {toniePlayedOn && toniePlayedOn.length > 0 ? (
                    <>
                        <strong>{t("tonies.lastPlayedOnModal.lastPlayedOnMessage")}:</strong>
                        <ul>
                            {toniePlayedOn.map(({ ruidTime, boxName }, index) => (
                                <li key={index}>
                                    {boxName}
                                    {ruidTime ? " (" + ruidTime + ")" : ""}
                                </li>
                            ))}
                        </ul>
                    </>
                ) : (
                    <></>
                )}
                <div>
                    {"valid" in tonieCardOrTAFRecord ? (
                        <p>
                            <strong>{t("tonies.infoModal.valid")}</strong>{" "}
                            {tonieCardOrTAFRecord.valid ? t("tonies.infoModal.yes") : t("tonies.infoModal.no")}
                        </p>
                    ) : (
                        ""
                    )}
                    {"exists" in tonieCardOrTAFRecord ? (
                        <p>
                            <strong>{t("tonies.infoModal.exists")}</strong>{" "}
                            {tonieCardOrTAFRecord.exists ? t("tonies.infoModal.yes") : t("tonies.infoModal.no")}
                        </p>
                    ) : (
                        ""
                    )}
                    {informationFromSource ? (
                        sourceTracks && sourceTracks.length > 0 ? (
                            <>
                                <strong>{t("tonies.infoModal.tracklist")}</strong>
                                <List
                                    size="small"
                                    dataSource={sourceTracks}
                                    renderItem={(track: string, index: number) => (
                                        <List.Item style={{ textAlign: "left" }}>
                                            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                                                {"audioUrl" in tonieCardOrTAFRecord &&
                                                trackSecondsMatchSourceTracks(
                                                    tonieCardOrTAFRecord,
                                                    tonieCardOrTAFRecord.sourceInfo.tracks?.length
                                                ) ? (
                                                    <PlayCircleOutlined
                                                        key={`playpause-${index}`}
                                                        onClick={() =>
                                                            handlePlayPauseClick(
                                                                import.meta.env.VITE_APP_TEDDYCLOUD_API_URL +
                                                                    tonieCardOrTAFRecord.audioUrl,
                                                                getTrackStartTime(tonieCardOrTAFRecord, index)
                                                            )
                                                        }
                                                    />
                                                ) : null}

                                                <div>
                                                    {index + 1}. {track}
                                                </div>
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            </>
                        ) : (
                            <></>
                        )
                    ) : tonieCardOrTAFRecord.tonieInfo?.tracks && tonieCardOrTAFRecord.tonieInfo?.tracks.length > 0 ? (
                        <>
                            <strong>{t("tonies.infoModal.tracklist")}</strong>
                            <List
                                size="small"
                                dataSource={tonieCardOrTAFRecord.tonieInfo?.tracks || []}
                                renderItem={(track: string, index: number) => (
                                    <List.Item>
                                        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                                            {"audioUrl" in tonieCardOrTAFRecord &&
                                            trackSecondsMatchSourceTracks(
                                                tonieCardOrTAFRecord,
                                                tonieCardOrTAFRecord.tonieInfo?.tracks?.length
                                            ) ? (
                                                <PlayCircleOutlined
                                                    key={`playpause-${index}`}
                                                    onClick={() =>
                                                        handlePlayPauseClick(
                                                            import.meta.env.VITE_APP_TEDDYCLOUD_API_URL +
                                                                tonieCardOrTAFRecord.audioUrl,
                                                            getTrackStartTime(tonieCardOrTAFRecord, index)
                                                        )
                                                    }
                                                />
                                            ) : null}

                                            <div>
                                                {index + 1}. {track}
                                            </div>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        </>
                    ) : (
                        <></>
                    )}
                    {"exists" in tonieCardOrTAFRecord &&
                    tonieCardOrTAFRecord.exists &&
                    "audioUrl" in tonieCardOrTAFRecord ? (
                        <p
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                                cursor: isDownloading ? "default" : "pointer",
                            }}
                            onClick={
                                !isDownloading
                                    ? () =>
                                          handleDownload(
                                              import.meta.env.VITE_APP_TEDDYCLOUD_API_URL +
                                                  tonieCardOrTAFRecord.audioUrl,
                                              sourceTitle ? sourceTitle : modelTitle + ".ogg"
                                          )
                                    : undefined
                            }
                        >
                            {isDownloading ? (
                                <Spin
                                    size="small"
                                    indicator={
                                        <LoadingOutlined style={{ fontSize: 14, color: token.colorText }} spin />
                                    }
                                />
                            ) : (
                                <DownloadOutlined key="download" />
                            )}
                            {t("tonies.infoModal.download")}
                        </p>
                    ) : (
                        ""
                    )}
                </div>
            </Modal>
            {confirmHideTonieModal}
        </>
    );

    return informationModal;
};

export default TonieInformationModal;
