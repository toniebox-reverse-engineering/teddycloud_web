export function generateColorPalette(count: number, saturation = 70, lightness = 50): string[] {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
        const hue = Math.round((360 / count) * i);
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
}
