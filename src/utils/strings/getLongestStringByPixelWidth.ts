export function getLongestStringByPixelWidth(
    strings: string[],
    font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
): { longestString: string; pixelWidth: number } {
    let longestString = "";
    let maxWidth = 0;

    if (typeof document === "undefined") {
        return { longestString, pixelWidth: maxWidth };
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
        return { longestString, pixelWidth: maxWidth };
    }

    context.font = font;

    for (const str of strings) {
        const width = context.measureText(str).width;
        if (width > maxWidth) {
            maxWidth = width;
            longestString = str;
        }
    }

    return {
        longestString,
        pixelWidth: maxWidth,
    };
}
