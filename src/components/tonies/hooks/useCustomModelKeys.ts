import { useEffect, useState } from "react";
import { TeddyCloudApi } from "../../../api";
import { defaultAPIConfig } from "../../../config/defaultApiConfig";
import { toModelKey } from "../utils/modelKey";

const api = new TeddyCloudApi(defaultAPIConfig());

export { toModelKey };

export function useCustomModelKeys(enabled: boolean): Set<string> {
    const [keys, setKeys] = useState<Set<string>>(new Set());

    useEffect(() => {
        // Only load when the related UI is active (edit modal open), to avoid extra requests.
        if (!enabled) return;
        let cancelled = false;
        api.apiGetTeddyCloudApiRaw("/api/toniesCustomJson")
            .then((r) => r.json())
            .then((data: unknown) => {
                if (cancelled) return;
                const arr = Array.isArray(data) ? data : [];
                const set = new Set(
                    arr
                        .map((e: { model?: string }) => toModelKey(e?.model))
                        .filter((k): k is string => k.length > 0)
                );
                // Set enables fast O(1) membership checks in TonieCard (custom vs original model).
                setKeys(set);
            })
            .catch(() => {
                if (!cancelled) setKeys(new Set());
            });
        return () => {
            cancelled = true;
        };
    }, [enabled]);

    return keys;
}

export function useToniesJsonModelKeys(enabled: boolean): Set<string> {
    const [keys, setKeys] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        api.apiGetTeddyCloudApiRaw("/api/toniesJson")
            .then((r) => r.json())
            .then((data: unknown) => {
                if (cancelled) return;
                const arr = Array.isArray(data) ? data : [];
                const set = new Set(
                    arr
                        .map((e: { model?: string }) => toModelKey(e?.model))
                        .filter((k): k is string => k.length > 0)
                );
                setKeys(set);
            })
            .catch(() => {
                if (!cancelled) setKeys(new Set());
            });
        return () => {
            cancelled = true;
        };
    }, [enabled]);

    return keys;
}
