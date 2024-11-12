export function getLongestStringByPixelWidth(
    stringsArray: string[],
    font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
) {
    let longestString = "";
    let maxWidth = 0;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (context) {
        context.font = font;
        stringsArray.forEach((str) => {
            const width = context.measureText(str).width;
            if (width > maxWidth) {
                maxWidth = width;
                longestString = str;
            }
        });
    }
    return {
        longestString,
        pixelWidth: maxWidth,
    };
}

export function generateUUID() {
    return ([1e7] + "-1e3-4e3-8e3-1e11").replace(/[018]/g, (c) =>
        (parseInt(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (parseInt(c) / 4)))).toString(16)
    );
}

export const handleTCCADerDownload = (asC2Der: boolean) => {
    const fileUrl = `${import.meta.env.VITE_APP_TEDDYCLOUD_API_URL}/api/getFile/${asC2Der ? "c2" : "ca"}.der`;
    window.location.href = fileUrl;
};
