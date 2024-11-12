import { useState, useEffect } from "react";

const DotAnimation = () => {
    const [dots, setDots] = useState(0);
    const dotFrames = ["", ".", "..", "...", "....", "....."];

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prevDots) => (prevDots + 1) % dotFrames.length);
        }, 666);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <>{dotFrames[dots]}</>;
};

export default DotAnimation;
