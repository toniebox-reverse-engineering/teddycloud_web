import { useMemo, useState } from "react";
import { generateUUID } from "../../../../utils/ids/generateUUID";

export interface CustomItem {
    id: string;
    pic?: string;
    text?: string;
    trackTitles?: string[];
    episodes?: string;
}

export interface CustomItemsHook {
    results: any[];
    customItems: CustomItem[];
    mergedResults: MergedItem[];
    addResult: (dataset: any) => void;
    addCustomImage: (file: File) => boolean;
    removeByMergedIndex: (indexToRemove: number) => void;
    editByMergedIndex: (indexToEdit: number, titles: string[], episodes: string, text: string, picture: string) => void;
    clearAll: () => void;
}

export interface MergedItem {
    id: string;
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

    const ensureId = <T extends Record<string, any>>(item: T): T & { id: string } => ({
        ...item,
        id: item.id ?? generateUUID(),
    });

    const mergedResults: MergedItem[] = useMemo(() => {
        const resultsWithId = results.map((r) => ({
            ...ensureId(r),
            custom: false,
            episodes: r.episodes ?? "",
            model: r.model ?? "",
            language: r.language ?? "",
            trackTitles: Array.isArray(r.trackTitles) ? r.trackTitles : [],
            pic: r.pic,
            text: r.text ?? r.series ?? r.title ?? "",
        })) as MergedItem[];

        const customWithId = customItems.map((c) => ({
            id: c.id,
            custom: true,
            text: c.text ?? "",
            pic: c.pic ?? "",
            episodes: c.episodes ?? "",
            model: "",
            language: "",
            trackTitles: c.trackTitles ?? [],
        })) as MergedItem[];

        return [...resultsWithId, ...customWithId];
    }, [results, customItems]);

    const addResult = (dataset: any) => {
        setResults((prev) => [...prev, ensureId(dataset)]);
    };

    const addCustomImage = (file: File) => {
        const url = URL.createObjectURL(file);
        setCustomItems((prev) => [...prev, { id: generateUUID(), pic: url, text: "", episodes: "", trackTitles: [] }]);
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
                              episodes,
                              text,
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
                              episodes,
                              text,
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
