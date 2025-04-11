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
