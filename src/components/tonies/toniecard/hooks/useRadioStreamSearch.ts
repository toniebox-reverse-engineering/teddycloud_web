import { useCallback, useEffect, useState } from "react";
import { RadioBrowserFallBackUrl, RadioBrowserServerAPIUrlListUrl } from "../../../../constants/urls";

export interface RadioStreamOption {
    value: string;
    text: string;
}

interface RadioBrowserServer {
    name: string;
}

interface RadioBrowserStation {
    url: string;
    name: string;
    country?: string;
    language?: string;
}

export function useRadioStreamSearch(onError?: (error: unknown) => void) {
    const [options, setOptions] = useState<RadioStreamOption[]>([]);
    const [value, setValue] = useState<string | undefined>();

    const [radioBrowserAPIBaseJsonUrl, setRadioBrowserAPIBaseJsonUrl] = useState<string | null>(null);
    const [isRadioBrowserApiAvailable, setApiAvailable] = useState(false);

    // Serverliste laden
    const fetchRadioBrowserBaseUrls = useCallback(async (): Promise<string[]> => {
        try {
            const response = await fetch(RadioBrowserServerAPIUrlListUrl);
            if (!response.ok) throw new Error("Failed to fetch server list");
            const data: RadioBrowserServer[] = await response.json();
            return data.map((server) => `https://${server.name}`);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Error fetching server list:", error);
            return [];
        }
    }, []);

    const getRandomRadioBrowserUrl = useCallback(async (): Promise<string | null> => {
        const hosts = await fetchRadioBrowserBaseUrls();
        if (hosts.length === 0) return null;
        const index = Math.floor(Math.random() * hosts.length);
        return hosts[index];
    }, [fetchRadioBrowserBaseUrls]);

    useEffect(() => {
        const fetchData = async () => {
            const url = await getRandomRadioBrowserUrl();
            if (!url) {
                // eslint-disable-next-line no-console
                console.log("Fetching random radio browser URL failed, using hardcoded fallback.");
                setRadioBrowserAPIBaseJsonUrl(RadioBrowserFallBackUrl);
            } else {
                // eslint-disable-next-line no-console
                console.log("Using random Radio Browser API URL:", url);
                setRadioBrowserAPIBaseJsonUrl(url + "/json");
            }
        };

        fetchData();
    }, [getRandomRadioBrowserUrl]);

    useEffect(() => {
        if (!radioBrowserAPIBaseJsonUrl) return;

        const checkApiAvailability = async () => {
            try {
                // eslint-disable-next-line no-console
                console.log("Checking API availability at:", radioBrowserAPIBaseJsonUrl);
                const response = await fetch(radioBrowserAPIBaseJsonUrl + "/stats");

                if (response.ok) {
                    // eslint-disable-next-line no-console
                    console.log("API is available:", radioBrowserAPIBaseJsonUrl);
                    setApiAvailable(true);
                } else {
                    // eslint-disable-next-line no-console
                    console.warn("API not available:", radioBrowserAPIBaseJsonUrl);
                    setApiAvailable(false);
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error("Error checking API availability:", error);
                setApiAvailable(false);
            }
        };

        checkApiAvailability();
    }, [radioBrowserAPIBaseJsonUrl]);

    const search = useCallback(
        async (searchText: string) => {
            if (!radioBrowserAPIBaseJsonUrl) {
                // eslint-disable-next-line no-console
                console.warn("Skipping search: API URL is null");
                return;
            }

            setOptions([]);

            if (!searchText) {
                return;
            }

            const searchEncode = encodeURIComponent(searchText);
            const url =
                radioBrowserAPIBaseJsonUrl + "/stations/search?name=" + searchEncode + "&is_https=true&hidebroken=true";

            try {
                const response = await fetch(url, {});
                if (!response.ok) {
                    throw new Error(response.status + " " + response.statusText);
                }

                const data: RadioBrowserStation[] = await response.json();

                // Unique URLs
                const uniqueData = Array.from(new Set(data.map((item) => item.url))).map((url) => {
                    const item = data.find((station) => station.url === url)!;
                    return {
                        value: item.url,
                        text:
                            (item.country ? "[" + item.country + "] " : "") +
                            item.name +
                            (item.language ? " (" + item.language + ")" : ""),
                    };
                });

                setOptions(uniqueData);
            } catch (error) {
                if (onError) {
                    onError(error);
                } else {
                    // eslint-disable-next-line no-console
                    console.error("Error in useRadioStreamSearch:", error);
                }
            }
        },
        [radioBrowserAPIBaseJsonUrl, onError]
    );

    const select = useCallback((newValue: string) => {
        setValue(newValue);
    }, []);

    return {
        value,
        options,
        search,
        select,
        setValue,
        setOptions,
        isRadioBrowserApiAvailable,
        radioBrowserAPIBaseJsonUrl,
    };
}
