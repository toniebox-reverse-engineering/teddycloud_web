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

export function scrollToTop() {
    const scroller = document.scrollingElement || document.documentElement || document.body;

    try {
        scroller.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } catch {
        scroller.scrollTop = 0;
    }

    if (scroller.scrollTop > 0) {
        const step = () => {
            const c = scroller.scrollTop;
            if (c > 0) {
                scroller.scrollTop = c - Math.max(1, c / 8);
                requestAnimationFrame(step);
            }
        };
        requestAnimationFrame(step);
    }
}
