export const isSafari = () => {
    const ua = navigator.userAgent.toLowerCase();
    // Check if it contains "safari" and does not contain "chrome" (to avoid Chrome on iOS)
    return ua.includes("safari") && !ua.includes("chrome");
};

export const isWebKit = () => {
    return "WebkitAppearance" in document.documentElement.style;
};
