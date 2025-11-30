import { useMemo, useState } from "react";

export interface CustomItem {
    pic?: string;
    text?: string;
    trackTitles?: string[];
    episodes?: string;
}

export interface CustomItemsHook {
    results: any[];
    customItems: CustomItem[];
    mergedResults: any[];
    addResult: (dataset: any) => void;
    addCustomImage: (file: File) => boolean;
    removeByMergedIndex: (indexToRemove: number) => void;
    editByMergedIndex: (indexToEdid: number, titles: string[], text: string, episodes: string, picture: string) => void;
    clearAll: () => void;
}

export interface MergedItem {
    custom: boolean;
    text?: string;
    pic?: string;
    episodes: string;
    model: string;
    language: string;
    trackTitles: string[];
}

export const useCustomItems = (): CustomItemsHook => {
    const [results, setResults] = useState<any[]>([]);
    const [customItems, setCustomItems] = useState<CustomItem[]>([]);

    const mergedResults = useMemo(
        () => [
            ...results,
            ...customItems.map((item) => ({
                custom: true,
                text: item.text,
                pic: item.pic,
                episodes: item.episodes,
                model: "",
                language: "",
                trackTitles: item.trackTitles || [],
            })),
        ],
        [results, customItems]
    );

    const addResult = (dataset: any) => {
        setResults((prev) => [...prev, dataset]);
    };

    const addCustomImage = (file: File) => {
        const url = URL.createObjectURL(file);
        setCustomItems((prev) => [...prev, { pic: url, text: "" }]);
        return false;
    };

    const clearAll = () => {
        setResults([]);
        setCustomItems([]);
    };

    const removeByMergedIndex = (indexToRemove: number) => {
        if (indexToRemove < results.length) {
            setResults((prev) => prev.filter((_, index) => index !== indexToRemove));
        } else {
            const customIndex = indexToRemove - results.length;
            setCustomItems((prev) => prev.filter((_, index) => index !== customIndex));
        }
    };

    const editByMergedIndex = (
        indexToEdit: number,
        titles: string[],
        episodes: string,
        text: string,
        picture: string
    ) => {
        if (indexToEdit < results.length) {
            setResults((prev) =>
                prev.map((item, index) =>
                    index === indexToEdit
                        ? {
                              ...item,
                              trackTitles: titles,
                              episodes: episodes,
                              text: text,
                              pic: picture,
                          }
                        : item
                )
            );
        } else {
            const customIndex = indexToEdit - results.length;
            setCustomItems((prev) =>
                prev.map((item, index) =>
                    index === customIndex
                        ? {
                              ...item,
                              trackTitles: titles,
                              episodes: episodes,
                              text: text,
                              pic: picture,
                          }
                        : item
                )
            );
        }
    };

    return {
        results,
        customItems,
        mergedResults,
        addResult,
        addCustomImage,
        removeByMergedIndex,
        editByMergedIndex,
        clearAll,
    };
};
