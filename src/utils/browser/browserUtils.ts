import { RefObject, useEffect, useState, useCallback } from "react";

// ============================
// Browser / Platform Helpers
// ============================

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

const getUserAgent = () => {
    if (!isBrowser || !navigator.userAgent) return "";
    return navigator.userAgent;
};

export const isSafari = () => {
    if (!isBrowser) return false;
    const ua = getUserAgent().toLowerCase();
    return ua.includes("safari") && !ua.includes("chrome") && !ua.includes("android");
};

export const isWebKit = () => {
    if (!isBrowser) return false;
    return "WebkitAppearance" in (document.documentElement?.style ?? {});
};

let cachedOggOpusSupport: boolean | null = null;
export const supportsOggOpus = () => {
    if (!isBrowser) return false;
    if (cachedOggOpusSupport !== null) {
        return cachedOggOpusSupport;
    }

    const audio = document.createElement("audio") as HTMLAudioElement;
    const canPlay = audio.canPlayType("audio/ogg; codecs=opus");
    cachedOggOpusSupport = canPlay === "probably" || canPlay === "maybe";
    return cachedOggOpusSupport;
};

export const isIOS = () => {
    if (!isBrowser) return false;
    const ua = getUserAgent();
    return (
        /iPad|iPhone|iPod/.test(ua) || (navigator.maxTouchPoints > 1 && /Mac/.test(ua)) // iPadOS als "Mac"
    );
};

export const isVolumeControlSupported = (): boolean => {
    if (!isBrowser) return false;

    const testAudio = document.createElement("audio");
    try {
        testAudio.volume = 0.5;
        return testAudio.volume === 0.5;
    } catch {
        return false;
    }
};

export const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// ============================
// Theme / Color Scheme
// ============================

export type ThemeMode = "dark" | "light" | "matrix" | "auto";

export function detectColorScheme(): ThemeMode {
    if (!isBrowser) return "light";

    const storedTheme = localStorage.getItem("theme") as ThemeMode | null;
    const prefersDarkMode = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

    if (!storedTheme || storedTheme === "auto") {
        return prefersDarkMode ? "dark" : "light";
    }

    return storedTheme;
}

// ============================
// Fullscreen Hook
// ============================

export function useFullscreen<T extends HTMLElement>(elementRef: RefObject<T | null>) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (!isBrowser) return;

        const handler = () => {
            if (document.fullscreenElement) {
                setIsFullscreen(true);
            } else {
                setIsFullscreen(false);
            }
        };

        document.addEventListener("fullscreenchange", handler);
        document.addEventListener("webkitfullscreenchange", handler as EventListener);
        document.addEventListener("mozfullscreenchange", handler as EventListener);
        document.addEventListener("MSFullscreenChange", handler as EventListener);

        return () => {
            document.removeEventListener("fullscreenchange", handler);
            document.removeEventListener("webkitfullscreenchange", handler as EventListener);
            document.removeEventListener("mozfullscreenchange", handler as EventListener);
            document.removeEventListener("MSFullscreenChange", handler as EventListener);
        };
    }, []);

    const enterFullscreen = useCallback(() => {
        if (!isBrowser) return;

        const el = elementRef.current;
        if (!el) {
            return;
        }

        if (isIOS()) {
            setIsFullscreen(true);
            return;
        }

        const anyEl = el as any;

        const request =
            el.requestFullscreen ||
            anyEl.webkitRequestFullscreen ||
            anyEl.mozRequestFullScreen ||
            anyEl.msRequestFullscreen;

        if (request) {
            try {
                request.call(el);
                // Status wird über fullscreenchange-Event gesetzt,
                // wir setzen hier nur optimistisch auf true
                setIsFullscreen(true);
            } catch (err) {
                console.warn("Fullscreen request failed, using pseudo fullscreen fallback:", err);
                setIsFullscreen(true);
            }
        } else {
            // Fallback: Pseudo-Fullscreen über CSS
            setIsFullscreen(true);
        }
    }, [elementRef]);

    const exitFullscreen = useCallback(() => {
        if (!isBrowser) return;

        if (isIOS()) {
            // Nur internen Status zurücksetzen, Pseudo-Fullscreen verlässt du über CSS
            setIsFullscreen(false);
            return;
        }

        const anyDoc = document as any;

        const exit =
            document.exitFullscreen ||
            anyDoc.webkitExitFullscreen ||
            anyDoc.mozCancelFullScreen ||
            anyDoc.msExitFullscreen;

        if (document.fullscreenElement && exit) {
            try {
                exit.call(document);
            } catch (err) {
                console.warn("Exiting fullscreen failed, using pseudo fullscreen fallback:", err);
                setIsFullscreen(false);
            }
        } else {
            setIsFullscreen(false);
        }
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (isFullscreen) {
            exitFullscreen();
        } else {
            enterFullscreen();
        }
    }, [enterFullscreen, exitFullscreen, isFullscreen]);

    return { isFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen };
}

// ============================
// Smooth Scroll to Top
// ============================

export function scrollToTop(anchor?: HTMLElement | null) {
    if (!isBrowser) return;

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

    const cleanup = () => {
        window.removeEventListener("wheel", cancel);
        window.removeEventListener("touchstart", cancel);
        window.removeEventListener("touchmove", cancel);
        window.removeEventListener("keydown", cancel);
    };

    const cancel = () => {
        isCancelled = true;
        cleanup();
    };

    const opts: AddEventListenerOptions = { passive: true };

    window.addEventListener("wheel", cancel, opts);
    window.addEventListener("touchstart", cancel, opts);
    window.addEventListener("touchmove", cancel, opts);
    window.addEventListener("keydown", cancel, opts);

    const duration = 400;
    const startTime = performance.now();

    const step = (now: number) => {
        if (isCancelled) {
            return;
        }

        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);

        // ease-out-cubic
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
