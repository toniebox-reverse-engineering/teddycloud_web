import {
    TEDDYBOX_BOX_COLORS,
    TEDDYBOX_CIRCLE_MAX,
    TEDDYBOX_DEFAULT_OPTIONS,
    TEDDYBOX_FILE_VERSION,
    TEDDYBOX_MAX_SHELVES,
    TEDDYBOX_SHELF_COLORS,
    TEDDYBOX_SHELF_COLUMNS_DEFAULT,
    TEDDYBOX_SHELF_COLUMNS_MAX,
    TEDDYBOX_SHELF_COLUMNS_MIN,
    TEDDYBOX_SHELF_ROWS,
    TEDDYBOX_VOLUME_STEPS,
} from "../../constants/teddybox";
import {
    TEDDYBOX_BACKGROUNDS,
    TeddyBoxBackground,
    TeddyBoxScenery,
    TeddyBoxConfig,
    TeddyBoxFile,
    TeddyBoxDisplay,
    TeddyBoxOptions,
    TeddyBoxShelf,
    TeddyBoxSwitching,
} from "../../types/teddyboxTypes";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export const newId = (prefix: string): string =>
    `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback;

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, Math.round(n)));
};

const color = (value: unknown, fallback: string): string =>
    typeof value === "string" && HEX_COLOR.test(value) ? value : fallback;

export const createShelf = (index: number, name: string): TeddyBoxShelf => ({
    id: newId("shelf"),
    name,
    color: TEDDYBOX_SHELF_COLORS[index % TEDDYBOX_SHELF_COLORS.length],
    display: "shelf",
    columns: TEDDYBOX_SHELF_COLUMNS_DEFAULT,
    tonies: [],
});

/** Most tonies a collection can hold with the given display. */
export const shelfCapacity = (display: TeddyBoxDisplay, columns: number): number =>
    display === "circle" ? TEDDYBOX_CIRCLE_MAX : columns * TEDDYBOX_SHELF_ROWS;

export const createTeddyBox = (name: string, shelfName: string): TeddyBoxConfig => ({
    id: newId("tb"),
    name,
    color: TEDDYBOX_BOX_COLORS[0],
    background: "room",
    shelves: [createShelf(0, shelfName)],
    options: { ...TEDDYBOX_DEFAULT_OPTIONS },
});

/** Switching options; earlier versions had one choice: "off", "simple" (buttons) or "advanced". */
const switchingOf = (raw: any): TeddyBoxSwitching => {
    const value = raw?.switching;
    if (value && typeof value === "object") {
        return { buttons: !!value.buttons, swipe: !!value.swipe, overview: !!value.overview };
    }
    if (raw?.shelfSwitching === "simple") return { buttons: true, swipe: false, overview: false };
    if (raw?.shelfSwitching === "advanced") return { buttons: true, swipe: true, overview: true };
    return { ...TEDDYBOX_DEFAULT_OPTIONS.switching };
};

const normalizeOptions = (raw: any): TeddyBoxOptions => {
    const d = TEDDYBOX_DEFAULT_OPTIONS;
    const maxVolume = clampInt(raw?.maxVolume, 1, TEDDYBOX_VOLUME_STEPS, d.maxVolume);
    const pin =
        raw?.pin && typeof raw.pin.salt === "string" && typeof raw.pin.hash === "string"
            ? { salt: raw.pin.salt, hash: raw.pin.hash }
            : null;
    return {
        switching: switchingOf(raw),
        maxVolume,
        startVolume: clampInt(raw?.startVolume, 1, maxVolume, Math.min(d.startVolume, maxVolume)),
        allowTrackSkip:
            typeof raw?.allowTrackSkip === "boolean" ? raw.allowTrackSkip : d.allowTrackSkip,
        resume: typeof raw?.resume === "boolean" ? raw.resume : d.resume,
        showKnockHint:
            typeof raw?.showKnockHint === "boolean" ? raw.showKnockHint : d.showKnockHint,
        pin,
    };
};

/**
 * Display of a collection. Early drafts had one layout for the whole box: "circle"/"carousel"
 * meant the circle, "auto" the circle while the tonies fit in it.
 */
const displayOf = (raw: any, oldLayout: unknown, tonieCount: number): TeddyBoxDisplay => {
    if (raw?.display === "shelf" || raw?.display === "circle") return raw.display;
    if (oldLayout === "circle" || oldLayout === "carousel") return "circle";
    if (oldLayout === "auto" && tonieCount <= TEDDYBOX_CIRCLE_MAX) return "circle";
    return "shelf";
};

const backgroundOf = (
    raw: any,
): Pick<TeddyBoxShelf, "background" | "backgroundImage" | "backgroundColor"> => {
    if (raw?.background === "plain" && HEX_COLOR.test(raw.backgroundColor ?? "")) {
        return { background: "plain", backgroundColor: raw.backgroundColor };
    }
    if (
        raw?.background === "image" &&
        typeof raw.backgroundImage === "string" &&
        raw.backgroundImage
    ) {
        return { background: "image", backgroundImage: raw.backgroundImage };
    }
    if (TEDDYBOX_BACKGROUNDS.includes(raw?.background)) return { background: raw.background };
    return {};
};

const normalizeShelf = (raw: any, index: number, oldLayout?: unknown): TeddyBoxShelf | null => {
    if (!raw || typeof raw !== "object") return null;
    const tonies = Array.isArray(raw.tonies)
        ? raw.tonies.filter((ruid: unknown): ruid is string => typeof ruid === "string" && !!ruid)
        : [];
    return {
        id: typeof raw.id === "string" && raw.id ? raw.id : newId("shelf"),
        name: typeof raw.name === "string" ? raw.name : "",
        color: color(raw.color, TEDDYBOX_SHELF_COLORS[index % TEDDYBOX_SHELF_COLORS.length]),
        display: displayOf(raw, oldLayout, tonies.length),
        ...backgroundOf(raw),
        columns: clampInt(
            raw.columns,
            TEDDYBOX_SHELF_COLUMNS_MIN,
            TEDDYBOX_SHELF_COLUMNS_MAX,
            TEDDYBOX_SHELF_COLUMNS_DEFAULT,
        ),
        lead: typeof raw.lead === "string" && tonies.includes(raw.lead) ? raw.lead : undefined,
        tonies: Array.from(new Set<string>(tonies)),
    };
};

export const normalizeTeddyBox = (raw: any): TeddyBoxConfig | null => {
    if (!raw || typeof raw !== "object" || typeof raw.id !== "string" || !raw.id) return null;
    const shelves = (Array.isArray(raw.shelves) ? raw.shelves : [])
        .map((shelf: any, index: number) => normalizeShelf(shelf, index, raw.options?.layout))
        .filter((s: TeddyBoxShelf | null): s is TeddyBoxShelf => s !== null)
        .slice(0, TEDDYBOX_MAX_SHELVES);
    return {
        id: raw.id,
        name: typeof raw.name === "string" ? raw.name : "",
        color: color(raw.color, TEDDYBOX_BOX_COLORS[0]),
        background: pick<TeddyBoxBackground>(raw.background, TEDDYBOX_BACKGROUNDS, "room"),
        backgroundColor: HEX_COLOR.test(raw.backgroundColor ?? "")
            ? raw.backgroundColor
            : undefined,
        backgroundImage:
            typeof raw.backgroundImage === "string" && raw.backgroundImage
                ? raw.backgroundImage
                : undefined,
        shelves: shelves.length ? shelves : [createShelf(0, "")],
        options: normalizeOptions(raw.options),
    };
};

export const normalizeTeddyBoxFile = (raw: any): TeddyBoxFile => {
    const list = Array.isArray(raw?.teddyboxes) ? raw.teddyboxes : [];
    const seen = new Set<string>();
    const teddyboxes = list
        .map(normalizeTeddyBox)
        .filter((tb: TeddyBoxConfig | null): tb is TeddyBoxConfig => {
            if (!tb || seen.has(tb.id)) return false;
            seen.add(tb.id);
            return true;
        });
    return { version: TEDDYBOX_FILE_VERSION, teddyboxes };
};

/** Shelves the child can switch between with the current setting. */
export const visibleShelves = (box: TeddyBoxConfig, activeShelfId?: string): TeddyBoxShelf[] => {
    const { buttons, swipe, overview } = box.options.switching;
    if (!buttons && !swipe && !overview) {
        const active = box.shelves.find((s) => s.id === activeShelfId) ?? box.shelves[0];
        return active ? [active] : [];
    }
    return box.shelves;
};

/** The tonies of a collection that fit its display, in order. */
export const fittingTonies = (shelf: TeddyBoxShelf, ruids: string[] = shelf.tonies): string[] =>
    ruids.slice(0, shelfCapacity(shelf.display, shelf.columns));

export const leadOf = (shelf: TeddyBoxShelf): string | undefined => shelf.lead ?? shelf.tonies[0];

/** Background shown for a collection: its own one, otherwise the one of the box. */
export const sceneryOf = (box: TeddyBoxConfig, shelf?: TeddyBoxShelf): TeddyBoxScenery => {
    if (shelf?.background === "image" && shelf.backgroundImage) {
        return { background: box.background, image: shelf.backgroundImage };
    }
    if (shelf?.background === "plain") return { background: "plain", color: shelf.backgroundColor };
    if (shelf?.background && shelf.background !== "image") return { background: shelf.background };
    if (box.backgroundImage) return { background: box.background, image: box.backgroundImage };
    return box.background === "plain"
        ? { background: "plain", color: box.backgroundColor }
        : { background: box.background };
};
