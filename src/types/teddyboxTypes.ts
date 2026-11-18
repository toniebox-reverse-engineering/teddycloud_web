/** Ways the child can change the collection; none: only the start collection of the device. */
export type TeddyBoxSwitching = {
    /** Round buttons with a figure below the shelf; dots when they do not fit in one row. */
    buttons: boolean;
    swipe: boolean;
    /** Button that shows all collections at once. */
    overview: boolean;
};
/** How a collection is shown to the child. */
export type TeddyBoxDisplay = "shelf" | "circle";
export const TEDDYBOX_BACKGROUNDS = [
    "room",
    "meadow",
    "ocean",
    "space",
    "beach",
    "night",
    "spring",
    "summer",
    "autumn",
    "winter",
    "christmas",
    "easter",
    "plain",
] as const;
export type TeddyBoxBackground = (typeof TEDDYBOX_BACKGROUNDS)[number];

/** What is drawn behind the kids view: a built-in scene, a picture or a plain color. */
export type TeddyBoxScenery = {
    background: TeddyBoxBackground;
    /** Picture instead of the scene. */
    image?: string;
    /** Color of the "plain" background. */
    color?: string;
};

export type TeddyBoxPin = {
    salt: string;
    hash: string;
};

/** A collection of tonies the child chooses from ("shelf" in code, "collection" in the UI). */
export type TeddyBoxShelf = {
    id: string;
    /** Only shown to parents. */
    name: string;
    color: string;
    /** On a wooden shelf or in a circle around the box; limits the number of tonies. */
    display: TeddyBoxDisplay;
    /** Own background instead of the one of the box; "image" uses backgroundImage. */
    background?: TeddyBoxBackground | "image";
    /** Picture for the "image" background, usually a /custom_img/ path. */
    backgroundImage?: string;
    /** Color of the "plain" background. */
    backgroundColor?: string;
    /** Tonies per shelf row (TEDDYBOX_SHELF_COLUMNS_MIN..MAX), only for the shelf display. */
    columns: number;
    /** ruid of the figure shown on the shelf button; the first tonie when empty. */
    lead?: string;
    /** ruids in shelf order. */
    tonies: string[];
};

export type TeddyBoxOptions = {
    switching: TeddyBoxSwitching;
    /** 1..TEDDYBOX_VOLUME_STEPS */
    maxVolume: number;
    startVolume: number;
    allowTrackSkip: boolean;
    resume: boolean;
    showKnockHint: boolean;
    pin: TeddyBoxPin | null;
};

export type TeddyBoxConfig = {
    id: string;
    name: string;
    color: string;
    background: TeddyBoxBackground;
    /** Color of the "plain" background. */
    backgroundColor?: string;
    /** Own picture instead of the built-in background, usually a /custom_img/ path. */
    backgroundImage?: string;
    shelves: TeddyBoxShelf[];
    options: TeddyBoxOptions;
};

export type TeddyBoxFile = {
    version: number;
    teddyboxes: TeddyBoxConfig[];
};
