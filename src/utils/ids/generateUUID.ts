export function generateUUID(): string {
    // Prefer cryptographically strong UUID when available
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        return ([1e7] + "-1e3-4e3-8e3-1e11").replace(/[018]/g, (c) =>
            ((Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))) as number).toString(
                16
            )
        );
    }

    // Fallback (non-cryptographic)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
        const r = (Math.random() * 16) | 0;
        const v = ch === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
