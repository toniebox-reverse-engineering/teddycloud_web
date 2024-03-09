import { TonieCardProps } from '../../components/tonies/TonieCard';
import React, { useContext, useState } from 'react';

interface AudioContextType {
    playAudio: (url: string, meta?: any) => void;
    songImage: string | undefined;
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
    const [songImage, setSongImage] = useState<string | undefined>(undefined);

    const playAudio = (url: string, meta?: any) => {
        console.log("Play audio: " + url);
        const globalAudio = document.getElementById('globalAudioPlayer') as HTMLAudioElement;
        globalAudio.src = url;
        globalAudio.play();
        if (meta) {
            setSongImage(meta.picture);
        }
    };

    return (
        <AudioContext.Provider value={{ playAudio, songImage }}>
            {children}
        </AudioContext.Provider>
    );
};
