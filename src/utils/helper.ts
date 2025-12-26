export function generateColorPalette(count: number, saturation = 70, lightness = 50): string[] {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
        const hue = Math.round((360 / count) * i);
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
}

const MM_TO_PX = 96 / 25.4;

export function mmToPx(mm: number): number {
    return mm * MM_TO_PX;
}

export function getContrastTextColor(bgColor: string): string {
    let r: number, g: number, b: number;
    if (bgColor.startsWith("#")) {
        const hex = bgColor.slice(1);
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else if (bgColor.startsWith("rgb")) {
        const values = bgColor.match(/\d+/g)?.map(Number);
        if (!values) return "black";
        [r, g, b] = values;
    } else {
        return "black";
    }

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "black" : "white";
}

export const stripUnit = (value: string, unit: string) =>
    value.toLowerCase().endsWith(unit) ? value.slice(0, -unit.length) : value;
