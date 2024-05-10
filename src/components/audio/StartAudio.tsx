import React from "react";
import { useAudioContext } from "./AudioContext";

const StartAudio: React.FC<{ audioUrl: string }> = ({ audioUrl }) => {
    const { playAudio } = useAudioContext();

    const handleStartAudio = () => {
        playAudio(audioUrl);
    };

    return <button onClick={handleStartAudio}>Start Audio</button>;
};

export default StartAudio;
