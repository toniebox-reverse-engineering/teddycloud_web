import React from "react";
import { PlayCircleOutlined, PauseCircleOutlined, StepBackwardOutlined, StepForwardOutlined } from "@ant-design/icons";
import { useAudioContext } from "../audio/AudioContext";
import { useEffect, useState } from "react";
import MediaSession from "@mebtte/react-media-session";
import { Progress, Tooltip } from "antd";

const AudioPlayerFooter: React.FC = () => {
    const { songImage, songArtist, songTitle } = useAudioContext(); // Access the songImage from the audio context
    const [isPlaying, setIsPlaying] = useState(false);
    const globalAudio = document.getElementById("globalAudioPlayer") as HTMLAudioElement;
    const [currentPlayPosition, setCurrentPlayPosition] = useState(0);
    const [currentPlayPositionFormat, setCurrentPlayPositionFormat] = useState("0:00");
    const [audioDurationFormat, setAudioDurationFormat] = useState("0:00");
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [cyclePosition, setCyclePosition] = useState<{
        left: number;
        top: number;
        visible: boolean;
    }>({ left: 0, top: 0, visible: false });
    const [isMouseDown, setIsMouseDown] = useState<boolean>(false);

    const handlePlayPause = () => {
        setIsPlaying((isPlaying) => !isPlaying);
    };

    const handleAudioPlay = () => {
        setIsPlaying(true);
    };

    const handleAudioPause = () => {
        setIsPlaying(false);
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
    };

    const handlePlayButton = () => {
        globalAudio.play();
    };
    const handlePauseButton = () => {
        globalAudio.pause();
    };

    const handleTimeUpdate = (event: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        const audioElement = event.target as HTMLAudioElement;
        const minutes = Math.floor(audioElement.currentTime / 60);
        const seconds = Math.floor(audioElement.currentTime % 60);
        setCurrentPlayPosition((audioElement.currentTime / globalAudio.duration) * 100);
        setCurrentPlayPositionFormat(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
    };
    useEffect(() => {
        const globalAudio = document.getElementById("globalAudioPlayer") as HTMLAudioElement;
        globalAudio.addEventListener("loadedmetadata", () => {
            const minutes = Math.floor(globalAudio.duration / 60);
            const seconds = Math.floor(globalAudio.duration % 60);
            setAudioDurationFormat(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
        });
        globalAudio.addEventListener("progress", () => {
            if (globalAudio.buffered.length > 0) {
                const bufferedEnd = globalAudio.buffered.end(globalAudio.buffered.length - 1);
                const duration = globalAudio.duration;
                if (duration > 0) {
                    setDownloadProgress((bufferedEnd / duration) * 100);
                }
            }
        });
    }, []);

    const handleMouseMove = (event: React.MouseEvent) => {
        const progressBarRect = event.currentTarget.getBoundingClientRect();
        const offsetX = event.clientX - progressBarRect.left;
        const offsetY = progressBarRect.height / 2;
        setCyclePosition({ left: offsetX, top: offsetY, visible: true });

        if (isMouseDown) {
            handleClick();
        }
    };
    const handleMouseLeave = () => {
        setCyclePosition({ left: 0, top: 0, visible: false });
    };
    const handleClick = () => {
        globalAudio.currentTime = (cyclePosition.left / 200) * globalAudio.duration;
    };
    const handleMouseDown = (event: React.MouseEvent) => {
        setIsMouseDown(true);
    };
    const handleMouseUp = (event: React.MouseEvent) => {
        setIsMouseDown(false);
    };

    return (
        <div style={styles.container}>
            <div style={styles.controls}>
                <StepBackwardOutlined style={styles.controlButton} />
                {isPlaying ? (
                    <PauseCircleOutlined style={styles.controlButton} onClick={handlePauseButton} />
                ) : (
                    <PlayCircleOutlined style={styles.controlButton} onClick={handlePlayButton} />
                )}
                <StepForwardOutlined style={styles.controlButton} />
            </div>
            <div style={styles.trackInfo}>
                {songImage && <img src={songImage} alt="Song" style={styles.songImage} />}
                <div style={styles.songContainer}>
                    <div style={styles.songTitle}>{songTitle}</div>
                    <div style={styles.songArtist}>{songArtist}</div>
                </div>
                <div style={styles.playPositionContainer}>
                    <div style={styles.playPosition}>
                        <div style={{ textAlign: "center" }}>
                            {currentPlayPositionFormat} / {audioDurationFormat}
                        </div>
                    </div>
                    <div
                        style={{
                            display: "block",
                            position: "relative",
                            width: "200px",
                            marginRight: "10px",
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        onClick={handleClick}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                    >
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
                    </div>
                </div>
            </div>
            <div>
                <audio
                    id="globalAudioPlayer"
                    controls={true}
                    onPlay={handleAudioPlay}
                    onPause={handleAudioPause}
                    onEnded={handleAudioEnded}
                    onTimeUpdate={handleTimeUpdate}
                >
                    Your browser does not support the audio element.
                </audio>
                <MediaSession
                    title={songTitle}
                    artist={songArtist}
                    artwork={[
                        {
                            src: songImage,
                            sizes: "256x256,384x384,512x512",
                        },
                        {
                            src: songImage,
                            sizes: "96x96,128x128,192x192",
                        },
                    ]}
                ></MediaSession>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px",
        backgroundColor: "#333",
    },
    controls: {
        display: "flex",
        alignItems: "center",
    },
    controlButton: {
        fontSize: "24px",
        margin: "0 10px",
        cursor: "pointer",
    },
    trackInfo: {
        display: "flex",
        alignItems: "center",
    },
    songImage: {
        width: "auto",
        height: "40px",
        borderRadius: "50%",
        marginRight: "10px",
    },
    songContainer: {},
    songTitle: {
        display: "block",
    },
    songArtist: {
        display: "block",
    },
    playPosition: {
        fontSize: "14px",
        width: "100%",
    },
    playPositionContainer: {
        marginLeft: "10px",
        marginRight: "10px",
    },
};

export default AudioPlayerFooter;
