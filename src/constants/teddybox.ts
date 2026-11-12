import { TeddyBoxOptions } from "../types/teddyboxTypes";

/** TeddyBoxes are stored as one JSON file in the library, so every device sees the same boxes. */
export const TEDDYBOX_LIBRARY_DIR = "TeddyBox";
export const TEDDYBOX_FILE_NAME = "teddyboxes.json";
export const TEDDYBOX_FILE_VERSION = 1;

/** The kids view (also the scope of the installable app). */
export const TEDDYBOX_ROUTE = "/teddybox";
/** Parent pages to manage the TeddyBoxes. */
export const TEDDYBOXES_ROUTE = "/teddyboxes";
export const TEDDYBOXES_GUIDE_ROUTE = "/teddyboxes/guide";

export const TEDDYBOX_VOLUME_STEPS = 8;
export const TEDDYBOX_MAX_SHELVES = 8;
/** A shelf has three boards; the tonies per board are set per shelf. */
export const TEDDYBOX_SHELF_ROWS = 3;
export const TEDDYBOX_SHELF_COLUMNS_MIN = 2;
export const TEDDYBOX_SHELF_COLUMNS_MAX = 4;
export const TEDDYBOX_SHELF_COLUMNS_DEFAULT = 3;
/** Most tonies that fit in a circle around the TeddyBox. */
export const TEDDYBOX_CIRCLE_MAX = 8;

/** Timings in milliseconds. */
export const TEDDYBOX_UNLOCK_HOLD_MS = 1500;
export const TEDDYBOX_UNLOCK_SLIDE_MS = 5000;
export const TEDDYBOX_PIN_IDLE_MS = 10000;
export const TEDDYBOX_PIN_MAX_TRIES = 3;
export const TEDDYBOX_PIN_LOCK_MS = 30000;
export const TEDDYBOX_KNOCK_COOLDOWN_MS = 1500;
export const TEDDYBOX_SAVE_POSITION_MS = 5000;
export const TEDDYBOX_SESSION_REFRESH_MS = 6 * 60 * 60 * 1000;

export const TEDDYBOX_PIN_LENGTH = 4;

/** Size of the settings drawer inside the TeddyBox (right in landscape, bottom in portrait). */
export const TEDDYBOX_SETUP_DRAWER_WIDTH = 440;
export const TEDDYBOX_SETUP_DRAWER_HEIGHT = "55%";

/** Colors of the kids UI; it deliberately has its own look and does not use the antd theme. */
export const TEDDYBOX_BOX_COLORS = [
    "#e0573f",
    "#3b8fd9",
    "#2fa37a",
    "#8e5bd6",
    "#e8a33d",
    "#d94f8f",
    "#4a5568",
];
/** Plain background of the kids view: calm, light colors that keep the tonies easy to see. */
export const TEDDYBOX_PLAIN_DEFAULT_COLOR = "#dde9ed";
export const TEDDYBOX_PLAIN_COLORS = [
    TEDDYBOX_PLAIN_DEFAULT_COLOR,
    "#fbe3c8",
    "#fde2e4",
    "#e2f0cb",
    "#cde7f0",
    "#e4dcf5",
    "#fff3b0",
    "#3a4a6b",
];
export const TEDDYBOX_SHELF_COLORS = [
    "#7fb77e",
    "#5b7bd5",
    "#e8a33d",
    "#d94f8f",
    "#2a9fbf",
    "#8e5bd6",
    "#c27a2c",
    "#5f6b7a",
];
export const TEDDYBOX_FIGURE_COLORS = [
    "#3b8fd9",
    "#e8a33d",
    "#8e5bd6",
    "#2fa37a",
    "#e0573f",
    "#d94f8f",
    "#4b5bd9",
    "#7a9a2f",
];

export const TEDDYBOX_DEFAULT_OPTIONS: TeddyBoxOptions = {
    switching: { buttons: false, swipe: false, overview: false },
    maxVolume: 6,
    startVolume: 4,
    allowTrackSkip: true,
    resume: true,
    showKnockHint: true,
    pin: null,
};

/** Per-device keys in userStorage. */
export const TEDDYBOX_STORAGE = {
    active: "teddybox.active",
    device: "teddybox.device",
    position: "teddybox.position.",
    hintSeen: "teddybox.hintSeen",
};
