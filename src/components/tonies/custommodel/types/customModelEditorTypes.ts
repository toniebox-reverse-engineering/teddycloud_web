/**
 * Types for the Custom Model Editor (tonies.custom.json).
 */

export type AudioPair = { audio_id: string; hash: string; path?: string };
export type TrackRow = { track: string };

export type CustomEntry = {
    no?: string;
    model: string;
    audio_id?: string[];
    hash?: string[];
    title?: string;
    series: string;
    episodes?: string;
    tracks?: string[];
    release?: string;
    language?: string;
    category?: string;
    pic?: string;
};

export type FormValues = {
    no?: string;
    model: string;
    title?: string;
    series: string;
    episodes?: string;
    release?: string | number;
    language?: string;
    category?: string;
    pic?: string;
    audioPairs: AudioPair[];
    tracks: TrackRow[];
};

export type SortColumnKey =
    "series" | "model" | "title" | "episodes" | "release" | "language" | "category" | "no";
export type SortOrder = "ascend" | "descend" | null;
export type FilterFieldKey =
    "series" | "model" | "title" | "episodes" | "release" | "language" | "category" | "no";
export type DraftStatus = "clean" | "changed" | "new" | "deleted";

export type TableRow = {
    idx: number;
    entry: CustomEntry;
    status: DraftStatus;
};

export type PendingRenameSave = {
    fromModel: string;
    toModel: string;
    draft: CustomEntry;
    silent: boolean;
};

export const TABLE_SETTINGS_STORAGE_KEY = "tonies.customEditor.tableSettings.v1";
export const CUSTOM_EDITOR_PAGE_SIZE_KEY = "tonies.customEditor.pageSize.v1";

export const ALLOWED_SORT_COLUMNS: SortColumnKey[] = [
    "series",
    "model",
    "title",
    "episodes",
    "release",
    "language",
    "category",
    "no",
];
export const ALLOWED_FILTER_FIELDS: FilterFieldKey[] = [
    "series",
    "model",
    "title",
    "episodes",
    "release",
    "language",
    "category",
    "no",
];
