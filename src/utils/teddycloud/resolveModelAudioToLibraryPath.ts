import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { fetchAllTAFsInLibrary } from "./fetchTAFsInLibrary";

const api = new TeddyCloudApi(defaultAPIConfig());

type ToniesJsonEntry = {
    model?: string;
    audio_id?: string[];
    hash?: string[];
};

function normalizeModelKey(model?: string): string {
    return (model || "").trim().toLowerCase();
}

/**
 * Resolves the model's expected audio (from tonies.json/tonies.custom.json) to a library path
 * if the file exists in the library. Returns null if the model has no audio or the file is not found.
 */
export async function resolveModelAudioToLibraryPath(
    model: string,
    overlay?: string
): Promise<string | null> {
    const modelKey = normalizeModelKey(model);
    if (!modelKey) return null;

    try {
        const [customRes, baseRes] = await Promise.all([
            api.apiGetTeddyCloudApiRaw("/api/toniesCustomJson", overlay),
            api.apiGetTeddyCloudApiRaw("/api/toniesJson", overlay),
        ]);

        const [customData, baseData] = await Promise.all([customRes.json(), baseRes.json()]);
        const customEntries: ToniesJsonEntry[] = Array.isArray(customData) ? customData : [];
        const baseEntries: ToniesJsonEntry[] = Array.isArray(baseData) ? baseData : [];

        const allEntries = [...customEntries, ...baseEntries];
        const entry = allEntries.find((e) => normalizeModelKey(e.model) === modelKey);
        if (!entry?.audio_id?.length || !entry?.hash?.length) return null;

        const audioId = String(entry.audio_id[0] ?? "").trim();
        const hash = String(entry.hash[0] ?? "").trim().toLowerCase();
        if (!audioId || !hash) return null;

        const allTAFs = await fetchAllTAFsInLibrary({ overlay });
        let match = allTAFs.find((r) => {
            if (r.isDir || !r.name.toLowerCase().endsWith(".taf")) return false;
            const h = r.tafHeader;
            const rAudioId = h?.audioId != null ? String(h.audioId).trim() : "";
            const rHash = h?.sha1Hash != null ? String(h.sha1Hash).trim().toLowerCase() : "";
            return rAudioId === audioId && rHash === hash;
        });

        if (!match) {
            const customMatch = /^custom[_-]?(\d+)$/i.exec(modelKey);
            if (customMatch) {
                const num = customMatch[1].padStart(3, "0");
                const pathMatch = allTAFs.find(
                    (r) =>
                        !r.isDir &&
                        r.name.toLowerCase() === `audio_${num}.taf`
                );
                if (pathMatch) return `lib://${pathMatch.fullPath}`;
            }
        }

        if (!match) return null;
        return `lib://${match.fullPath}`;
    } catch {
        return null;
    }
}
