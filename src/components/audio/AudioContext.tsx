import { TonieCardProps } from '../../components/tonies/TonieCard';
import React, { useContext, useState } from 'react';

interface AudioContextType {
    playAudio: (url: string, meta?: any) => void;
    songImage: string;
    songArtist: string;
    songTitle: string;
}

const AudioContext = React.createContext<AudioContextType | undefined>(undefined);

export const useAudioContext = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudioContext must be used within an AudioProvider');
    }
    return context;
};

interface AudioProviderProps {
    children: React.ReactNode; // Define the children prop
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
    const [songImage, setSongImage] = useState<string>("");
    const [songArtist, setSongArtist] = useState<string>("");
    const [songTitle, setSongTitle] = useState<string>("");

    const playAudio = (url: string, meta?: any) => {
        console.log("Play audio: " + url);
        const globalAudio = document.getElementById('globalAudioPlayer') as HTMLAudioElement;
        globalAudio.src = url;
        if (meta) {
            setSongImage(meta.picture);
            setSongArtist(meta.series);
            setSongTitle(meta.episode);
        }
        globalAudio.play();
    };

    return (
        <AudioContext.Provider value={{ playAudio, songImage, songArtist, songTitle }}>
            {children}
        </AudioContext.Provider>
    );
};
