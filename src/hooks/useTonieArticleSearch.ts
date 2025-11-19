import { useCallback, useState } from "react";

import { TonieInfo } from "../types/tonieTypes";
import { TeddyCloudApi } from "../api";
import { defaultAPIConfig } from "../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export interface TonieArticleOption {
    value: string;
    text: string;
    picture?: string;
}

export function useTonieArticleSearch(onError?: (error: unknown) => void) {
    const [options, setOptions] = useState<TonieArticleOption[]>([]);
    const [value, setValue] = useState<string | undefined>();

    const search = useCallback(
        async (searchText: string) => {
            setOptions([]);

            if (!searchText) {
                return;
            }

            const searchEncode = encodeURIComponent(searchText);
            const path =
                "/api/toniesJsonSearch?" +
                "searchModel=" +
                searchEncode +
                "&searchSeries=" +
                searchEncode +
                "&searchEpisode=" +
                searchEncode;

            try {
                const response = await api.apiGetTeddyCloudApiRaw(path);
                const data: TonieInfo[] = await response.json();

                const result: TonieArticleOption[] = data.map((item) => ({
                    value: item.model,
                    text: `[${item.model}] ${item.series} - ${item.episode}`,
                    picture: item.picture,
                }));

                setOptions(result);
            } catch (error) {
                if (onError) {
                    onError(error);
                } else {
                    // optional: Logging
                    // eslint-disable-next-line no-console
                    console.error("Error in useTonieArticleSearch:", error);
                }
            }
        },
        [onError]
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
    };
}
