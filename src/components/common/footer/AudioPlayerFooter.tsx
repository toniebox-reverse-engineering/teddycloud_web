import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Popover, Progress, Slider } from "antd";
import {
    PlayCircleOutlined,
    PauseCircleOutlined,
    StepBackwardOutlined,
    StepForwardOutlined,
    SoundOutlined,
    MutedOutlined,
    WarningOutlined,
    ShrinkOutlined,
    ArrowsAltOutlined,
    CloseOutlined,
    ExportOutlined,
} from "@ant-design/icons";

import { TeddyCloudApi } from "../../../api";
import { defaultAPIConfig } from "../../../config/defaultApiConfig";

import TonieInformationModal from "../../tonies/common/modals/TonieInformationModal";
import { isIOS } from "../../../utils/browser/browserUtils";
import { useNavigate } from "react-router";
import { getLongestStringByPixelWidth } from "../../../utils/strings/getLongestStringByPixelWidth";
import { useAudioContext } from "../../../contexts/AudioContext";

interface AudioPlayerFooterProps {
    isPlaying?: boolean;
    onPlayPause?: () => void;
    onLast?: () => void;
    onNext?: () => void;
    currentPlayPosition?: string;
    songImage?: string;
    onVisibilityChange: (visible: boolean) => void;
}

const api = new TeddyCloudApi(defaultAPIConfig());

