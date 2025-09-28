import { PauseCircleOutlined, PlayCircleOutlined, StepBackwardOutlined, StepForwardOutlined } from "@ant-design/icons";
import { Button, Card, Modal, Slider, Space, Typography } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TonieCardProps } from "../../types/tonieTypes";
import { supportsOggOpus } from "../../utils/browserUtils";

import logoImg from "../../assets/logo.png";

const { Title, Text } = Typography;

interface StandAloneAudioPlayerProps {
    tonieCard?: TonieCardProps;
}

const StandAloneAudioPlayer: React.FC<StandAloneAudioPlayerProps> = ({ tonieCard }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const { t } = useTranslation();
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTrackNo, setCurrentTrackNo] = useState(0);
    const [currentTrackTitle, setCurrentTrackTitle] = useState("");
    const [isLoaded, setIsLoaded] = useState(false);

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

    // MediaSession
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

    const handlePlayPause = () => {
        if (!audioRef.current || !isLoaded) return;

        const audio = audioRef.current;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio
                .play()
                .then(() => {
                    setIsPlaying(true);
                })
                .catch((err) => {
                    // Play was interrupted, usually safe to ignore
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

    return (
        <Card
            size="small"
            style={{ maxWidth: 420, margin: "auto", textAlign: "center", borderRadius: 12 }}
            cover={
                <img
                    alt={tonieCard.tonieInfo.episode}
                    src={tonieCard.tonieInfo.picture}
                    style={{ borderRadius: 12, minHeight: 220, maxHeight: 220, objectFit: "contain", paddingTop: 16 }}
                />
            }
            styles={{ body: { padding: "0 16px 16px" } }}
        >
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
                            `${Math.floor((val || 0) / 60)}:${String(Math.floor((val || 0) % 60)).padStart(2, "0")}`,
                    }}
                />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>
                    {Math.floor(progress / 60) ?? 0}:{String(Math.floor(progress % 60) ?? 0).padStart(2, "0")}
                </Text>
                <Text>
                    {Math.floor(duration / 60) ?? 0}:{String(Math.floor(duration % 60) ?? 0).padStart(2, "0")}
                </Text>
            </div>

            <Space style={{ marginTop: 16 }} size="large" align="center">
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
                    onClick={handlePlayPause}
                    disabled={!isLoaded}
                />
                <Button
                    type="text"
                    icon={<StepForwardOutlined style={{ fontSize: 30 }} />}
                    onClick={handleNextTrackButton}
                    disabled={!isLoaded}
                />
            </Space>

            <audio ref={audioRef} />
        </Card>
    );
};

export default StandAloneAudioPlayer;
