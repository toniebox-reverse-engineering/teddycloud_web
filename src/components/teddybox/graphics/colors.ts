/** Mixes a #rrggbb color with white (amount > 0) or black (amount < 0). */
export const shade = (hex: string, amount: number): string => {
    const value = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#e0573f";
    const target = amount > 0 ? 255 : 0;
    const a = Math.min(1, Math.abs(amount));
    const channels = [1, 3, 5].map((i) => {
        const c = parseInt(value.slice(i, i + 2), 16);
        return Math.round(c + (target - c) * a)
            .toString(16)
            .padStart(2, "0");
    });
    return `#${channels.join("")}`;
};

/** Stable color for a placeholder figure, derived from its id. */
export const colorFromId = (id: string, palette: string[]): string => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return palette[hash % palette.length];
};
