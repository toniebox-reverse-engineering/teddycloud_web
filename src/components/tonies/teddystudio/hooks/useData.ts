import { useEffect, useState } from "react";
import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export interface DataHook {
    jsonData: any[];
    searchTerm: string;
    autocompleteList: any[];
    handleSearch: (value: string) => void;
}

export const useData = (): DataHook => {
    const [jsonData, setJsonData] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [autocompleteList, setAutocompleteList] = useState<any[]>([]);

    useEffect(() => {
        const loadJSONData = async () => {
            try {
                const [defaultResponse, customResponse] = await Promise.all([
                    api.apiGetTeddyCloudApiRaw(`/api/toniesJson`),
                    api.apiGetTeddyCloudApiRaw(`/api/toniesCustomJson`),
                ]);

                const [defaultData, customData] = await Promise.all([defaultResponse.json(), customResponse.json()]);
                const mergedData = [...defaultData, ...customData];
                setJsonData(mergedData);
            } catch (err) {
                console.error("Error loading json files:", err);
            }
        };

        loadJSONData();
    }, []);

    const handleSearch = (value: string) => {
        const query = value.toLowerCase();
        setSearchTerm(value);

        if (query === "") {
            setAutocompleteList([]);
            return;
        }

        const filtered = jsonData.filter(
            (item: any) => item.title?.toLowerCase().includes(query) || item.series?.toLowerCase().includes(query)
        );
        setAutocompleteList(filtered);
    };

    return {
        jsonData,
        searchTerm,
        autocompleteList,
        handleSearch,
    };
};
