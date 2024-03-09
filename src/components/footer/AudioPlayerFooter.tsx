import React from 'react';
import { PlayCircleOutlined, PauseCircleOutlined, StepBackwardOutlined, StepForwardOutlined } from '@ant-design/icons';
import { useAudioContext } from '../audio/AudioContext';
import { useEffect, useState } from 'react';


interface AudioPlayerFooterProps {
    /*
    isPlaying?: boolean;
    onPlayPause?: () => void;
    onLast?: () => void;
    onNext?: () => void;
    currentPlayPosition?: string;
    songImage?: string;
    */
}

const AudioPlayerFooter: React.FC<AudioPlayerFooterProps> = ({ }) => {
    const { songImage } = useAudioContext(); // Access the songImage from the audio context
    const [isPlaying, setIsPlaying] = useState(false);
    const globalAudio = document.getElementById('globalAudioPlayer') as HTMLAudioElement;
    const [currentPlayPosition, setCurrentPlayPosition] = useState('0:00');
    const [audioDuration, setAudioDuration] = useState('0:00');

    const handlePlayPause = () => {
        setIsPlaying(isPlaying => !isPlaying);
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
    }
    const handlePauseButton = () => {
        globalAudio.pause();
    }

    const handleTimeUpdate = (event: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        const audioElement = event.target as HTMLAudioElement;
        const minutes = Math.floor(audioElement.currentTime / 60);
        const seconds = Math.floor(audioElement.currentTime % 60);
        setCurrentPlayPosition(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
    };
    useEffect(() => {
        const globalAudio = document.getElementById('globalAudioPlayer') as HTMLAudioElement;
        globalAudio.addEventListener('loadedmetadata', () => {
            const minutes = Math.floor(globalAudio.duration / 60);
            const seconds = Math.floor(globalAudio.duration % 60);
            setAudioDuration(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        });
    }, []);

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
                <div style={styles.playPosition}>{currentPlayPosition} / {audioDuration}</div>
            </div>
            <div>
                <audio id="globalAudioPlayer" controls
                    onPlay={handleAudioPlay}
                    onPause={handleAudioPause}
                    onEnded={handleAudioEnded}
                    onTimeUpdate={handleTimeUpdate}>
                    Your browser does not support the audio element.
                </audio>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px',
        backgroundColor: '#333',
        color: '#fff',
    },
    controls: {
        display: 'flex',
        alignItems: 'center',
    },
    controlButton: {
        fontSize: '24px',
        margin: '0 10px',
        cursor: 'pointer',
        color: '#fff',
    },
    trackInfo: {
        display: 'flex',
        alignItems: 'center',
    },
    songImage: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        marginRight: '10px',
    },
    playPosition: {
        fontSize: '14px',
    },
};

export default AudioPlayerFooter;