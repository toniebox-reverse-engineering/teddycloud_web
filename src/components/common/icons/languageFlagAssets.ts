export async function loadFlagAsset(code: string): Promise<string | null> {
    try {
        const mod = await import(`../../../assets/country-flags-3x2/${code}.svg`);
        return mod.default;
    } catch {
        return null;
    }
}
