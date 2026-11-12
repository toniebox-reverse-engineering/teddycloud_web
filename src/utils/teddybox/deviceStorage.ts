import { TEDDYBOX_STORAGE } from "../../constants/teddybox";
import { normalizeSchedule, TeddyBoxScheduleEntry } from "./schedule";

/*
 * TeddyBox state that belongs to the device (the child's phone or tablet), independent of the
 * web user: an expired login must not end the kids mode. Plain localStorage on purpose.
 */

export type TeddyBoxDeviceSettings = {
    /** Shelf the TeddyBox starts with (the only one when switching is off), set in the settings. */
    activeShelf?: string;
    volume?: number;
    /** Times of day at which the TeddyBox switches to a collection by itself. */
    schedule?: TeddyBoxScheduleEntry[];
};

const read = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

const write = (key: string, value: string | null) => {
    try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
    } catch {
        /* storage unavailable, e.g. private mode */
    }
};

export const getActiveTeddyBox = (): string | null => read(TEDDYBOX_STORAGE.active);
export const setActiveTeddyBox = (id: string | null) => write(TEDDYBOX_STORAGE.active, id);

export const getDeviceSettings = (): TeddyBoxDeviceSettings => {
    try {
        const parsed = JSON.parse(read(TEDDYBOX_STORAGE.device) || "{}");
        return {
            activeShelf: typeof parsed.activeShelf === "string" ? parsed.activeShelf : undefined,
            volume: Number.isFinite(parsed.volume) ? parsed.volume : undefined,
            schedule: normalizeSchedule(parsed.schedule),
        };
    } catch {
        return {};
    }
};

export const updateDeviceSettings = (patch: Partial<TeddyBoxDeviceSettings>) =>
    write(TEDDYBOX_STORAGE.device, JSON.stringify({ ...getDeviceSettings(), ...patch }));

export const getPosition = (ruid: string): number => {
    const value = Number(read(TEDDYBOX_STORAGE.position + ruid));
    return Number.isFinite(value) && value > 0 ? value : 0;
};

export const setPosition = (ruid: string, seconds: number) =>
    write(TEDDYBOX_STORAGE.position + ruid, seconds > 1 ? String(Math.floor(seconds)) : null);

export const wasHintSeen = (): boolean => {
    try {
        return sessionStorage.getItem(TEDDYBOX_STORAGE.hintSeen) === "1";
    } catch {
        return false;
    }
};

export const markHintSeen = () => {
    try {
        sessionStorage.setItem(TEDDYBOX_STORAGE.hintSeen, "1");
    } catch {
        /* ignore */
    }
};