const AudioPlayerFooter: React.FC<AudioPlayerFooterProps> = ({ onVisibilityChange }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const { songImage, songArtist, songTitle, songTracks, tonieCardOrTAFRecord } = useAudioContext();
    const globalAudio = document.getElementById("globalAudioPlayer") as HTMLAudioElement | null;

    const [audioPlayerDisplay, setAudioPlayerDisplay] = useState<string>("none");
    const [showAudioPlayerMinimal, setShowAudioPlayerMinimal] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPlayPosition, setCurrentPlayPosition] = useState(0);
    const [currentPlayPositionFormat, setCurrentPlayPositionFormat] = useState("0:00");
    const [audioDurationFormat, setAudioDurationFormat] = useState("0:00");
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [cyclePosition, setCyclePosition] = useState<{ left: number; top: number; visible: boolean }>({
        left: 0,
        top: 0,
        visible: false,
    });
    const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
    const [volume, setVolume] = useState<number | null>(() => {
        const saved = localStorage.getItem("audioVolume");
        return saved ? Number(saved) : 100;
    });
    const [lastVolume, setLastVolume] = useState<number | null>(() => {
        const saved = localStorage.getItem("audioVolume");
        return saved ? Number(saved) : 100;
    });
    const [closePlayerPopoverOpen, setClosePlayerPopoverOpen] = useState(false);
    const [confirmClose, setConfirmClose] = useState<boolean>(true);
    const [isTouching, setIsTouching] = useState<boolean>(false);
    const [isInformationModalOpen, setInformationModalOpen] = useState(false);
    const [keyInfoModal, setKeyInfoModal] = useState(0);
    const [currentTrackTitle, setCurrentTrackTitle] = useState<string>("");
    const [currentTrackNo, setCurrentTrackNo] = useState<number | undefined>();
    const [songContainerWidth, setSongContainerWidth] = useState<number>(300);
    const [displaySongTitle, setDisplaySongTitle] = useState<string>("");
    const [displaySongArtist, setDisplaySongArtist] = useState<string>("");

    useEffect(() => {
        if (globalAudio) {
            globalAudio.volume = volume === null ? 0 : volume / 100;
        }
        localStorage.setItem("audioVolume", (volume ?? 0).toString());
    }, [volume, globalAudio]);

    useEffect(() => {
        const fetchConfirmClose = async () => {
            try {
                const response = await api.apiGetTeddyCloudSettingRaw("frontend.confirm_audioplayer_close");
                const confirmCloseSetting = (await response.text()) === "true";
                setConfirmClose(confirmCloseSetting);
            } catch {
                // in case of error - do nothing.
            }
        };
        if (audioPlayerDisplay !== "none") {
            fetchConfirmClose();
        }
    }, [audioPlayerDisplay]);

    useEffect(() => {
        const calculatePlayerWidth = () => {
            if (tonieCardOrTAFRecord) {
                const songContainer = document.querySelector(".songContainer") || document.body;
                const computed = getComputedStyle(songContainer);
                const font = `${computed.fontSize} ${computed.fontFamily}`;

                const tracks =
                    ("sourceInfo" in tonieCardOrTAFRecord && tonieCardOrTAFRecord.sourceInfo
                        ? tonieCardOrTAFRecord.sourceInfo?.tracks
                        : tonieCardOrTAFRecord.tonieInfo?.tracks) ?? [];

                const longestString = getLongestStringByPixelWidth([...tracks, songArtist, songTitle], font).pixelWidth;

                setSongContainerWidth(longestString);
            } else {
                setSongContainerWidth(300);
            }
        };

        calculatePlayerWidth();
        setDisplaySongTitle(songTitle);
        setDisplaySongArtist(songArtist);
        setCurrentTrackTitle("");
    }, [songTracks, songTitle, songArtist, tonieCardOrTAFRecord]);

    // Initiale Track-Nummer
    useEffect(() => {
        if (globalAudio?.querySelector("source")) {
            setCurrentTrackNo(0);
            setCurrentTrackTitle("");
        }
    }, [globalAudio?.querySelector("source")]);

    useEffect(() => {
        onVisibilityChange(audioPlayerDisplay !== "none");
        if (globalAudio?.querySelector("source") && audioPlayerDisplay === "none") {
            setAudioPlayerDisplay("flex");
        }
    }, [audioPlayerDisplay, globalAudio?.querySelector("source"), onVisibilityChange]);

    useEffect(() => {
        const audio = document.getElementById("globalAudioPlayer") as HTMLAudioElement | null;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            const minutes = Math.floor(audio.duration / 60);
            const seconds = Math.floor(audio.duration % 60);
            setAudioDurationFormat(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
        };

        const handleProgress = () => {
            if (audio.buffered.length > 0) {
                const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
                const duration = audio.duration;
                if (duration > 0) {
                    setDownloadProgress((bufferedEnd / duration) * 100);
                }
            }
        };

        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("progress", handleProgress);

        return () => {
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("progress", handleProgress);
        };
    }, []);

    const handleVolumeSliderChange = (value: number | [number, number]) => {
        if (Array.isArray(value)) return;
        setVolume(value);
    };

    const handleMuteClick = () => {
        setLastVolume(volume);
        setVolume(0);
    };

    const handleUnMuteClick = () => {
        setVolume(lastVolume);
    };

    const handleAudioPlay = () => setIsPlaying(true);
    const handleAudioPause = () => setIsPlaying(false);
    const handleAudioEnded = () => setIsPlaying(false);

    const handlePlayButton = () => globalAudio?.play();
    const handlePauseButton = () => globalAudio?.pause();

    const handleClosePlayer = () => {
        closeClosePlayerPopOver();
        if (globalAudio) {
            while (globalAudio.firstChild) {
                globalAudio.removeChild(globalAudio.firstChild);
            }
            globalAudio.load();
        }
        setAudioPlayerDisplay("none");
        onVisibilityChange(false);
    };

    const handleTimeUpdate = (event: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        const audioElement = event.target as HTMLAudioElement;
        const minutes = Math.floor(audioElement.currentTime / 60);
        const seconds = Math.floor(audioElement.currentTime % 60);
        setCurrentPlayPosition((audioElement.currentTime / (globalAudio?.duration || 1)) * 100);
        setCurrentPlayPositionFormat(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);

        const trackSeconds =
            (tonieCardOrTAFRecord &&
                ("trackSeconds" in tonieCardOrTAFRecord
                    ? tonieCardOrTAFRecord.trackSeconds
                    : "tafHeader" in tonieCardOrTAFRecord
                    ? tonieCardOrTAFRecord.tafHeader.trackSeconds
                    : [])) ||
            [];

        const tracks =
            tonieCardOrTAFRecord &&
            ("sourceInfo" in tonieCardOrTAFRecord && tonieCardOrTAFRecord.sourceInfo
                ? tonieCardOrTAFRecord.sourceInfo
                : tonieCardOrTAFRecord.tonieInfo
            )?.tracks;

        if (tracks && trackSeconds && tracks.length === trackSeconds.length) {
            const trackIndex = trackSeconds.findIndex((start: number, index: number) => {
                const nextStart = trackSeconds[index + 1];
                return audioElement.currentTime >= start && (!nextStart || audioElement.currentTime < nextStart);
            });

            if (trackIndex !== -1 && tracks[trackIndex]) {
                setCurrentTrackNo(trackIndex + 1);
                setCurrentTrackTitle(tracks[trackIndex]);
            }
        } else {
            setCurrentTrackNo(0);
            setCurrentTrackTitle("");
        }
    };

    const handleMouseOrTouchMove = (event: React.MouseEvent | React.TouchEvent) => {
        if (!globalAudio) return;

        if ("touches" in event) {
            const touch = event.touches[0];
            const progressBarRect = event.currentTarget.getBoundingClientRect();
            const offsetX = touch.clientX - progressBarRect.left;
            const offsetY = progressBarRect.height / 2;
            setCyclePosition({ left: offsetX, top: offsetY, visible: true });
            globalAudio.currentTime = (offsetX / progressBarRect.width) * globalAudio.duration;
            setIsTouching(true);
        } else {
            const progressBarRect = event.currentTarget.getBoundingClientRect();
            const offsetX = event.clientX - progressBarRect.left;
            const offsetY = progressBarRect.height / 2;
            setCyclePosition({ left: offsetX, top: offsetY, visible: true });

            if (isMouseDown) {
                handleClick(event);
            }
        }
    };

    const handleMouseLeave = () => {
        setCyclePosition({ left: 0, top: 0, visible: false });
    };

    const handleClick = (event: React.MouseEvent | React.TouchEvent) => {
        if (!globalAudio) return;

        if (isTouching) {
            setIsTouching(false);
            handleMouseLeave();
        } else {
            const progressBarRect = event.currentTarget.getBoundingClientRect();
            globalAudio.currentTime = (cyclePosition.left / progressBarRect.width) * globalAudio.duration;
        }
    };

    const handleMouseDown = () => setIsMouseDown(true);
    const handleMouseUp = () => setIsMouseDown(false);

    const togglePlayerMinimal = () => {
        setShowAudioPlayerMinimal((prev) => !prev);
        onVisibilityChange(true);
    };

    const closeClosePlayerPopOver = () => setClosePlayerPopoverOpen(false);
    const openClosePlayerPopOver = () => {
        confirmClose ? setClosePlayerPopoverOpen(true) : handleClosePlayer();
    };

    const handlePrevTrackButton = () => {
        if (!globalAudio || songTracks.length === 0) return;
        let i = 0;
        while (globalAudio.currentTime > songTracks[i]) {
            i++;
            if (i > songTracks.length) break;
        }
        if (i > 1 && i <= songTracks.length) {
            globalAudio.currentTime = songTracks[i - 2];
        } else if (i <= 1) {
            globalAudio.currentTime = 0;
        }
    };

    const handleNextTrackButton = () => {
        if (!globalAudio || songTracks.length === 0) return;
        let i = 0;
        while (globalAudio.currentTime > songTracks[i]) {
            i++;
            if (i > songTracks.length) break;
        }
        if (i < songTracks.length) {
            globalAudio.currentTime = songTracks[i];
        }
    };

    useEffect(() => {
        if (!globalAudio || !("mediaSession" in navigator)) return;

        const handlePlayPause = (play: boolean) => {
            if (!globalAudio) return;
            if (play) {
                globalAudio.play();
                setIsPlaying(true);
            } else {
                globalAudio.pause();
                setIsPlaying(false);
            }
        };

        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentTrackTitle || songTitle || "",
            album: songTitle || "",
            artist: songArtist || "",
            artwork: [{ src: songImage || "", sizes: "96x96,128x128,192x192,256x256,384x384,512x512" }],
        });

        navigator.mediaSession.setActionHandler("play", () => handlePlayPause(true));
        navigator.mediaSession.setActionHandler("pause", () => handlePlayPause(false));
        navigator.mediaSession.setActionHandler("previoustrack", handlePrevTrackButton);
        if (songTracks.length > 0) {
            navigator.mediaSession.setActionHandler("nexttrack", handleNextTrackButton);
        }
    }, [currentTrackTitle, songTitle, songArtist, songImage, songTracks, globalAudio]);

    useEffect(() => {
        if (!("mediaSession" in navigator) || !globalAudio) return;

        const updatePositionState = () => {
            if (!globalAudio || isNaN(globalAudio.duration) || globalAudio.duration < globalAudio.currentTime) return;
            try {
                navigator.mediaSession.setPositionState({
                    duration: globalAudio.duration,
                    position: globalAudio.currentTime,
                    playbackRate: globalAudio.playbackRate,
                });
            } catch (e) {
                console.error("Failed to update position state", e);
            }
        };

        globalAudio.ontimeupdate = updatePositionState;

        return () => {
            if (globalAudio) {
                globalAudio.ontimeupdate = null;
            }
        };
    }, [globalAudio]);

    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth <= 1024;

    const innerContainerStyle: React.CSSProperties = isMobile
        ? {
              ...styles.innerContainer,
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              gap: 8,
          }
        : styles.innerContainer;

    const control2Style: React.CSSProperties = isMobile
        ? {
              ...styles.controls2,
              width: "100%",
          }
        : styles.controls2;

    const progressBarStyle: React.CSSProperties = isMobile
        ? {
              ...styles.progressBar,
              width: 200,
              marginRight: 0,
          }
        : styles.progressBar;

    const songContainerStyle: React.CSSProperties = !isTablet
        ? {
              ...styles.songContainer,
              minWidth: songContainerWidth,
              maxWidth: songContainerWidth,
          }
        : styles.songContainer;

    useEffect(() => {
        onVisibilityChange(true);
    }, [onVisibilityChange, isMobile]);

    const timeStringToSeconds = (time: string): number => {
        const parts = time.split(":").map(Number);

        if (parts.length === 2) {
            const [minutes, seconds] = parts;
            return minutes * 60 + seconds;
        }
        if (parts.length === 3) {
            const [hours, minutes, seconds] = parts;
            return hours * 3600 + minutes * 60 + seconds;
        }
        throw new Error("Invalid time format");
    };

    const minMaximizerClose = (
        <div style={{ display: "flex", gap: 8 }}>
            {tonieCardOrTAFRecord && "ruid" in tonieCardOrTAFRecord && (
                <ExportOutlined
                    title={t("tonies.toniesaudioplayer.openInTonieAudioPlayer")}
                    onClick={() => {
                        const params = new URLSearchParams();
                        params.set("ruid", tonieCardOrTAFRecord.ruid);
                        params.set("position", timeStringToSeconds(currentPlayPositionFormat).toString());
                        navigate(`tonies/audioplayer?${params.toString()}`);
                    }}
                />
            )}
            {showAudioPlayerMinimal ? (
                <ArrowsAltOutlined title={t("tonies.toniesaudioplayer.expand")} onClick={togglePlayerMinimal} />
            ) : (
                <ShrinkOutlined title={t("tonies.toniesaudioplayer.shrink")} onClick={togglePlayerMinimal} />
            )}
            <Popover
                title={
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div>
                            <WarningOutlined /> {t("tonies.closeAudioPlayerPopover")}
                        </div>
                        <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
                            <Button onClick={closeClosePlayerPopOver}>{t("tonies.cancel")}</Button>
                            <Button onClick={handleClosePlayer}>{t("tonies.closeAudioPlayer")}</Button>
                        </div>
                    </div>
                }
                open={closePlayerPopoverOpen}
                trigger="click"
                onOpenChange={closeClosePlayerPopOver}
                className="closePlayerPopover"
                placement="top"
                style={{ right: 8 }}
            >
                <CloseOutlined onClick={openClosePlayerPopOver} />
            </Popover>
        </div>
    );

    const progressBar = (
        <>
            <Progress
                type="line"
                success={{
                    percent: currentPlayPosition,
                    strokeColor: "#1677ff",
                }}
                percent={downloadProgress}
                strokeColor="#272727"
                format={() => ""}
                status="active"
                showInfo={false}
            />
            {cyclePosition.visible && (
                <svg
                    style={{
                        position: "absolute",
                        left: cyclePosition.left,
                        top: cyclePosition.top,
                        transform: "translate(-50%, -50%)",
                    }}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                >
                    <circle cx="8" cy="8" r="8" fill="rgba(0,0,0,0.5)" />
                </svg>
            )}
        </>
    );

    const minimalPlayer =
        showAudioPlayerMinimal && globalAudio ? (
            <span
                className="audioplayer-inner"
                id="minimalAudioPlayer"
                style={{ ...innerContainerStyle, display: "flex", padding: 0 }}
            >
                <div style={styles.trackInfo}>
                    {isPlaying ? (
                        <PauseCircleOutlined style={{ fontSize: 24, marginRight: 8 }} onClick={handlePauseButton} />
                    ) : (
                        <PlayCircleOutlined style={{ fontSize: 24, marginRight: 8 }} onClick={handlePlayButton} />
                    )}
                    {songImage && (
                        <img
                            src={songImage}
                            alt="Song"
                            style={{ ...styles.songImage, cursor: tonieCardOrTAFRecord ? "help" : "unset" }}
                            onClick={() => {
                                if (tonieCardOrTAFRecord) {
                                    setKeyInfoModal((prev) => prev + 1);
                                    setInformationModalOpen(true);
                                }
                            }}
                        />
                    )}

                    {!audioDurationFormat.startsWith("Infinity") ? (
                        <div style={{ ...styles.playPositionContainer, marginRight: 0 }}>
                            <div style={{ display: "flex" }}>
                                <div style={{ textAlign: "center", marginBottom: 0 }}>
                                    {currentPlayPositionFormat} / {audioDurationFormat}
                                </div>
                                <span style={{ margin: 0, marginLeft: 16, textAlign: "right" }}>
                                    {minMaximizerClose}
                                </span>
                            </div>
                            <div
                                style={{ ...progressBarStyle, width: 100 }}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseOrTouchMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseLeave}
                                onTouchStart={handleMouseOrTouchMove}
                                onTouchMove={handleMouseOrTouchMove}
                                onClick={handleClick}
                            >
                                {progressBar}
                            </div>
                        </div>
                    ) : (
                        <div style={{ ...styles.playPositionContainer, marginRight: 0 }}>
                            <div style={{ display: "flex" }}>
                                <div style={{ textAlign: "center", marginBottom: 0 }}> </div>
                                <span>{minMaximizerClose}</span>
                            </div>
                        </div>
                    )}
                </div>
            </span>
        ) : null;

    const normalPlayer =
        !showAudioPlayerMinimal && globalAudio ? (
            <>
                <span
                    className="audioplayer-inner"
                    id="normalAudioPlayer"
                    style={{
                        margin: 0,
                        marginLeft: 16,
                        textAlign: "right",
                        display: "flex",
                        position: "absolute",
                    }}
                >
                    {minMaximizerClose}
                </span>
                <span className="audioplayer-inner" style={{ ...innerContainerStyle, display: "flex" }}>
                    <div id="audioPlayer" style={{ ...styles.controls, flexDirection: "column", gap: 8 }}>
                        {currentTrackTitle ? (
                            <div style={{ fontSize: "x-small", marginTop: -20 }}>
                                {currentTrackNo}
                                {tonieCardOrTAFRecord &&
                                    ("sourceInfo" in tonieCardOrTAFRecord && tonieCardOrTAFRecord.sourceInfo
                                        ? tonieCardOrTAFRecord.sourceInfo
                                        : tonieCardOrTAFRecord.tonieInfo
                                    )?.tracks.length && (
                                        <>
                                            {" "}
                                            /{" "}
                                            {
                                                ("sourceInfo" in tonieCardOrTAFRecord && tonieCardOrTAFRecord.sourceInfo
                                                    ? tonieCardOrTAFRecord.sourceInfo
                                                    : tonieCardOrTAFRecord.tonieInfo
                                                ).tracks.length
                                            }
                                        </>
                                    )}
                            </div>
                        ) : null}
                        <div style={{ display: "flex", gap: 8 }}>
                            <StepBackwardOutlined style={styles.controlButton} onClick={handlePrevTrackButton} />
                            {isPlaying ? (
                                <PauseCircleOutlined style={styles.controlButton} onClick={handlePauseButton} />
                            ) : (
                                <PlayCircleOutlined style={styles.controlButton} onClick={handlePlayButton} />
                            )}
                            <StepForwardOutlined
                                style={{
                                    ...styles.controlButton,
                                    cursor: songTracks.length === 0 ? "default" : "pointer",
                                    opacity: songTracks.length === 0 ? 0.25 : 1,
                                }}
                                disabled={songTracks.length === 0}
                                onClick={handleNextTrackButton}
                            />
                        </div>
                    </div>
                    <div
                        style={{ ...styles.trackInfo, cursor: tonieCardOrTAFRecord ? "help" : "unset" }}
                        onClick={() => {
                            if (tonieCardOrTAFRecord) {
                                setKeyInfoModal((prev) => prev + 1);
                                setInformationModalOpen(true);
                            }
                        }}
                    >
                        {songImage && <img src={songImage} alt="Song" style={styles.songImage} />}
                        <div className="songContainer" style={songContainerStyle}>
                            {currentTrackTitle ? <div>{currentTrackTitle}</div> : null}
                            <div>{displaySongArtist}</div>
                            <div>{displaySongTitle}</div>
                        </div>
                    </div>
                    {!audioDurationFormat.startsWith("Infinity") ? (
                        <div style={styles.playPositionContainer}>
                            <div>
                                <div style={{ textAlign: "center" }}>
                                    {currentPlayPositionFormat} / {audioDurationFormat}
                                </div>
                            </div>
                            <div
                                style={progressBarStyle}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseOrTouchMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseLeave}
                                onTouchStart={handleMouseOrTouchMove}
                                onTouchMove={handleMouseOrTouchMove}
                                onClick={handleClick}
                            >
                                {progressBar}
                            </div>
                        </div>
                    ) : null}
                    {!isIOS() ? (
                        <div style={control2Style}>
                            <div style={{ ...styles.controls, position: "relative" as const }}>
                                <MutedOutlined
                                    style={{
                                        ...styles.controlButton,
                                        ...styles.volumeIcon,
                                        display: (volume || 0) === 0 ? "block" : "none",
                                    }}
                                    onClick={handleUnMuteClick}
                                />
                                <SoundOutlined
                                    style={{
                                        ...styles.controlButton,
                                        ...styles.volumeIcon,
                                        display: (volume || 0) > 0 ? "block" : "none",
                                    }}
                                    onClick={handleMuteClick}
                                />
                                <div
                                    style={{
                                        ...styles.volumeSlider,
                                    }}
                                >
                                    <Slider min={0} max={100} value={volume || 0} onChange={handleVolumeSliderChange} />
                                </div>
                            </div>
                        </div>
                    ) : null}
                </span>
            </>
        ) : null;

    const hasSource = !!globalAudio?.querySelector("source");

    return (
        <>
            <div
                className="audioplayer-container"
                style={{
                    ...styles.container,
                    display: audioPlayerDisplay,
                    visibility: hasSource ? "visible" : "hidden",
                    height: hasSource ? "auto" : "0",
                    margin: hasSource ? "0" : "-24px",
                    marginBottom: hasSource ? "8px" : "0",
                    overflow: "hidden",
                }}
            >
                {minimalPlayer}
                {normalPlayer}
                {tonieCardOrTAFRecord ? (
                    <TonieInformationModal
                        open={isInformationModalOpen}
                        onClose={() => setInformationModalOpen(false)}
                        tonieCardOrTAFRecord={{
                            ...tonieCardOrTAFRecord,
                            tonieInfo:
                                "sourceInfo" in tonieCardOrTAFRecord && tonieCardOrTAFRecord.sourceInfo
                                    ? tonieCardOrTAFRecord.sourceInfo
                                    : tonieCardOrTAFRecord.tonieInfo,
                        }}
                        readOnly={true}
                        key={keyInfoModal}
                    />
                ) : null}
            </div>
            <audio
                id="globalAudioPlayer"
                controls
                onPlay={handleAudioPlay}
                onPause={handleAudioPause}
                onEnded={handleAudioEnded}
                onTimeUpdate={handleTimeUpdate}
                style={{ display: "none" }}
            >
                Your browser does not support the audio element.
            </audio>
        </>
    );
};

