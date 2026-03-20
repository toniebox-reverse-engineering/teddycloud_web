/**
 * Pure utilities for the Custom Model Editor.
 */

import { IMAGE_EXTENSIONS } from "../../../../constants/fileTypes";
import type { AudioPair, CustomEntry, FormValues, SortColumnKey, FilterFieldKey, TrackRow } from "../types/customModelEditorTypes";
import { toModelKey } from "../../utils/modelKey";
import { toLanguageCode } from "../../../common/icons/LanguageFlagIcon";

export const cloneEntry = (entry: CustomEntry): CustomEntry => JSON.parse(JSON.stringify(entry));
export const normalizeText = (value?: string) => (value || "").trim();
export { toModelKey };

export const normalizeAudioPairs = (entry: CustomEntry): string[] => {
    const audioIds = entry.audio_id || [];
    const hashes = entry.hash || [];
    return audioIds.map((audioId, index) => `${normalizeText(audioId)}::${normalizeText(hashes[index]).toLowerCase()}`).filter((pair) => pair !== "::");
};

export const normalizeTracks = (entry: CustomEntry): string[] => (entry.tracks || []).map((track) => normalizeText(track)).filter(Boolean);
export const areStringArraysEqual = (left: string[], right: string[]): boolean => left.length === right.length && left.every((value, index) => value === right[index]);

/** At least one row; empty `audio_id`/`hash` arrays are truthy, so length must be used. */
const audioPairsForForm = (entry: CustomEntry): FormValues["audioPairs"] => {
    const ids = entry.audio_id ?? [];
    const hashes = entry.hash ?? [];
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
    tracks: entry.tracks && entry.tracks.length > 0 ? entry.tracks.map((track) => ({ track })) : [{ track: "" }],
});

const parseModelId = (model: string): number | null => {
    const match = /^custom-(\d+)$/i.exec(model.trim());
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

export const toEntry = (values: FormValues): CustomEntry => {
    const pairs = (values.audioPairs || []).filter((pair): pair is AudioPair => pair != null && typeof pair === "object").map((pair) => ({ audio_id: (pair.audio_id || "").trim(), hash: (pair.hash || "").trim() })).filter((pair) => pair.audio_id && pair.hash);
    const tracks = (values.tracks || []).filter((track): track is TrackRow => track != null && typeof track === "object").map((track) => (track.track || "").trim()).filter((track) => track.length > 0);
    const releaseRaw = values.release === undefined || values.release === null ? "" : String(values.release).trim();
    const releaseNormalized = releaseRaw.length > 0 ? releaseRaw : undefined;
    const languageRaw = String(values.language ?? "").trim();
    const languageNormalized = languageRaw.length > 0 ? toLanguageCode(languageRaw) || undefined : undefined;
    return {
        no: (values.no || "").trim() || undefined,
        model: (values.model || "").trim(),
        audio_id: pairs.length > 0 ? pairs.map((pair) => pair.audio_id) : undefined,
        hash: pairs.length > 0 ? pairs.map((pair) => pair.hash) : undefined,
        title: (values.title || "").trim() || undefined,
        series: (values.series || "").trim(),
        episodes: (values.episodes || "").trim() || undefined,
        tracks: tracks.length > 0 ? tracks : undefined,
        release: releaseNormalized,
        language: languageNormalized,
        category: (values.category || "").trim() || undefined,
        pic: (values.pic || "").trim() || undefined,
    };
};

export const isImageFile = (name: string): boolean => IMAGE_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext));
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
