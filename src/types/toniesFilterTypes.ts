export interface ToniesFilterSettings {
    seriesFilter: string;
    episodeFilter: string;
    selectedLanguages: string[];
    validFilter: boolean;
    invalidFilter: boolean;
    existsFilter: boolean;
    notExistsFilter: boolean;
    liveFilter: boolean;
    unsetLiveFilter: boolean;
    nocloudFilter: boolean;
    unsetNocloudFilter: boolean;
    hasCloudAuthFilter: boolean;
    unsetHasCloudAuthFilter: boolean;
    searchText: string;
    filterLastTonieboxRUIDs: boolean;
    customFilter: string;
    hiddenRuids: string[];
}

export interface ToniesFilterState extends ToniesFilterSettings {
    customFilterValid: boolean;
    customFilterError?: string;
    filterName: string;
}

export interface ToniesFilterActions {
    // basic setters used by UI controls
    setSearchText: (v: string) => void;
    setSeriesFilter: (v: string) => void;
    setEpisodeFilter: (v: string) => void;
    setSelectedLanguages: (v: string[]) => void;
    setValidFilter: (v: boolean) => void;
    setInvalidFilter: (v: boolean) => void;
    setExistsFilter: (v: boolean) => void;
    setNotExistsFilter: (v: boolean) => void;
    setLiveFilter: (v: boolean) => void;
    setUnsetLiveFilter: (v: boolean) => void;
    setNocloudFilter: (v: boolean) => void;
    setUnsetNocloudFilter: (v: boolean) => void;
    setHasCloudAuthFilter: (v: boolean) => void;
    setUnsetHasCloudAuthFilter: (v: boolean) => void;
    setFilterLastTonieboxRUIDs: (v: boolean) => void;
    setCustomFilter: (v: string) => void;
    setFilterName: (v: string) => void;

    // custom filter helpers
    validateCustomFilter: (input: string) => void;
    getCustomFilterCompletions: (input: string) => string[];

    // main actions
    applyFilters: () => void;
    resetFilters: () => void;
    hideTonieCard: (ruid: string) => void;
}
