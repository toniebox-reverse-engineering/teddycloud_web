import { useEffect, useState } from "react";

const read = () => ({
    width: window.innerWidth,
    height: window.innerHeight,
    landscape: window.innerWidth > window.innerHeight,
});

export const useViewport = () => {
    const [viewport, setViewport] = useState(read);
    useEffect(() => {
        const update = () => setViewport(read());
        window.addEventListener("resize", update);
        window.addEventListener("orientationchange", update);
        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("orientationchange", update);
        };
    }, []);
    return viewport;
};
