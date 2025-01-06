import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Typography, Button, Tooltip } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";

import { Record } from "../../types/fileBrowserTypes";
import { TonieCardProps } from "../../types/tonieTypes";

import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

import ConfirmationDialog from "./ConfirmationDialog";
import { useAudioContext } from "../audio/AudioContext";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Text } = Typography;

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
    const { playAudio } = useAudioContext();
    const { addNotification } = useTeddyCloud();

    const [isConfirmHideModalOpen, setIsConfirmHideModalOpen] = useState(false);

    // show source information if alternative source is set
    const [informationFromSource, setInformationFromSource] = useState<boolean>(false);
    const [sourcePic, setSourcePic] = useState<string>("");
    const [sourceTracks, setSourceTracks] = useState<string[]>([]);

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
                {title ? title : t("tonies.informationModal.unknownModel")}
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
                                <ol>
                                    {sourceTracks.map((track, index) => (
                                        <li key={index}>
                                            {"audioUrl" in tonieCardOrTAFRecord &&
                                            trackSecondsMatchSourceTracks(
                                                tonieCardOrTAFRecord,
                                                tonieCardOrTAFRecord.sourceInfo.tracks?.length
                                            ) ? (
                                                <>
                                                    <PlayCircleOutlined
                                                        key="playpause"
                                                        onClick={() =>
                                                            handlePlayPauseClick(
                                                                import.meta.env.VITE_APP_TEDDYCLOUD_API_URL +
                                                                    tonieCardOrTAFRecord.audioUrl,
                                                                getTrackStartTime(tonieCardOrTAFRecord, index)
                                                            )
                                                        }
                                                    />{" "}
                                                </>
                                            ) : (
                                                ""
                                            )}{" "}
                                            {track}
                                        </li>
                                    ))}
                                </ol>
                            </>
                        ) : (
                            <></>
                        )
                    ) : tonieCardOrTAFRecord.tonieInfo?.tracks && tonieCardOrTAFRecord.tonieInfo?.tracks.length > 0 ? (
                        <>
                            <strong>{t("tonies.infoModal.tracklist")}</strong>
                            <ol>
                                {tonieCardOrTAFRecord.tonieInfo?.tracks.map((track, index) => (
                                    <li key={index}>
                                        {"audioUrl" in tonieCardOrTAFRecord &&
                                        trackSecondsMatchSourceTracks(
                                            tonieCardOrTAFRecord,
                                            tonieCardOrTAFRecord.tonieInfo.tracks?.length
                                        ) ? (
                                            <>
                                                <PlayCircleOutlined
                                                    key="playpause"
                                                    onClick={() =>
                                                        handlePlayPauseClick(
                                                            import.meta.env.VITE_APP_TEDDYCLOUD_API_URL +
                                                                tonieCardOrTAFRecord.audioUrl,
                                                            getTrackStartTime(tonieCardOrTAFRecord, index)
                                                        )
                                                    }
                                                />{" "}
                                            </>
                                        ) : (
                                            ""
                                        )}{" "}
                                        {track}
                                    </li>
                                ))}
                            </ol>
                        </>
                    ) : (
                        <></>
                    )}
                </div>
            </Modal>
            {confirmHideTonieModal}
        </>
    );

    return informationModal;
};

export default TonieInformationModal;
