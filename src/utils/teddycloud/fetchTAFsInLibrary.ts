import { Record } from "../../types/fileBrowserTypes";

export type RecordWithPath = Record & {
    fullPath: string;
};

import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TonieCardProps } from "../../types/tonieTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

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
    s = s.replace(/\\/g, "/").replace(/\/+/g, "/").toLowerCase();
    return s;
}

export async function fetchAllTAFsInLibrary(args?: {
    path?: string;
    special?: string;
    overlay?: string;
}): Promise<RecordWithPath[]> {
    const path = args?.path ?? "";
    const special = args?.special ?? "library";
    const overlay = args?.overlay;

    const apiPathParam = encodeURIComponent(path);
    const url =
        `/api/fileIndexV2?path=${apiPathParam}&special=${special}` +
        (overlay ? `&overlay=${overlay}` : "");

    const res = await api.apiGetTeddyCloudApiRaw(url);
    if (!res.ok) return [];

    const data = await res.json();
    const files: Record[] = Array.isArray(data.files) ? data.files : [];

    const merged: RecordWithPath[] = files.map((f) => ({
        ...f,
        fullPath: path ? `${path}/${f.name}` : f.name,
    }));

    const subdirs = files.filter((f) => f.isDir && f.name !== "..");

    for (const dir of subdirs) {
        const subPath = path ? `${path}/${dir.name}` : dir.name;
        const subFiles = await fetchAllTAFsInLibrary({
            path: subPath,
            special,
            overlay,
        });
        merged.push(...subFiles);
    }

    return merged;
}

export async function fetchUnusedTAFsInLibrary(
    tonies: TonieCardProps[],
    args?: { path?: string; special?: string; overlay?: string },
): Promise<RecordWithPath[]> {
    const all = await fetchAllTAFsInLibrary(args);
    const usedPaths = new Set(
        (tonies ?? []).map((t) => normalizeLibPath(t?.source)).filter(Boolean),
    );
    const unused = all.filter(
        (r) =>
            !r.isDir &&
            r.name.toLowerCase().endsWith(".taf") &&
            !usedPaths.has(normalizeLibPath(r.fullPath)),
    );
    return unused;
}
