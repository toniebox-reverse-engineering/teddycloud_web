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
    const startY = window.pageYOffset ?? document.documentElement.scrollTop ?? document.body.scrollTop ?? 0;

    let targetY = 0;

    if (anchor) {
        const rect = anchor.getBoundingClientRect();
        targetY = startY + rect.top;
    }

    if (Math.abs(startY - targetY) < 1) {
        return;
    }

    let isCancelled = false;

    const cancel = () => {
        isCancelled = true;
        cleanup();
    };

    const opts: AddEventListenerOptions = { passive: true };

    window.addEventListener("wheel", cancel, opts);
    window.addEventListener("touchstart", cancel, opts);
    window.addEventListener("touchmove", cancel, opts);
    window.addEventListener("keydown", cancel, opts);

    function cleanup() {
        window.removeEventListener("wheel", cancel);
        window.removeEventListener("touchstart", cancel);
        window.removeEventListener("touchmove", cancel);
        window.removeEventListener("keydown", cancel);
    }

    const duration = 400;
    const startTime = performance.now();

    const step = (now: number) => {
        if (isCancelled) {
            return;
        }

        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);

        const eased = 1 - Math.pow(1 - t, 3);

        const nextY = startY + (targetY - startY) * eased;

        window.scrollTo(0, nextY);

        if (t < 1 && !isCancelled) {
            requestAnimationFrame(step);
        } else {
            cleanup();
        }
    };

    requestAnimationFrame(step);
}
