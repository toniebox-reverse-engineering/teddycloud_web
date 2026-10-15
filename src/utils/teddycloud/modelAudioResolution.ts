import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { findFirstInLibrary } from "./fetchTAFsInLibrary";
import { toModelKey } from "../../components/tonies/utils/modelKey";

const api = new TeddyCloudApi(defaultAPIConfig());

type ToniesJsonEntry = {
    model?: string;
    audio_id?: string[];
    hash?: string[];
};

type AudioHashPair = {
    audioId: string;
    hash: string;
};

function normalizeModelKey(model?: string): string {
    return toModelKey(model);
}

function normalizeAudioId(value: unknown): string {
    return String(value ?? "").trim();
}

function normalizeHash(value: unknown): string {
    return String(value ?? "")
        .trim()
        .toLowerCase();
}

function isTafFile(record: { isDir: boolean; name: string }): boolean {
    return !record.isDir && record.name.toLowerCase().endsWith(".taf");
}

function tafMatchesAudioHash(
    record: { isDir: boolean; name: string; tafHeader?: { audioId?: unknown; sha1Hash?: unknown } },
    audioId: string,
    hash: string,
): boolean {
    if (!isTafFile(record)) return false;
    const header = record.tafHeader;
    const recordAudioId = normalizeAudioId(header?.audioId);
    const recordHash = normalizeHash(header?.sha1Hash);
    return recordAudioId === audioId && recordHash === hash;
}

async function fetchToniesEntries(overlay?: string): Promise<ToniesJsonEntry[]> {
    const [customRes, baseRes] = await Promise.all([
        api.apiGetTeddyCloudApiRaw("/api/toniesCustomJson", overlay),
        api.apiGetTeddyCloudApiRaw("/api/toniesJson", overlay),
    ]);
    const [customData, baseData] = await Promise.all([customRes.json(), baseRes.json()]);
    return [
        ...(Array.isArray(customData) ? customData : []),
        ...(Array.isArray(baseData) ? baseData : []),
    ];
}

function getEntryAudioHashPairs(entry: ToniesJsonEntry): AudioHashPair[] {
    const audioIds = Array.isArray(entry?.audio_id) ? entry.audio_id : [];
    const hashes = Array.isArray(entry?.hash) ? entry.hash : [];
    const pairs: AudioHashPair[] = [];
    for (let i = 0; i < Math.min(audioIds.length, hashes.length); i++) {
        const audioId = normalizeAudioId(audioIds[i]);
        const hash = normalizeHash(hashes[i]);
        if (audioId && hash) pairs.push({ audioId, hash });
    }
    return pairs;
}

/**
 * Searches the library for a TAF matching the model's audio (from tonies.json/tonies.custom.json).
 * Traverses the library and stops at the first match, so only call it on explicit user action.
 * hasMapping is false if the model has no audio_id/hash entry.
 */
export async function locateModelAudioInLibrary(
    model: string,
    overlay?: string,
): Promise<{ hasMapping: boolean; path: string | null }> {
    const modelKey = normalizeModelKey(model);
    if (!modelKey) return { hasMapping: false, path: null };

    try {
        const allEntries = await fetchToniesEntries(overlay);
        const entry = allEntries.find((e) => normalizeModelKey(e.model) === modelKey);
        const pairs = entry ? getEntryAudioHashPairs(entry) : [];
        if (pairs.length === 0) return { hasMapping: false, path: null };

        // Fallback for custom models without a matching header: custom_NNN -> audio_NNN.taf
        const customMatch = /^custom[_-]?(\d+)$/i.exec(modelKey);
        const fallbackName = customMatch ? `audio_${customMatch[1].padStart(3, "0")}.taf` : null;
        let fallbackPath: string | null = null;

        try {
            const match = await findFirstInLibrary(
                (r) => {
                    if (fallbackName && !fallbackPath && r.name.toLowerCase() === fallbackName) {
                        fallbackPath = r.fullPath;
                    }
                    return pairs.some((p) => tafMatchesAudioHash(r, p.audioId, p.hash));
                },
                { overlay },
            );
            const path = match?.fullPath ?? fallbackPath;
            return { hasMapping: true, path: path ? `lib://${path}` : null };
        } catch {
            // Mapping is known, but library lookup failed.
            return { hasMapping: true, path: null };
        }
    } catch {
        return { hasMapping: false, path: null };
    }
}

/**
 * Resolves audio_id + hash to library path by searching TAF files (stops at the first match).
 * Used in Custom Model Editor on explicit user action to show the file path for a given audio pair.
 */
export async function resolveAudioIdHashToLibraryPath(
    audioId: string,
    hash: string,
    overlay?: string,
): Promise<string | null> {
    const aid = normalizeAudioId(audioId);
    const h = normalizeHash(hash);
    if (!aid || !h) return null;
    try {
        const match = await findFirstInLibrary((r) => tafMatchesAudioHash(r, aid, h), { overlay });
        return match ? `lib://${match.fullPath}` : null;
    } catch {
        return null;
    }
}
