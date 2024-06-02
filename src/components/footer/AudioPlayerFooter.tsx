import React from "react";
import {
    PlayCircleOutlined,
    PauseCircleOutlined,
    StepBackwardOutlined,
    StepForwardOutlined,
    CloseCircleOutlined,
    SoundOutlined,
    MutedOutlined,
} from "@ant-design/icons";
import { useAudioContext } from "../audio/AudioContext";
import { useEffect, useState } from "react";
import MediaSession from "@mebtte/react-media-session";
import { Progress, Slider, theme } from "antd";

const { useToken } = theme;
const useThemeToken = () => useToken().token;
interface AudioPlayerFooterProps {
    /*
    isPlaying?: boolean;
    onPlayPause?: () => void;
    onLast?: () => void;
    onNext?: () => void;
    currentPlayPosition?: string;
    songImage?: string;
    */
    onVisibilityChange: () => void;
}

const AudioPlayerFooter: React.FC<AudioPlayerFooterProps> = ({ onVisibilityChange }) => {
    const { songImage, songArtist, songTitle } = useAudioContext(); // Access the songImage from the audio context
    const globalAudio = document.getElementById("globalAudioPlayer") as HTMLAudioElement;

    const [audioPlayerDisplay, setAudioPlayerDisplay] = useState<string>("none");
    const [isPlaying, setIsPlaying] = useState(false);
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
    const [volume, setVolume] = useState<number | null>(100);
    const [lastVolume, setLastVolume] = useState<number | null>(100);

    useEffect(() => {
        if (globalAudio) {
            if (volume === null) {
                globalAudio.volume = 0;
            } else {
                globalAudio.volume = volume / 100;
            }
        }
    }, [volume, globalAudio]);

    const handleSliderChange = (value: number | [number, number]) => {
        if (Array.isArray(value)) {
            return;
        }
        setVolume(value);
    };

    const handleMuteClick = () => {
        setLastVolume(volume);
        setVolume(0);
    };

    const handleUnMuteClick = () => {
        setVolume(lastVolume);
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

    const handleClosePlayer = () => {
        globalAudio.src = "";
        globalAudio.removeAttribute("src");
        globalAudio.load();
        setAudioPlayerDisplay("none");
        onVisibilityChange();
    };

    useEffect(() => {
        onVisibilityChange();
        if (globalAudio?.src && audioPlayerDisplay === "none") {
            setAudioPlayerDisplay("flex");
        }
    }, [audioPlayerDisplay, globalAudio?.src, onVisibilityChange]);

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

    // rearrange player for mobile
    const isMobile = window.innerWidth <= 768;
    const containerStyle: React.CSSProperties = isMobile
        ? {
              ...styles.container,
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              gap: 8,
          }
        : styles.container;
    const controlsStyle: React.CSSProperties = isMobile ? { ...styles.controls } : styles.controls;

    useEffect(() => {
        onVisibilityChange();
    }, [onVisibilityChange, isMobile]);

    return (
        <div
            style={{
                ...containerStyle,
                display: audioPlayerDisplay,
                visibility: !globalAudio?.src ? "hidden" : "visible",
                height: !globalAudio?.src ? "0" : "auto",
                margin: !globalAudio?.src ? "-24px" : "0",
                marginBottom: !globalAudio?.src ? "0" : "8px",
                overflow: "hidden",
            }}
        >
            <div id="audioPlayer" style={controlsStyle}>
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
                    <div>{songTitle}</div>
                    <div>{songArtist}</div>
                </div>
            </div>
            <div style={styles.playPositionContainer}>
                <div>
                    <div style={{ textAlign: "center" }}>
                        {currentPlayPositionFormat} / {audioDurationFormat}
                    </div>
                </div>
                <div
                    style={styles.progressBar}
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
            <div style={styles.controls2}>
                <div style={{ ...controlsStyle, position: "relative" }}>
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
                    <div style={styles.volumeSlider}>
                        <Slider min={0} max={100} value={volume || 0} onChange={handleSliderChange} />
                    </div>
                </div>
                <div>
                    <CloseCircleOutlined style={styles.controlButton} onClick={handleClosePlayer} />
                </div>
            </div>
            <audio
                id="globalAudioPlayer"
                controls={true}
                onPlay={handleAudioPlay}
                onPause={handleAudioPause}
                onEnded={handleAudioEnded}
                onTimeUpdate={handleTimeUpdate}
                style={{ display: "none" }}
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
    );
};

const styles = {
    container: {
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
        backgroundColor: "#333",
        borderRadius: 8,
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
        justifyContent: "center",
        minWidth: Math.min(window.innerWidth * 0.5, 350),
    },
    songImage: {
        width: "auto",
        height: 40,
        borderRadius: "50%",
        marginRight: 10,
    },
    songContainer: {},
    songTitle: {
        display: "block",
    },
    songArtist: {
        display: "block",
    },
    progressBar: {
        display: "block",
        position: "relative" as "relative",
        width: "200px",
        marginRight: "10px",
    },
    playPosition: {
        fontSize: "14px",
        width: "100%",
    },
    playPositionContainer: {
        marginLeft: 10,
        marginRight: 10,
    },
    controls2: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 32,
    },
    volumeSlider: {
        width: 100,
        position: "releative" as "relative",
        marginLeft: 8,
        top: "calc(100% + 10px)",
        zIndex: 1000,
        backgroundColor: `${() => useThemeToken().colorBgContainer}`,
        padding: 0,
    },
    volumeIcon: {
        fontSize: "24px",
        cursor: "pointer",
        marginBottom: 0,
    },
};

export default AudioPlayerFooter;
