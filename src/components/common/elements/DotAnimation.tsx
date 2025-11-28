import { useState, useEffect } from "react";

const DOT_FRAMES = ["", ".", "..", "...", "....", "....."] as const;
const INTERVAL_MS = 666;

const DotAnimation = () => {
    const [frameIndex, setFrameIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setFrameIndex((prev) => (prev + 1) % DOT_FRAMES.length);
        }, INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, []);

    return <>{DOT_FRAMES[frameIndex]}</>;
};

export default DotAnimation;
