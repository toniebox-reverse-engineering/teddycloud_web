import { useEffect, useRef, useState } from "react";
import {
    MutedOutlined,
    PauseCircleOutlined,
    PlayCircleOutlined,
    SoundOutlined,
    StepBackwardOutlined,
    StepForwardOutlined,
    UnorderedListOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
} from "@ant-design/icons";
import { Button, Card, List, Modal, Slider, Space, theme, Tooltip, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { TonieCardProps } from "../../types/tonieTypes";
import { isIOS, supportsOggOpus } from "../../utils/browserUtils";

import logoImg from "../../assets/logo.png";

const { Title, Text } = Typography;
const { useToken } = theme;
interface StandAloneAudioPlayerProps {
    tonieCard?: TonieCardProps;
}

const StandAloneAudioPlayer: React.FC<StandAloneAudioPlayerProps> = ({ tonieCard }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();
    const { token } = useToken();
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTrackNo, setCurrentTrackNo] = useState(0);
    const [currentTrackTitle, setCurrentTrackTitle] = useState("");
    const [isLoaded, setIsLoaded] = useState(false);
    const [isTracklistVisible, setIsTracklistVisible] = useState(false);
    const [volume, setVolume] = useState(100);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100;
        }
    }, [volume]);

    useEffect(() => {
        if (isIOS()) {
            if (isFullscreen) {
                document.body.style.overflow = "hidden";
                document.body.style.position = "fixed";
                document.body.style.width = "100%";
            } else {
                document.body.style.overflow = "";
                document.body.style.position = "";
                document.body.style.width = "";
            }
        }
    }, [isFullscreen]);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handler);
        return () => document.removeEventListener("fullscreenchange", handler);
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !validateSource(url)) return;

        while (audio.firstChild) {
            audio.removeChild(audio.firstChild);
        }
        audio.load();

        setIsPlaying(false);
        setProgress(0);
        setDuration(0);
        setCurrentTrackNo(0);
        setCurrentTrackTitle("");
        setIsLoaded(false);

        const pattern = /\/....04E0\?|(\?ogg)/;
        const matches = pattern.test(url);

        let sourceElement = audio.querySelector("source");
        if (!sourceElement) {
            sourceElement = document.createElement("source");
            audio.appendChild(sourceElement);
        }

        if (matches) {
            sourceElement.type = "audio/ogg";
        }

        const encodedUrl = url.replace("+", "%2B").replace("#", "%23");
        if (sourceElement.src !== encodedUrl) {
            sourceElement.src = encodedUrl;
            audio.load();
        }

        const onLoadedMetadata = () => {
            setDuration(audio.duration || 0);
            setIsLoaded(true);

            const globalAudio = document.getElementById("globalAudioPlayer") as HTMLAudioElement;
            if (globalAudio) {
                while (globalAudio.firstChild) {
                    globalAudio.removeChild(globalAudio.firstChild);
                }
                globalAudio.load();
            }
            setIsPlaying(true);
            audio.play();
        };

        const onTimeUpdate = (e: Event) => handleTimeUpdate(e);
        const onEnded = () => setIsPlaying(false);

        audio.addEventListener("loadedmetadata", onLoadedMetadata);
        audio.addEventListener("canplay", onLoadedMetadata);
        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("ended", onEnded);

        return () => {
            audio.removeEventListener("loadedmetadata", onLoadedMetadata);
            audio.removeEventListener("canplay", onLoadedMetadata);
            audio.removeEventListener("timeupdate", onTimeUpdate);
            audio.removeEventListener("ended", onEnded);
        };
    }, [tonieCard]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !navigator.mediaSession || !tonieCard) return;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentTrackTitle || tonieCard.tonieInfo.episode || "",
            album: tonieCard.tonieInfo.episode || "",
            artist: tonieCard.tonieInfo.series || "",
            artwork: [{ src: tonieCard.tonieInfo.picture, sizes: "96x96,128x128,192x192,256x256,384x384,512x512" }],
        });

        navigator.mediaSession.setActionHandler("play", () => audio.play());
        navigator.mediaSession.setActionHandler("pause", () => audio.pause());
        navigator.mediaSession.setActionHandler("previoustrack", handlePrevTrackButton);
        navigator.mediaSession.setActionHandler("nexttrack", handleNextTrackButton);
    }, [currentTrackTitle, tonieCard]);

    if (!tonieCard) {
        return (
            <Card
                style={{ maxWidth: 420, margin: "auto", textAlign: "center", borderRadius: 12 }}
                cover={
                    <img
                        alt={t("tonies.toniesaudioplayer.unknown")}
                        src={logoImg}
                        style={{
                            borderRadius: 12,
                            minHeight: 220,
                            maxHeight: 220,
                            objectFit: "contain",
                            paddingTop: 16,
                        }}
                    />
                }
                styles={{ body: { padding: "0 24px 24px" } }}
            >
                <Title level={4}>{t("tonies.toniesaudioplayer.selectTonieToPlay")}</Title>
                <Space style={{ marginTop: 16 }} size="large" align="center">
                    <Button type="text" icon={<StepBackwardOutlined style={{ fontSize: 30 }} />} disabled />
                    <Button type="text" icon={<PlayCircleOutlined style={{ fontSize: 40 }} />} disabled />
                    <Button type="text" icon={<StepForwardOutlined style={{ fontSize: 30 }} />} disabled />
                </Space>
            </Card>
        );
    }

    const toggleFullscreen = () => {
        if (isIOS()) {
            setIsFullscreen(!isFullscreen);
            return;
        }
        if (!document.fullscreenElement && cardRef.current) {
            cardRef.current.requestFullscreen().then(() => setIsFullscreen(true));
        } else if (document.fullscreenElement) {
            document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    };

    const openTracklist = () => {
        setIsTracklistVisible(true);
    };

    const closeTracklist = () => {
        setIsTracklistVisible(false);
    };

    const trackSecondsMatchSourceTracks = (tonieCard: TonieCardProps, tracksLength: number) => {
        return tonieCard.trackSeconds?.length === tracksLength;
    };

    const getTrackStartTime = (tonieCard: TonieCardProps, index: number) => {
        const trackSeconds = tonieCard.trackSeconds;
        return (trackSeconds && trackSeconds[index]) || 0;
    };

    const tracklistModal = (
        <Modal
            title={
                tonieCard?.tonieInfo?.series + (tonieCard?.tonieInfo.episode && " - " + tonieCard?.tonieInfo.episode) ||
                t("tonies.toniesaudioplayer.unknown")
            }
            open={isTracklistVisible}
            onCancel={closeTracklist}
            footer={null}
            getContainer={() => cardRef.current || document.body}
        >
            {tonieCard?.tonieInfo?.tracks?.length ? (
                <List
                    size="small"
                    dataSource={tonieCard.tonieInfo.tracks}
                    renderItem={(track: string, index: number) => (
                        <List.Item style={{ textAlign: "left" }}>
                            <div style={{ display: "flex", gap: 16 }}>
                                {trackSecondsMatchSourceTracks(tonieCard, tonieCard.tonieInfo.tracks?.length) ? (
                                    <>
                                        <PlayCircleOutlined
                                            key="playpause"
                                            onClick={() => {
                                                setIsTracklistVisible(false);
                                                handlePlay(getTrackStartTime(tonieCard, index));
                                            }}
                                        />{" "}
                                    </>
                                ) : (
                                    ""
                                )}{" "}
                                <div>
                                    {index + 1}. {track}
                                </div>
                            </div>
                        </List.Item>
                    )}
                />
            ) : (
                <p>{t("tonies.toniesaudioplayer.noTracks")}</p>
            )}
        </Modal>
    );

    const tracks = tonieCard.sourceInfo?.tracks || tonieCard.tonieInfo.tracks || [];
    const trackSeconds = tonieCard.trackSeconds || [];

    const url = tonieCard.valid ? import.meta.env.VITE_APP_TEDDYCLOUD_API_URL + tonieCard.audioUrl : tonieCard.source;

    const validateSource = (url: string) => {
        const pattern = /\/....04E0\?|(\?ogg)/;
        if (pattern.test(url) && !supportsOggOpus()) {
            Modal.error({
                title: "Unsupported Format",
                content: "Your browser does not support OGG/Opus audio playback.",
            });
            return false;
        }
        return true;
    };

    const handlePause = () => {
        if (!audioRef.current || !isLoaded) return;
        const audio = audioRef.current;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        }
    };

    const handlePlay = (startTime?: number) => {
        if (!audioRef.current || !isLoaded) return;

        const audio = audioRef.current;

        if (startTime) {
            audio.currentTime = startTime;
        }

        if (!isPlaying) {
            audio
                .play()
                .then(() => {
                    setIsPlaying(true);
                })
                .catch((err) => {
                    console.warn("Play interrupted:", err);
                });
        }
    };

    const handleSeek = (value: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = value;
            setProgress(value);
        }
    };

    const handleTimeUpdate = (event: Event) => {
        const audio = event.currentTarget as HTMLAudioElement;
        setProgress(audio.currentTime);
        setDuration(audio.duration);

        if (tracks.length && trackSeconds.length && tracks.length === trackSeconds.length) {
            const index = trackSeconds.findIndex((start, i) => {
                const next = trackSeconds[i + 1];
                return audio.currentTime >= start && (!next || audio.currentTime < next);
            });
            if (index !== -1) {
                setCurrentTrackNo(index + 1);
                setCurrentTrackTitle(tracks[index]);
            } else {
                setCurrentTrackNo(0);
                setCurrentTrackTitle("");
            }
        }
    };

    const handlePrevTrackButton = () => {
        if (!audioRef.current || !isLoaded) return;
        const audio = audioRef.current;
        let i = 0;
        while (i < trackSeconds.length && audio.currentTime > trackSeconds[i]) i++;
        audio.currentTime = i > 1 ? trackSeconds[i - 2] : 0;
    };

    const handleNextTrackButton = () => {
        if (!audioRef.current || !isLoaded) return;
        const audio = audioRef.current;
        let i = 0;
        while (i < trackSeconds.length && audio.currentTime > trackSeconds[i]) i++;
        if (i < trackSeconds.length) audio.currentTime = trackSeconds[i];
    };

    const isFullscreenIOS = isFullscreen && isIOS();
    const isFullscreenNonIOS = isFullscreen && !isIOS();

    const cardStyles: React.CSSProperties = {
        maxWidth: isFullscreenNonIOS ? "100%" : 420,
        minHeight: isFullscreenNonIOS ? 600 : undefined,
        height: isFullscreenNonIOS ? "100vh" : "auto",
        width: isFullscreenNonIOS ? "95vw" : "auto",
        margin: "auto",
        textAlign: "center",
        borderRadius: isFullscreenIOS ? 0 : 12,
        border: isFullscreenIOS ? "none" : undefined,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        overflowY: isFullscreen ? (isIOS() ? "hidden" : "auto") : "visible",
        overflowX: isFullscreen ? "hidden" : "visible",
    };

    const playerCard = (
        <Card
            ref={cardRef}
            size="small"
            style={cardStyles}
            styles={{
                body: {
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    padding: isFullscreen ? "24px" : "0 16px 16px",
                    boxSizing: "border-box",
                },
                cover: {},
            }}
            cover={
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <img
                        alt={tonieCard.tonieInfo.episode}
                        src={tonieCard.tonieInfo.picture}
                        style={{
                            borderRadius: 12,
                            objectFit: "contain",
                            paddingTop: 16,
                            height: isFullscreen ? "50vh" : 220,
                            width: "auto",
                        }}
                    />
                    <Button
                        type="text"
                        onClick={toggleFullscreen}
                        icon={
                            isFullscreen ? (
                                <FullscreenExitOutlined style={{ fontSize: 20 }} />
                            ) : (
                                <FullscreenOutlined style={{ fontSize: 20 }} />
                            )
                        }
                        style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            zIndex: 10,
                        }}
                    />
                </div>
            }
        >
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <div>
                    <Title level={4}>{tonieCard.tonieInfo.episode}</Title>
                    <Text type="secondary">{tonieCard.tonieInfo.series}</Text>
                    {currentTrackTitle && (
                        <Text style={{ display: "block", marginTop: 8, fontWeight: 500 }}>{currentTrackTitle}</Text>
                    )}
                    <div style={{ marginTop: 16 }}>
                        <Slider
                            min={0}
                            max={duration}
                            value={progress}
                            onChange={handleSeek}
                            tooltip={{
                                formatter: (val) =>
                                    `${Math.floor((val || 0) / 60)}:${String(Math.floor((val || 0) % 60)).padStart(
                                        2,
                                        "0"
                                    )}`,
                            }}
                            marks={
                                tonieCard.trackSeconds
                                    ? tonieCard.trackSeconds.reduce((acc: Record<number, string>, sec: number) => {
                                          acc[sec] = " ";
                                          return acc;
                                      }, {})
                                    : undefined
                            }
                            style={{ marginBottom: 8 }}
                        />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Text>
                            {Math.floor(progress / 60) ?? 0}:{String(Math.floor(progress % 60) ?? 0).padStart(2, "0")}
                        </Text>
                        {currentTrackTitle ? (
                            <div>
                                {currentTrackNo}
                                {tonieCard.tonieInfo.tracks.length && <> / {tonieCard.tonieInfo.tracks.length}</>}
                            </div>
                        ) : (
                            ""
                        )}
                        {Number.isFinite(duration) && !isNaN(duration) && (
                            <Text>
                                {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}
                            </Text>
                        )}
                    </div>
                </div>
                <Space style={{ marginTop: 16, justifyContent: "center" }} size="large" align="center">
                    <Button
                        type="text"
                        icon={<UnorderedListOutlined style={{ fontSize: 30 }} />}
                        onClick={() => openTracklist()}
                        disabled={!isLoaded || tonieCard.tonieInfo.tracks.length == 0}
                    />
                    <Button
                        type="text"
                        icon={<StepBackwardOutlined style={{ fontSize: 30 }} />}
                        onClick={handlePrevTrackButton}
                        disabled={!isLoaded}
                    />
                    <Button
                        type="text"
                        icon={
                            isPlaying ? (
                                <PauseCircleOutlined style={{ fontSize: 40 }} />
                            ) : (
                                <PlayCircleOutlined style={{ fontSize: 40 }} />
                            )
                        }
                        onClick={() => (!isPlaying ? handlePlay() : handlePause())}
                        disabled={!isLoaded}
                    />
                    <Button
                        type="text"
                        icon={<StepForwardOutlined style={{ fontSize: 30 }} />}
                        onClick={handleNextTrackButton}
                        disabled={!isLoaded}
                    />
                    <Tooltip
                        trigger="click"
                        placement="top"
                        title={
                            <div style={{ width: 120 }}>
                                <Slider min={0} max={100} value={volume} onChange={setVolume} />
                            </div>
                        }
                        getPopupContainer={() => cardRef.current || document.body}
                    >
                        <Button
                            type="text"
                            disabled={!isLoaded || isIOS()}
                            icon={
                                volume === 0 ? (
                                    <MutedOutlined style={{ fontSize: 30 }} />
                                ) : (
                                    <SoundOutlined style={{ fontSize: 30 }} />
                                )
                            }
                        />
                    </Tooltip>
                </Space>
            </div>
            {tracklistModal}
        </Card>
    );

    return (
        <>
            <audio ref={audioRef} />
            {isFullscreenIOS ? (
                <div
                    className="iOSFullscreenWrapper"
                    style={{
                        height: "100% !important",
                        width: "100% !important",
                        margin: "0 !important",
                        padding: "0 !important",
                        position: "fixed",
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        zIndex: "1000",
                        borderRadius: "0 !important",
                        backgroundColor: token.colorBgContainer,
                        overflow: "hidden !important",
                    }}
                >
                    {playerCard}
                </div>
            ) : (
                playerCard
            )}
        </>
    );
};

export default StandAloneAudioPlayer;
