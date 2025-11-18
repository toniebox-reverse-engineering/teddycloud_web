import { RefObject, useEffect, useState } from "react";

export const isSafari = () => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes("safari") && !ua.includes("chrome");
};

export const isWebKit = () => {
    return "WebkitAppearance" in document.documentElement.style;
};

export const supportsOggOpus = () => {
    const audio = document.createElement("audio") as HTMLAudioElement;
    const canPlay = audio.canPlayType("audio/ogg; codecs=opus");
    console.log("Supports OGG/Opus:", canPlay);
    return canPlay === "probably" || canPlay === "maybe";
};

export const isIOS = () => {
    return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent))
    );
};

export function useFullscreen<T extends HTMLElement>(elementRef: RefObject<T | null>) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handler = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handler);
        return () => document.removeEventListener("fullscreenchange", handler);
    }, []);

    const enterFullscreen = () => {
        const el = elementRef.current;
        if (!el) return;

        if (isIOS()) {
            setIsFullscreen(true);
        } else if (el.requestFullscreen) {
            try {
                el.requestFullscreen();
                setIsFullscreen(true);
            } catch (err) {
                console.warn("Fullscreen request failed, using pseudo fullscreen fallback:", err);
                setIsFullscreen(true);
            }
        } else {
            setIsFullscreen(true);
        }
    };

    const exitFullscreen = () => {
        if (isIOS()) {
            setIsFullscreen(false);
        } else if (document.fullscreenElement) {
            try {
                document.exitFullscreen();
            } catch (err) {
                console.warn("Exiting fullscreen failed, using pseudo fullscreen fallback:", err);
                setIsFullscreen(false);
            }
        } else {
            setIsFullscreen(false);
        }
    };

    return { isFullscreen, enterFullscreen, exitFullscreen };
}

export const isVolumeControlSupported = (): boolean => {
    const testAudio = document.createElement("audio");
    try {
        testAudio.volume = 0.5;
        return testAudio.volume === 0.5;
    } catch (error) {
        return false;
    }
};

export function detectColorScheme() {
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const storedTheme = localStorage.getItem("theme");

    if (storedTheme === "auto") {
        return prefersDarkMode ? "dark" : "light";
    } else {
        return storedTheme;
    }
}

export function scrollToTop(anchor?: HTMLElement | null) {
    if (anchor) {
        try {
            anchor.scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "nearest",
            });
        } catch {
            anchor.scrollIntoView(true);
        }
        return;
    }

    const scroller = document.scrollingElement || document.documentElement || document.body;
    let isCancelled = false;

    const cancel = () => {
        isCancelled = true;
    };
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", cancel, { passive: true });

    try {
        scroller.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } catch {
        scroller.scrollTop = 0;
    }

    const cleanup = () => {
        window.removeEventListener("wheel", cancel);
        window.removeEventListener("touchstart", cancel);
        window.removeEventListener("keydown", cancel);
    };

    const checkFinished = () => {
        if (scroller.scrollTop === 0 || isCancelled) {
            cleanup();
        } else {
            requestAnimationFrame(checkFinished);
        }
    };
    requestAnimationFrame(checkFinished);
}
