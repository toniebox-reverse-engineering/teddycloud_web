import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { fetchAllTAFsInLibrary } from "./fetchTAFsInLibrary";
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
    return String(value ?? "").trim().toLowerCase();
}

function normalizeLibPath(input?: string): string {
    if (!input) return "";
    let s = String(input).trim();
    if (s.startsWith("lib://")) s = s.slice("lib://".length);
    s = s.replace(/^\/+/, "");
    try {
        s = decodeURIComponent(s);
    } catch {
        // ignore
    }
    return s.replace(/\\/g, "/").replace(/\/+/g, "/").toLowerCase();
}

function isTafFile(record: { isDir: boolean; name: string }): boolean {
    return !record.isDir && record.name.toLowerCase().endsWith(".taf");
}

function getEntryFirstAudioHashPair(entry: ToniesJsonEntry): AudioHashPair | null {
    if (!entry?.audio_id?.length || !entry?.hash?.length) return null;
    const audioId = normalizeAudioId(entry.audio_id[0]);
    const hash = normalizeHash(entry.hash[0]);
    if (!audioId || !hash) return null;
    return { audioId, hash };
}

function tafMatchesAudioHash(
    record: { isDir: boolean; name: string; tafHeader?: { audioId?: unknown; sha1Hash?: unknown } },
    audioId: string,
    hash: string
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

/**
 * Resolves the model's expected audio (from tonies.json/tonies.custom.json) to a library path
 * if the file exists in the library. Returns null if the model has no audio or the file is not found.
 */
export async function resolveModelAudioToLibraryPath(
    model: string,
    overlay?: string
): Promise<string | null> {
    const result = await resolveModelAudioTarget(model, overlay);
    return result.path;
}

export async function resolveModelAudioTarget(
    model: string,
    overlay?: string
): Promise<{ hasMapping: boolean; path: string | null }> {
    const modelKey = normalizeModelKey(model);
    if (!modelKey) return { hasMapping: false, path: null };

    try {
        const allEntries = await fetchToniesEntries(overlay);
        const entry = allEntries.find((e) => normalizeModelKey(e.model) === modelKey);
        if (!entry) return { hasMapping: false, path: null };
        const firstPair = getEntryFirstAudioHashPair(entry);
        if (!firstPair) return { hasMapping: false, path: null };

        try {
            const allTAFs = await fetchAllTAFsInLibrary({ overlay });
            let match = allTAFs.find((r) =>
                tafMatchesAudioHash(r, firstPair.audioId, firstPair.hash)
            );

            if (!match) {
                const customMatch = /^custom[_-]?(\d+)$/i.exec(modelKey);
                if (customMatch) {
                    const num = customMatch[1].padStart(3, "0");
                    const pathMatch = allTAFs.find(
                        (r) =>
                            !r.isDir &&
                            r.name.toLowerCase() === `audio_${num}.taf`
                    );
                    if (pathMatch) return { hasMapping: true, path: `lib://${pathMatch.fullPath}` };
                }
            }

            if (!match) return { hasMapping: true, path: null };
            return { hasMapping: true, path: `lib://${match.fullPath}` };
        } catch {
            // Mapping is known, but library lookup failed or no data available.
            return { hasMapping: true, path: null };
        }
    } catch {
        return { hasMapping: false, path: null };
    }
}

/**
 * Resolves audio_id + hash to library path by scanning TAF files.
 * Used in Custom Model Editor to show the file path for a given audio pair.
 */
export async function resolveAudioIdHashToLibraryPath(
    audioId: string,
    hash: string,
    overlay?: string
): Promise<string | null> {
    const aid = normalizeAudioId(audioId);
    const h = normalizeHash(hash);
    if (!aid || !h) return null;
    try {
        const allTAFs = await fetchAllTAFsInLibrary({ overlay });
        const match = allTAFs.find((r) => tafMatchesAudioHash(r, aid, h));
        return match ? `lib://${match.fullPath}` : null;
    } catch {
        return null;
    }
}

/**
 * Resolves a library audio source path (lib://...) to the model key from
 * tonies.custom.json/tonies.json by matching TAF audio_id + hash.
 */
export async function resolveAudioSourceToModel(
    source: string,
    overlay?: string
): Promise<string | null> {
    const sourceKey = normalizeLibPath(source);
    if (!sourceKey) return null;

    try {
        const allTAFs = await fetchAllTAFsInLibrary({ overlay });
        const taf = allTAFs.find((r) => normalizeLibPath(r.fullPath) === sourceKey);
        if (!taf?.tafHeader) return null;

        const audioId = normalizeAudioId(taf.tafHeader.audioId);
        const hash = normalizeHash(taf.tafHeader.sha1Hash);
        if (!audioId || !hash) return null;

        const entries = await fetchToniesEntries(overlay);

        for (const entry of entries) {
            const model = String(entry?.model ?? "").trim();
            if (!model) continue;
            const audioIds = Array.isArray(entry?.audio_id) ? entry.audio_id : [];
            const hashes = Array.isArray(entry?.hash) ? entry.hash : [];
            const pairCount = Math.min(audioIds.length, hashes.length);
            for (let i = 0; i < pairCount; i++) {
                const aid = normalizeAudioId(audioIds[i]);
                const h = normalizeHash(hashes[i]);
                if (aid === audioId && h === hash) {
                    return model;
                }
            }
        }
        return null;
    } catch {
        return null;
    }
}
