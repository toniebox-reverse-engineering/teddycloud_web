import { useCallback, useState } from "react";

import { TonieInfo } from "../../../../types/tonieTypes";
import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export interface ToniesJsonEntry {
    value: string;
    text: string;
    picture?: string;
    episodes?: string;
    model?: string;
    language?: string;
}

export function useToniesJsonSearch(onError?: (error: unknown) => void) {
    const [options, setOptions] = useState<ToniesJsonEntry[]>([]);
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

                const result: ToniesJsonEntry[] = data.map((item) => {
                    const model = item.model ?? "";
                    const episodes = item.episode ?? "";
                    const language = item.language ?? "";

                    return {
                        value: model,
                        text: model
                            ? `[${model}] ${item.series ?? ""} - ${episodes}`
                            : `${item.series ?? ""} - ${episodes}`,
                        picture: (item as any).picture,
                        episodes,
                        model,
                        language,
                    };
                });

                setOptions(result);
            } catch (error) {
                if (onError) {
                    onError(error);
                } else {
                    // eslint-disable-next-line no-console
                    console.error("Error in useToniesJsonSearch:", error);
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
