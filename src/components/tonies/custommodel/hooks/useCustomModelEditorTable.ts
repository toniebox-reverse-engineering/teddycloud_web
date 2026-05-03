import { useMemo } from "react";
import type {
    CustomEntry,
    FilterFieldKey,
    SortColumnKey,
    SortOrder,
    TableRow,
} from "../types/customModelEditorTypes";
import {
    filterValueForEntry,
    normalizeText,
    sortValueForEntry,
} from "../utils/customModelEditorUtils";

type Params = {
    persistedEntries: CustomEntry[];
    modelDraftStatusByIndex: Map<number, "clean" | "changed" | "new" | "deleted">;
    filterText: string;
    filterFields: FilterFieldKey[];
    seriesFilter: string;
    episodeFilter: string;
    selectedLanguages: string[];
    tableSortColumn: SortColumnKey;
    tableSortOrder: SortOrder;
    paginationEnabled: boolean;
    modelListPage: number;
    modelListPageSize: number;
};

export const useCustomModelEditorTable = ({
    persistedEntries,
    modelDraftStatusByIndex,
    filterText,
    filterFields,
    seriesFilter,
    episodeFilter,
    selectedLanguages,
    tableSortColumn,
    tableSortOrder,
    paginationEnabled,
    modelListPage,
    modelListPageSize,
}: Params) => {
    const tableRows = useMemo(() => {
        const filterNeedle = filterText.trim().toLowerCase();
        const seriesNeedle = seriesFilter.trim().toLowerCase();
        const episodeNeedle = episodeFilter.trim().toLowerCase();
        const langSet =
            selectedLanguages.length > 0
                ? new Set(selectedLanguages.map((l) => l.toLowerCase()))
                : null;

        const rows: TableRow[] = persistedEntries.map((entry, idx) => ({
            idx,
            entry,
            status: modelDraftStatusByIndex.get(idx) || "clean",
        }));

        let filtered = rows;

        if (filterNeedle.length > 0) {
            filtered = filtered.filter((row) =>
                filterFields.some((field) =>
                    String(filterValueForEntry(row.entry, field))
                        .toLowerCase()
                        .includes(filterNeedle),
                ),
            );
        }
        if (seriesNeedle.length > 0) {
            filtered = filtered.filter((row) =>
                normalizeText(row.entry.series).toLowerCase().includes(seriesNeedle),
            );
        }
        if (episodeNeedle.length > 0) {
            filtered = filtered.filter((row) =>
                normalizeText(row.entry.episodes).toLowerCase().includes(episodeNeedle),
            );
        }
        if (langSet) {
            filtered = filtered.filter((row) => {
                const lang = normalizeText(row.entry.language).toLowerCase();
                return lang && langSet.has(lang);
            });
        }

        const direction = tableSortOrder === "descend" ? -1 : 1;
        return filtered.sort((left, right) => {
            if (tableSortColumn === "series") {
                const bySeries =
                    String(sortValueForEntry(left.entry, "series")).localeCompare(
                        String(sortValueForEntry(right.entry, "series")),
                        undefined,
                        { numeric: true }
                    ) * direction;
                if (bySeries !== 0) return bySeries;

                const byEpisode =
                    String(sortValueForEntry(left.entry, "episodes")).localeCompare(
                        String(sortValueForEntry(right.entry, "episodes")),
                        undefined,
                        { numeric: true }
                    ) * direction;
                if (byEpisode !== 0) return byEpisode;
            } else {
                const leftSort = sortValueForEntry(left.entry, tableSortColumn);
                const rightSort = sortValueForEntry(right.entry, tableSortColumn);
                const bySort =
                    String(leftSort).localeCompare(String(rightSort), undefined, { numeric: true }) * direction;
                if (bySort !== 0) return bySort;
            }

            return String(left.entry.model || "").localeCompare(String(right.entry.model || ""), undefined, {
                numeric: true,
            }) * direction;
        });
    }, [
        episodeFilter,
        filterFields,
        filterText,
        modelDraftStatusByIndex,
        persistedEntries,
        selectedLanguages,
        seriesFilter,
        tableSortColumn,
        tableSortOrder,
    ]);

    const paginatedRows = useMemo(() => {
        if (!paginationEnabled) return tableRows;
        const start = (modelListPage - 1) * modelListPageSize;
        return tableRows.slice(start, start + modelListPageSize);
    }, [tableRows, modelListPage, modelListPageSize, paginationEnabled]);

    const modelListTotalPages = Math.max(1, Math.ceil(tableRows.length / modelListPageSize));

    return { tableRows, paginatedRows, modelListTotalPages };
};
