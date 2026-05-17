/**
 * Pure utilities for the Custom Model Editor.
 */

import { IMAGE_EXTENSIONS } from "../../../../constants/fileTypes";
import type {
    AudioPair,
    CustomEntry,
    FormValues,
    SortColumnKey,
    FilterFieldKey,
    TrackRow,
} from "../types/customModelEditorTypes";
import { toModelKey } from "../../utils/modelKey";
import { toLanguageCode } from "../../../common/icons/LanguageFlagIcon";

export const cloneEntry = (entry: CustomEntry): CustomEntry => JSON.parse(JSON.stringify(entry));
export const normalizeText = (value?: unknown) =>
    (value === null || value === undefined ? "" : String(value)).trim();
export { toModelKey };

const toOptionalText = (value: unknown): string | undefined => {
    const normalized = normalizeText(value);
    return normalized.length > 0 ? normalized : undefined;
};

const toStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map((item) => normalizeText(item)).filter((item) => item.length > 0);
    }
    const normalized = normalizeText(value);
    return normalized.length > 0 ? [normalized] : [];
};

export const normalizeAudioPairs = (entry: CustomEntry): string[] => {
    const audioIds = toStringArray(entry.audio_id);
    const hashes = toStringArray(entry.hash);
    return audioIds
        .map(
            (audioId, index) =>
                `${normalizeText(audioId)}::${normalizeText(hashes[index]).toLowerCase()}`,
        )
        .filter((pair) => pair !== "::");
};

export const normalizeTracks = (entry: CustomEntry): string[] => toStringArray(entry.tracks);
export const areStringArraysEqual = (left: string[], right: string[]): boolean =>
    left.length === right.length && left.every((value, index) => value === right[index]);

/** At least one row; empty `audio_id`/`hash` arrays are truthy, so length must be used. */
const audioPairsForForm = (entry: CustomEntry): FormValues["audioPairs"] => {
    const ids = toStringArray(entry.audio_id);
    const hashes = toStringArray(entry.hash);
    const n = Math.max(ids.length, hashes.length);
    if (n === 0) {
        return [{ audio_id: "", hash: "", path: "" }];
    }
    return Array.from({ length: n }, (_, idx) => ({
        audio_id: ids[idx] ?? "",
        hash: hashes[idx] ?? "",
        path: "",
    }));
};

export const toFormValues = (entry: CustomEntry): FormValues => ({
    no: entry.no ?? "",
    model: entry.model ?? "",
    title: entry.title ?? "",
    series: entry.series ?? "",
    episodes: entry.episodes ?? "",
    release: entry.release ?? "",
    language: entry.language ?? "",
    category: entry.category ?? "",
    pic: entry.pic ?? "",
    audioPairs: audioPairsForForm(entry),
    tracks:
        entry.tracks && entry.tracks.length > 0
            ? entry.tracks.map((track) => ({ track }))
            : [{ track: "" }],
});

const parseModelId = (model: unknown): number | null => {
    const match = /^custom-(\d+)$/i.exec(normalizeText(model));
    return match ? Number(match[1]) : null;
};

export const buildSuggestedModel = (entries: CustomEntry[]): string => {
    let maxId = 0;
    entries.forEach((entry) => {
        const parsed = parseModelId(entry.model || "");
        if (parsed !== null && parsed > maxId) maxId = parsed;
    });
    return `custom-${maxId + 1}`;
};

export const normalizeEntryFromApi = (entry: unknown): CustomEntry => {
    const source = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
    const audioIds = toStringArray(source.audio_id);
    const hashes = toStringArray(source.hash);
    const tracks = toStringArray(source.tracks);

    return {
        no: toOptionalText(source.no),
        model: normalizeText(source.model),
        audio_id: audioIds.length > 0 ? audioIds : undefined,
        hash: hashes.length > 0 ? hashes : undefined,
        title: toOptionalText(source.title),
        series: normalizeText(source.series),
        episodes: toOptionalText(source.episodes),
        tracks: tracks.length > 0 ? tracks : undefined,
        release: toOptionalText(source.release),
        language: toOptionalText(source.language),
        category: toOptionalText(source.category),
        pic: toOptionalText(source.pic),
    };
};

export const toEntry = (values: FormValues): CustomEntry => {
    const pairs = (values.audioPairs || [])
        .filter((pair): pair is AudioPair => pair != null && typeof pair === "object")
        .map((pair) => ({ audio_id: normalizeText(pair.audio_id), hash: normalizeText(pair.hash) }))
        .filter((pair) => pair.audio_id.length > 0 && pair.hash.length > 0);
    const tracks = (values.tracks || [])
        .filter((track): track is TrackRow => track != null && typeof track === "object")
        .map((track) => normalizeText(track.track))
        .filter((track) => track.length > 0);
    const releaseRaw =
        values.release === undefined || values.release === null
            ? ""
            : String(values.release).trim();
    const releaseNormalized = releaseRaw.length > 0 ? releaseRaw : undefined;
    const languageRaw = String(values.language ?? "").trim();
    const languageNormalized =
        languageRaw.length > 0 ? toLanguageCode(languageRaw) || undefined : undefined;
    return {
        no: toOptionalText(values.no),
        model: normalizeText(values.model),
        audio_id: pairs.length > 0 ? pairs.map((pair) => pair.audio_id) : undefined,
        hash: pairs.length > 0 ? pairs.map((pair) => pair.hash) : undefined,
        title: toOptionalText(values.title),
        series: normalizeText(values.series),
        episodes: toOptionalText(values.episodes),
        tracks: tracks.length > 0 ? tracks : undefined,
        release: releaseNormalized,
        language: languageNormalized,
        category: toOptionalText(values.category),
        pic: toOptionalText(values.pic),
    };
};

export const isImageFile = (name: string): boolean =>
    IMAGE_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext));
export const sortValueForEntry = (entry: CustomEntry, column: SortColumnKey): string => {
    if (column === "title") return normalizeText(entry.title).toLowerCase();
    if (column === "episodes") return normalizeText(entry.episodes).toLowerCase();
    if (column === "release") return normalizeText(entry.release).toLowerCase();
    if (column === "language") return normalizeText(entry.language).toLowerCase();
    if (column === "category") return normalizeText(entry.category).toLowerCase();
    if (column === "no") return normalizeText(entry.no).toLowerCase();
    if (column === "series") return normalizeText(entry.series).toLowerCase();
    return toModelKey(entry.model);
};
export const filterValueForEntry = (entry: CustomEntry, field: FilterFieldKey): string => {
    if (field === "title") return normalizeText(entry.title);
    if (field === "episodes") return normalizeText(entry.episodes);
    if (field === "release") return normalizeText(entry.release);
    if (field === "language") return normalizeText(entry.language);
    if (field === "category") return normalizeText(entry.category);
    if (field === "no") return normalizeText(entry.no);
    if (field === "series") return normalizeText(entry.series);
    return normalizeText(entry.model);
};
