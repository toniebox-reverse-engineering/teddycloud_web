const LATIN_RANGE =
    "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
const LATIN_EXT_RANGE =
    "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF";

type BundledFontSource = {
    url: string;
    unicodeRange: string;
};

type MutableFontFaceSet = FontFaceSet & {
    add: (font: FontFace) => FontFaceSet;
};

const BUNDLED_FONTS: Record<string, BundledFontSource[]> = {
    "Atkinson Hyperlegible": [
        {
            url: new URL(
                "../../../../assets/fonts/teddystudio/atkinson-hyperlegible-latin.woff2",
                import.meta.url,
            ).href,
            unicodeRange: LATIN_RANGE,
        },
        {
            url: new URL(
                "../../../../assets/fonts/teddystudio/atkinson-hyperlegible-latin-ext.woff2",
                import.meta.url,
            ).href,
            unicodeRange: LATIN_EXT_RANGE,
        },
    ],
    Fredoka: [
        {
            url: new URL(
                "../../../../assets/fonts/teddystudio/fredoka-latin.woff2",
                import.meta.url,
            ).href,
            unicodeRange: LATIN_RANGE,
        },
        {
            url: new URL(
                "../../../../assets/fonts/teddystudio/fredoka-latin-ext.woff2",
                import.meta.url,
            ).href,
            unicodeRange: LATIN_EXT_RANGE,
        },
    ],
    "Bubblegum Sans": [
        {
            url: new URL(
                "../../../../assets/fonts/teddystudio/bubblegum-sans-latin.woff2",
                import.meta.url,
            ).href,
            unicodeRange: LATIN_RANGE,
        },
        {
            url: new URL(
                "../../../../assets/fonts/teddystudio/bubblegum-sans-latin-ext.woff2",
                import.meta.url,
            ).href,
            unicodeRange: LATIN_EXT_RANGE,
        },
    ],
    "Patrick Hand": [
        {
            url: new URL(
                "../../../../assets/fonts/teddystudio/patrick-hand-latin.woff2",
                import.meta.url,
            ).href,
            unicodeRange: LATIN_RANGE,
        },
        {
            url: new URL(
                "../../../../assets/fonts/teddystudio/patrick-hand-latin-ext.woff2",
                import.meta.url,
            ).href,
            unicodeRange: LATIN_EXT_RANGE,
        },
    ],
    "Indie Flower": [
        {
            url: new URL(
                "../../../../assets/fonts/teddystudio/indie-flower-latin.woff2",
                import.meta.url,
            ).href,
            unicodeRange: LATIN_RANGE,
        },
        {
            url: new URL(
                "../../../../assets/fonts/teddystudio/indie-flower-latin-ext.woff2",
                import.meta.url,
            ).href,
            unicodeRange: LATIN_EXT_RANGE,
        },
    ],
    Schoolbell: [
        {
            url: new URL(
                "../../../../assets/fonts/teddystudio/schoolbell-latin.woff2",
                import.meta.url,
            ).href,
            unicodeRange: LATIN_RANGE,
        },
    ],
    Inter: [
        {
            url: new URL("../../../../assets/fonts/teddystudio/inter-latin.woff2", import.meta.url)
                .href,
            unicodeRange: LATIN_RANGE,
        },
        {
            url: new URL(
                "../../../../assets/fonts/teddystudio/inter-latin-ext.woff2",
                import.meta.url,
            ).href,
            unicodeRange: LATIN_EXT_RANGE,
        },
    ],
    Roboto: [
        {
            url: new URL("../../../../assets/fonts/teddystudio/roboto-latin.woff2", import.meta.url)
                .href,
            unicodeRange: LATIN_RANGE,
        },
        {
            url: new URL(
                "../../../../assets/fonts/teddystudio/roboto-latin-ext.woff2",
                import.meta.url,
            ).href,
            unicodeRange: LATIN_EXT_RANGE,
        },
    ],
    "Open Sans": [
        {
            url: new URL(
                "../../../../assets/fonts/teddystudio/open-sans-latin.woff2",
                import.meta.url,
            ).href,
            unicodeRange: LATIN_RANGE,
        },
        {
            url: new URL(
                "../../../../assets/fonts/teddystudio/open-sans-latin-ext.woff2",
                import.meta.url,
            ).href,
            unicodeRange: LATIN_EXT_RANGE,
        },
    ],
    Merriweather: [
        {
            url: new URL(
                "../../../../assets/fonts/teddystudio/merriweather-latin.woff2",
                import.meta.url,
            ).href,
            unicodeRange: LATIN_RANGE,
        },
        {
            url: new URL(
                "../../../../assets/fonts/teddystudio/merriweather-latin-ext.woff2",
                import.meta.url,
            ).href,
            unicodeRange: LATIN_EXT_RANGE,
        },
    ],
};

const loadedBundledFonts = new Map<string, Promise<void>>();

const primaryFamilyName = (fontFamily: string): string => {
    const first = fontFamily.split(",", 1)[0]?.trim() || fontFamily.trim();
    return first.replace(/^['"]|['"]$/g, "");
};

const loadBundledFont = (family: string): Promise<void> => {
    const cached = loadedBundledFonts.get(family);
    if (cached) return cached;

    const sources = BUNDLED_FONTS[family];
    if (!sources || typeof FontFace === "undefined" || !document.fonts) {
        return Promise.resolve();
    }

    const promise = Promise.all(
        sources.map(async ({ url, unicodeRange }) => {
            const face = new FontFace(family, `url("${url}") format("woff2")`, {
                style: "normal",
                weight: "400",
                unicodeRange,
            });
            await face.load();
            const fontSet = document.fonts as MutableFontFaceSet;
            if (typeof fontSet.add === "function") {
                fontSet.add(face);
            }
        }),
    ).then(() => undefined);

    loadedBundledFonts.set(family, promise);
    return promise;
};

/**
 * Ensures that fonts used by the canvas renderer are available without relying on @font-face CSS.
 * System fonts still resolve through the browser/OS as usual.
 */
export const ensurePrintFonts = async (fontFamilies: Iterable<string>): Promise<void> => {
    const families = Array.from(new Set(fontFamilies)).filter(Boolean);

    await Promise.all(
        families.map(async (fontFamily) => {
            const primary = primaryFamilyName(fontFamily);
            await loadBundledFont(primary);
            if (document.fonts) {
                await document.fonts.load(`16px ${fontFamily}`);
            }
        }),
    );

    if (document.fonts) {
        await document.fonts.ready;
    }
};