const styles = {
    container: {
        flexDirection: "column" as const,
        alignItems: "flex-end",
        objectPosition: "top",
        padding: 10,
        backgroundColor: "#333",
        borderRadius: 8,
        gap: 8,
    },
    innerContainer: {
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
        backgroundColor: "#333",
        borderRadius: 8,
        gap: 16,
    },
    controls: {
        display: "flex",
        alignItems: "center",
    },
    controlButton: {
        fontSize: 24,
        cursor: "pointer",
    },
    trackInfo: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    songImage: {
        width: "auto",
        height: 40,
        borderRadius: "50%",
        marginRight: 10,
    },
    songContainer: {
        minWidth: 200,
        maxWidth: 200,
    },
    progressBar: {
        display: "block",
        position: "relative" as const,
        width: 150,
        marginRight: 10,
    },
    playPositionContainer: {
        marginLeft: 10,
        marginRight: 10,
    },
    controls2: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 24,
    },
    volumeSlider: {
        width: 100,
        position: "relative" as const,
        marginRight: 16,
        top: "calc(100% + 10px)",
        zIndex: 1000,
        padding: 0,
    },
    volumeIcon: {
        fontSize: 24,
        cursor: "pointer",
        marginBottom: 0,
    },
} as const;

export default AudioPlayerFooter;
