import { useEffect, useState } from "react";

export type UrlToTest = {
    id: string;
    url: string;
    title?: string;
};

export const useUrlsReachable = (urls: UrlToTest[]) => {
    const [reachable, setReachable] = useState<UrlToTest[]>([]);

    useEffect(() => {
        if (!urls || urls.length === 0) {
            setReachable([]);
            return;
        }

        const run = async () => {
            const results = await Promise.all(
                urls.map(async (entry) => {
                    try {
                        const response = await fetch(entry.url, {
                            method: "HEAD",
                            mode: "no-cors",
                        });

                        // no-cors → status 0, trotzdem als „erreichbar“ werten
                        if (response.status === 0) {
                            return entry;
                        }
                    } catch {
                        // Fehler ignorieren, URL gilt als nicht erreichbar
                    }
                    return null;
                })
            );

            setReachable(results.filter((v): v is UrlToTest => v !== null));
        };

        run();
    }, [urls]);

    return reachable;
};
