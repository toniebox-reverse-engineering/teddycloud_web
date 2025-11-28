import React from "react";
import { Modal, Divider, Flex } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { TonieCardProps } from "../../../../types/tonieTypes";

interface TracklistModalProps {
    open: boolean;
    tonieCard: TonieCardProps;
    onClose: () => void;
    onSelectTrack: (startTime: number) => void;
    getContainer: () => HTMLElement;
}

const trackSecondsMatchSourceTracks = (tonieCard: TonieCardProps, tracksLength: number) => {
    return tonieCard.trackSeconds?.length === tracksLength;
};

const getTrackStartTime = (tonieCard: TonieCardProps, index: number) => {
    const trackSeconds = tonieCard.trackSeconds;
    return (trackSeconds && trackSeconds[index]) || 0;
};

const TracklistModal: React.FC<TracklistModalProps> = ({ open, tonieCard, onClose, onSelectTrack, getContainer }) => {
    const { t } = useTranslation();

    const title =
        tonieCard?.tonieInfo?.series + (tonieCard?.tonieInfo.episode && " - " + tonieCard?.tonieInfo.episode) ||
        t("tonies.teddyaudioplayer.unknown");

    const tracks = tonieCard?.tonieInfo?.tracks || [];

    return (
        <Modal title={title} open={open} onCancel={onClose} footer={null} getContainer={getContainer}>
            {tracks.length ? (
                <Flex vertical gap={4}>
                    {tracks.map((track: string, index: number) => (
                        <div key={index}>
                            <div style={{ display: "flex", gap: 16, textAlign: "left" }}>
                                {trackSecondsMatchSourceTracks(tonieCard, tracks.length) && (
                                    <PlayCircleOutlined
                                        onClick={() => {
                                            onClose();
                                            onSelectTrack(getTrackStartTime(tonieCard, index));
                                        }}
                                    />
                                )}

                                <div>
                                    {index + 1}. {track}
                                </div>
                            </div>
                            {index < tracks.length - 1 && <Divider style={{ margin: "8px 0" }} />}
                        </div>
                    ))}
                </Flex>
            ) : (
                <p>{t("tonies.teddyaudioplayer.noTracks")}</p>
            )}
        </Modal>
    );
};

export default TracklistModal;
