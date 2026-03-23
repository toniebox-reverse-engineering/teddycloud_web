import { useEffect, useRef, useState } from "react";

import { TeddyCloudApi } from "../../../../../api";
import { defaultAPIConfig } from "../../../../../config/defaultApiConfig";
import { SELECT_IMAGE_JSON_PREFETCH_FALLBACK_MS } from "../../../../../constants/numbers";

const api = new TeddyCloudApi(defaultAPIConfig());

const normalizePreviewPath = (value?: string) => {
    const raw = (value || "").trim();
    if (!raw) return "";
    if (/^(https?:\/\/|data:|blob:)/i.test(raw)) return raw;
    if (raw.startsWith("/")) return raw;
    if (raw.startsWith("custom_img/")) return `/${raw}`;
    if (raw.startsWith("img/")) return `/${raw}`;
    return raw;
};

const hasStringArrayPayload = (value: unknown): value is string[] =>
    Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string");

interface UseOriginalImagesDataOptions {
    open: boolean;
    source: "custom" | "original";
    sessionKey: string;
}

interface UseOriginalImagesDataResult {
    originalImages: string[];
    originalImagesLoading: boolean;
}

export const useOriginalImagesData = ({
    open,
    source,
    sessionKey,
}: UseOriginalImagesDataOptions): UseOriginalImagesDataResult => {
    const [originalImages, setOriginalImages] = useState<string[]>([]);
    const [originalImagesLoading, setOriginalImagesLoading] = useState(false);

    const openRef = useRef(open);
    openRef.current = open;
    const sourceRef = useRef(source);
    sourceRef.current = source;
    const originalFetchOnceRef = useRef(false);
    const fetchOriginalPicsRef = useRef<() => Promise<void>>(async () => {});

    fetchOriginalPicsRef.current = async () => {
        if (originalFetchOnceRef.current) return;
        originalFetchOnceRef.current = true;

        let hadNonEmptyCache = false;
        try {
            const raw = sessionStorage.getItem(sessionKey);
            if (raw) {
                const parsed = JSON.parse(raw) as unknown;
                if (hasStringArrayPayload(parsed)) hadNonEmptyCache = true;
            }
        } catch {
            /* ignore */
        }

        const showBlockingSpinner = sourceRef.current === "original" && !hadNonEmptyCache;
        if (showBlockingSpinner) setOriginalImagesLoading(true);

        try {
            const response = await api.apiGetTeddyCloudApiRaw("/api/toniesJson");
            if (!openRef.current || !response.ok) return;
            const data = await response.json();
            const normalized = Array.isArray(data) ? data : [];
            const pics = normalized
                .flatMap((entry: any) => [
                    typeof entry?.pic === "string" ? entry.pic : "",
                    typeof entry?.cachePic === "string" ? entry.cachePic : "",
                    typeof entry?.tonieInfo?.picture === "string" ? entry.tonieInfo.picture : "",
                    typeof entry?.sourceInfo?.picture === "string" ? entry.sourceInfo.picture : "",
                ])
                .map((pic: string) => normalizePreviewPath(pic))
                .filter((pic: string) => pic.length > 0);
            const sorted = Array.from(new Set(pics)).sort((a, b) => a.localeCompare(b));
            if (!openRef.current) return;
            setOriginalImages(sorted);
            try {
                sessionStorage.setItem(sessionKey, JSON.stringify(sorted));
            } catch {
                /* quota */
            }
        } catch {
            if (openRef.current) setOriginalImages([]);
        } finally {
            if (openRef.current) setOriginalImagesLoading(false);
        }
    };

    useEffect(() => {
        if (!open) {
            originalFetchOnceRef.current = false;
            setOriginalImagesLoading(false);
            return;
        }

        try {
            const raw = sessionStorage.getItem(sessionKey);
            if (raw) {
                const parsed = JSON.parse(raw) as unknown;
                if (hasStringArrayPayload(parsed)) {
                    setOriginalImages(parsed);
                }
            }
        } catch {
            /* ignore */
        }

        let timeoutId: number | undefined;
        let idleId: number | undefined;

        if (sourceRef.current === "original") {
            void fetchOriginalPicsRef.current();
        } else if (typeof window.requestIdleCallback === "function") {
            idleId = window.requestIdleCallback(() => void fetchOriginalPicsRef.current(), { timeout: 2500 });
        } else {
            timeoutId = window.setTimeout(() => void fetchOriginalPicsRef.current(), SELECT_IMAGE_JSON_PREFETCH_FALLBACK_MS);
        }

        return () => {
            if (idleId != null && typeof window.cancelIdleCallback === "function") {
                window.cancelIdleCallback(idleId);
            }
            if (timeoutId != null) window.clearTimeout(timeoutId);
        };
    }, [open, sessionKey]);

    useEffect(() => {
        if (!open || source !== "original") return;
        void fetchOriginalPicsRef.current();
    }, [open, source]);

    return { originalImages, originalImagesLoading };
};

export default useOriginalImagesData;
