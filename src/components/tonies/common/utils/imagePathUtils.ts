/**
 * Shared utilities for image path handling in tonies components.
 * Works with all tonie_json settings: cache_images, cache_preload.
 * - cache_images OFF: pic = original URL (external CDN or /custom_img/, /img/)
 * - cache_images ON: pic = /cache/[hash].[ext] (local cached)
 */

export const normalizeDirPath = (value: string) => value.replace(/^\/+/, "").replace(/\/+$/, "");

/**
 * Returns an img src URL that works in all environments (dev proxy, production).
 * Use for picture/pic from API - handles /cache/, /custom_img/, /img/, external URLs.
 */
export const toImageSrc = (url?: string): string => {
    const raw = (url || "").trim();
    if (!raw) return "";
    if (/^(https?:\/\/|data:|blob:)/i.test(raw)) return raw;
    const base =
        (typeof import.meta !== "undefined" &&
            (import.meta as any).env?.VITE_APP_TEDDYCLOUD_API_URL) ||
        "";
    return raw.startsWith("/") ? `${base.replace(/\/$/, "")}${raw}` : raw;
};

export const toCustomImgWebPath = (path: string, fileName: string): string => {
    const normalizedPath = normalizeDirPath(path);
    return normalizedPath ? `/custom_img/${normalizedPath}/${fileName}` : `/custom_img/${fileName}`;
};

/**
 * Converts a path (custom_img, URL, data:, blob:) to a previewable URL.
 */
export const toPreviewableImageUrl = (value?: string): string => {
    const raw = (value || "").trim();
    if (!raw) return "";
    if (/^(https?:\/\/|data:|blob:)/i.test(raw)) return raw;
    if (raw.startsWith("/")) return raw;
    if (raw.startsWith("custom_img/")) return `/${raw}`;
    const normalized = normalizeDirPath(raw);
    if (!normalized) return "";
    const encoded = normalized
        .split("/")
        .filter(Boolean)
        .map((segment) => encodeURIComponent(segment))
        .join("/");
    return `/custom_img/${encoded}`;
};
