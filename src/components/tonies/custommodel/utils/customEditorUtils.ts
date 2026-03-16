/**
 * Pure utilities for the Custom Model Editor.
 */

import { IMAGE_EXTENSIONS } from "../../../../constants/fileTypes";
import type { AudioPair, CustomEntry, FormValues, SortColumnKey, FilterFieldKey, TrackRow } from "../types/customEditorTypes";

export const cloneEntry = (entry: CustomEntry): CustomEntry => JSON.parse(JSON.stringify(entry));

export const normalizeText = (value?: string) => (value || "").trim();

export const toModelKey = (model?: string) => normalizeText(model).toLowerCase();

export const normalizeAudioPairs = (entry: CustomEntry): string[] => {
    const audioIds = entry.audio_id || [];
    const hashes = entry.hash || [];
    return audioIds
        .map((audioId, index) => `${normalizeText(audioId)}::${normalizeText(hashes[index]).toLowerCase()}`)
        .filter((pair) => pair !== "::");
};

export const normalizeTracks = (entry: CustomEntry): string[] =>
    (entry.tracks || []).map((track) => normalizeText(track)).filter(Boolean);

export const areStringArraysEqual = (left: string[], right: string[]): boolean =>
    left.length === right.length && left.every((value, index) => value === right[index]);

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
    audioPairs:
        entry.audio_id && entry.hash
            ? entry.audio_id.map((audio_id, idx) => ({
                  audio_id: audio_id ?? "",
                  hash: entry.hash?.[idx] ?? "",
                  path: "",
              }))
            : [{ audio_id: "", hash: "", path: "" }],
    tracks:
        entry.tracks && entry.tracks.length > 0
            ? entry.tracks.map((track) => ({ track }))
            : [{ track: "" }],
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
    const pairs = (values.audioPairs || [])
        .filter((pair): pair is AudioPair => pair != null && typeof pair === "object")
        .map((pair) => ({
            audio_id: (pair.audio_id || "").trim(),
            hash: (pair.hash || "").trim(),
        }))
        .filter((pair) => pair.audio_id && pair.hash);

    const tracks = (values.tracks || [])
        .filter((track): track is TrackRow => track != null && typeof track === "object")
        .map((track) => (track.track || "").trim())
        .filter((track) => track.length > 0);

    const releaseRaw =
        values.release === undefined || values.release === null ? "" : String(values.release).trim();
    const releaseNormalized = releaseRaw.length > 0 ? releaseRaw : undefined;

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
        language: (values.language || "").trim() || undefined,
        category: (values.category || "").trim() || undefined,
        pic: (values.pic || "").trim() || undefined,
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
    return normalizeText(entry.model).toLowerCase();
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
