import { useEffect, useState } from "react";

export type UrlToTest = {
    id: string;
    url: string;
    title?: string;
};

const withTimeout = (ms: number) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return { controller, cleanup: () => clearTimeout(timer) };
};

const fetchCors = async (url: string, method: "HEAD" | "GET", timeoutMs: number) => {
    const { controller, cleanup } = withTimeout(timeoutMs);
    try {
        return await fetch(url, {
            method,
            mode: "cors",
            redirect: "follow",
            signal: controller.signal,
        });
    } finally {
        cleanup();
    }
};

export const useUrlsReachable = (
    urls: UrlToTest[],
    opts?: {
        timeoutMs?: number;
        /**
         * strict=true: only count URLs reachable if we can read the HTTP status (CORS success).
         * strict=false: allow opaque no-cors probes to count as reachable (NOT 404-safe).
         */
        strict?: boolean;
    }
) => {
    const [reachable, setReachable] = useState<UrlToTest[]>([]);
    const timeoutMs = opts?.timeoutMs ?? 6000;
    const strict = opts?.strict ?? false;

    useEffect(() => {
        if (!urls?.length) {
            setReachable([]);
            return;
        }

        let cancelled = false;

        const probeOne = async (entry: UrlToTest): Promise<UrlToTest | null> => {
            // 1) Try CORS so we can read status
            try {
                let res = await fetchCors(entry.url, "HEAD", timeoutMs);

                // HEAD not supported? Try GET.
                if (res.status === 405 || res.status === 501) {
                    res = await fetchCors(entry.url, "GET", timeoutMs);
                }

                // Now we can enforce "404 => NOT reachable"
                if (res.status === 404) return null;

                // Decide policy: keep only 2xx, optionally accept redirects
                if (res.ok || (res.status >= 300 && res.status < 400)) return entry;

                return null;
            } catch {
                // 2) CORS failed (or network). If strict: treat as NOT reachable (status unknown).
                if (strict) return null;

                // Non-strict fallback (not 404-safe): a no-cors probe only tells "request didn't throw"
                try {
                    const { controller, cleanup } = withTimeout(timeoutMs);
                    try {
                        const res = await fetch(entry.url, {
                            method: "HEAD",
                            mode: "no-cors",
                            redirect: "follow",
                            signal: controller.signal,
                        });

                        // opaque => status unknown; will include 404 sometimes
                        if (res.type === "opaque") return entry;
                    } finally {
                        cleanup();
                    }
                } catch {
                    // ignore
                }
                return null;
            }
        };

        const run = async () => {
            const results = await Promise.all(urls.map(probeOne));
            if (cancelled) return;
            setReachable(results.filter((v): v is UrlToTest => v !== null));
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [urls, timeoutMs, strict]);

    return reachable;
};
