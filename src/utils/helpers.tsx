export function getLongestStringByPixelWidth(
    stringsArray: string[],
    font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
) {
    console.log(font);
    console.log(stringsArray);
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
    console.log(maxWidth);
    console.log(longestString);
    return {
        longestString,
        pixelWidth: maxWidth,
    };
}
