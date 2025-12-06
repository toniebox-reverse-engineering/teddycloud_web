import { useEffect, useState } from "react";

export function usePageLoaded(): boolean {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const handleLoad = () => setLoaded(true);

        if (document.readyState === "complete") {
            setLoaded(true);
        } else {
            window.addEventListener("load", handleLoad);
            return () => window.removeEventListener("load", handleLoad);
        }
    }, []);

    return loaded;
}
