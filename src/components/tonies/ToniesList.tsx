import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { List, Switch, Input, Button, Collapse, Select, CollapseProps } from "antd";
import { useTranslation } from "react-i18next";
import { TonieCard, TonieCardProps } from "../../components/tonies/TonieCard";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import ToniesPagination from "./ToniesPagination";
import { languageOptions } from "../../utils/languageUtil";

const { Option } = Select;
const api = new TeddyCloudApi(defaultAPIConfig());
const STORAGE_KEY = "toniesListState";

export const ToniesList: React.FC<{
    tonieCards: TonieCardProps[];
    showFilter: boolean;
    showPagination: boolean;
    overlay: string;
    readOnly: boolean;
    defaultLanguage?: string;
    onToniesCardUpdate?: (updatedTonieCard: TonieCardProps) => void;
}> = ({ tonieCards, showFilter, showPagination, overlay, readOnly, defaultLanguage = "", onToniesCardUpdate }) => {
    const { t } = useTranslation();
    const location = useLocation();

    const [filteredTonies, setFilteredTonies] = useState(tonieCards);
    const [searchText, setSearchText] = useState("");
    const [seriesFilter, setSeriesFilter] = useState("");
    const [episodeFilter, setEpisodeFilter] = useState("");
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [filterLastTonieboxRUIDs, setFilterLastTonieboxRUIDs] = useState(false);
    const [validFilter, setValidFilter] = useState(false);
    const [invalidFilter, setInvalidFilter] = useState(false);
    const [existsFilter, setExistsFilter] = useState(false);
    const [notExistsFilter, setNotExistsFilter] = useState(false);
    const [liveFilter, setLiveFilter] = useState(false);
    const [unsetLiveFilter, setUnsetLiveFilter] = useState(false);
    const [nocloudFilter, setNocloudFilter] = useState(false);
    const [unsetNocloudFilter, setUnsetNocloudFilter] = useState(false);
    const [hasCloudAuthFilter, setHasCloudAuthFilter] = useState(false);
    const [unsetHasCloudAuthFilter, setUnsetHasCloudAuthFilter] = useState(false);
    const [collapsed, setCollapsed] = useState(true);
    const [loading, setLoading] = useState(true);
    const [lastTonieboxRUIDs, setLastTonieboxRUIDs] = useState<Array<[string, string, string]>>([]);
    const [pageSize, setPageSize] = useState<number>(() => {
        const storedState = localStorage.getItem(STORAGE_KEY);
        if (storedState) {
            const { pageSize } = JSON.parse(storedState);
            return pageSize;
        }
        return 24;
    });
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [paginationEnabled, setPaginationEnabled] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [doLocalStore, setLocalStore] = useState(true);
    const [hiddenRuids, setHiddenRuids] = useState<String[]>([]);
    const [listKey, setListKey] = useState(0);

    useEffect(() => {
        const storedState = localStorage.getItem(STORAGE_KEY);
        if (storedState) {
            try {
                const { pageSize, showAll } = JSON.parse(storedState);
                if (showAll) {
                    handleShowAll();
                } else {
                    setPageSize(pageSize);
                    handlePageSizeChange(1, pageSize);
                }
            } catch (error) {
                console.error("Error parsing stored state:", error);
            }
        } else {
            console.log("No stored state found.");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const fetchTonieboxes = async () => {
            const fetchTonieboxLastRUID = async (id: string) => {
                const ruid = await api.apiGetTonieboxLastRUID(id);
                return ruid;
            };
            const fetchTonieboxLastRUIDTime = async (id: string) => {
                const ruidTime = await api.apiGetTonieboxLastRUIDTime(id);
                return ruidTime;
            };
            const tonieboxData = await api.apiGetTonieboxesIndex();
            const tonieboxLastRUIDs = await Promise.all(
                tonieboxData.map(async (toniebox) => {
                    const lastRUID = await fetchTonieboxLastRUID(toniebox.ID);
                    const lastRUIDTime = await fetchTonieboxLastRUIDTime(toniebox.ID);
                    return [lastRUID, lastRUIDTime, toniebox.boxName] as [string, string, string];
                })
            );
            setLastTonieboxRUIDs(tonieboxLastRUIDs);
        };
        fetchTonieboxes();
    }, []);

    const ruidHash = useMemo(() => tonieCards.map((tonie) => tonie.ruid).join(","), [tonieCards]);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const tonieRUID = searchParams.get("tonieRUID");
        if (tonieRUID) {
            setSearchText(tonieRUID);
            setCollapsed(false);
            const prefilteredTonies = tonieCards.filter((tonie) => tonie.ruid.toLowerCase() === tonieRUID);
            setFilteredTonies(prefilteredTonies);
        } else {
            setFilteredTonies(tonieCards);
        }
        setListKey((prevKey) => prevKey + 1);
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search, ruidHash]);

    useEffect(() => {
        // reset currentPage to 1 if the number of Tonies has changed.
        setCurrentPage(1);
        setListKey((prevKey) => prevKey + 1);
    }, [ruidHash]);

    useEffect(() => {
        const stateToStore = JSON.stringify({
            pageSize,
            paginationEnabled,
            showAll,
        });
        localStorage.setItem(STORAGE_KEY, stateToStore);
    }, [doLocalStore, pageSize, paginationEnabled, showAll]);

    const storeLocalStorage = () => {
        setLocalStore(!doLocalStore);
    };

    const handleUpdate = (updatedTonieCard: TonieCardProps) => {
        if (onToniesCardUpdate) {
            onToniesCardUpdate(updatedTonieCard);
        }
        setFilteredTonies((prevTonies) =>
            prevTonies.map((tonie) => (tonie.ruid === updatedTonieCard.ruid ? updatedTonieCard : tonie))
        );
    };

    const handleFilter = () => {
        let filtered = tonieCards.filter(
            (tonie) =>
                ((tonie.sourceInfo?.series &&
                    tonie.sourceInfo.series.toLowerCase().includes(seriesFilter.toLowerCase())) ||
                    tonie.tonieInfo.series.toLowerCase().includes(seriesFilter.toLowerCase())) &&
                ((tonie.sourceInfo?.episode &&
                    tonie.sourceInfo.episode.toLowerCase().includes(episodeFilter.toLowerCase())) ||
                    tonie.tonieInfo.episode.toLowerCase().includes(episodeFilter.toLowerCase())) &&
                (selectedLanguages.length === 0 ||
                    selectedLanguages.includes(
                        tonie.tonieInfo.language !== undefined
                            ? languageOptions.includes(tonie.tonieInfo.language)
                                ? tonie.tonieInfo.language
                                : "undefined"
                            : "undefined"
                    ) ||
                    selectedLanguages.includes(
                        tonie.sourceInfo && tonie.sourceInfo.language !== undefined
                            ? languageOptions.includes(tonie.sourceInfo.language)
                                ? tonie.sourceInfo.language
                                : "undefined"
                            : "undefined"
                    )) &&
                (!validFilter || tonie.valid) &&
                (!invalidFilter || !tonie.valid) &&
                (!existsFilter || tonie.exists) &&
                (!notExistsFilter || !tonie.exists) &&
                (!liveFilter || tonie.live) &&
                (!unsetLiveFilter || !tonie.live) &&
                (!nocloudFilter || tonie.nocloud) &&
                (!unsetNocloudFilter || !tonie.nocloud) &&
                (!hasCloudAuthFilter || tonie.hasCloudAuth) &&
                (!unsetHasCloudAuthFilter || !tonie.hasCloudAuth)
        );
        if (searchText) {
            filtered = filtered.filter(
                (tonie) =>
                    tonie.tonieInfo.series.toLowerCase().includes(searchText.toLowerCase()) ||
                    (tonie.sourceInfo?.series &&
                        tonie.sourceInfo.series.toLowerCase().includes(searchText.toLowerCase())) ||
                    tonie.tonieInfo.episode.toLowerCase().includes(searchText.toLowerCase()) ||
                    (tonie.sourceInfo?.episode &&
                        tonie.sourceInfo.episode.toLowerCase().includes(searchText.toLowerCase())) ||
                    tonie.tonieInfo.model.toLowerCase().includes(searchText.toLowerCase()) ||
                    (tonie.sourceInfo?.model &&
                        tonie.sourceInfo.model.toLowerCase().includes(searchText.toLowerCase())) ||
                    tonie.ruid.toLowerCase().includes(searchText.toLowerCase()) ||
                    tonie.uid.toLowerCase().includes(searchText.toLowerCase())
            );
        }
        if (filterLastTonieboxRUIDs) {
            // Filter by RUID part of the lastTonieboxRUIDs array
            filtered = filtered.filter((tonie) => lastTonieboxRUIDs.some(([ruid]) => ruid === tonie.ruid));
        }

        if (hiddenRuids) {
            // filter hidden RUIDs always
            filtered = filtered.filter((tonie) => !hiddenRuids.includes(tonie.ruid));
        }
        setCurrentPage(1);
        setFilteredTonies(filtered);
        setListKey((prevKey) => prevKey + 1);
    };

    const handleHideTonieCard = (ruid: string) => {
        setFilteredTonies(filteredTonies.filter((tonie) => tonie.ruid !== ruid));
        setHiddenRuids((prevHiddenRuids) => [...prevHiddenRuids, ruid]);
        setListKey((prevKey) => prevKey + 1);
    };

    const handleResetFilters = () => {
        setSearchText("");
        setSeriesFilter("");
        setEpisodeFilter("");
        setValidFilter(false);
        setInvalidFilter(false);
        setExistsFilter(false);
        setNotExistsFilter(false);
        setLiveFilter(false);
        setUnsetLiveFilter(false);
        setNocloudFilter(false);
        setUnsetNocloudFilter(false);
        setHasCloudAuthFilter(false);
        setUnsetHasCloudAuthFilter(false);
        setFilterLastTonieboxRUIDs(false);
        setSelectedLanguages([]);
        const urlWithoutParams = window.location.pathname;
        window.history.pushState({}, "", urlWithoutParams);
        location.search = "";
        if (hiddenRuids) {
            // filter hidden RUIDs always
            tonieCards = tonieCards.filter((tonie) => !hiddenRuids.includes(tonie.ruid));
        }
        setFilteredTonies(tonieCards);
        setListKey((prevKey) => prevKey + 1);
    };

    const handleShowAll = () => {
        setShowAll(true);
        setPaginationEnabled(false);
        storeLocalStorage();
    };

    const handleShowPagination = () => {
        setPaginationEnabled(true);
        setShowAll(false);
        handlePageSizeChange(1, pageSize);
    };

    const handlePageSizeChange = (current: number, size: number) => {
        setPageSize(size as number);
        setListKey((prevKey) => prevKey + 1);
        setCurrentPage(current);
        storeLocalStorage();
        window.scrollTo(0, 0);
    };
    if (loading) {
        return <div>Loading...</div>;
    }

    const getCurrentPageData = () => {
        if (showAll) {
            return filteredTonies !== null ? filteredTonies : tonieCards;
        } else {
            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            return filteredTonies !== null
                ? filteredTonies.slice(startIndex, endIndex)
                : tonieCards.slice(startIndex, endIndex);
        }
    };

    const listPagination = (
        <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap" }}>
            {!paginationEnabled ? (
                <Button onClick={handleShowPagination}>{t("tonies.tonies.showPagination")}</Button>
            ) : (
                <ToniesPagination
                    currentPage={currentPage}
                    onChange={handlePageSizeChange}
                    total={filteredTonies !== null ? filteredTonies.length : tonieCards.length}
                    pageSize={pageSize}
                    additionalButtonOnClick={handleShowAll}
                />
            )}
        </div>
    );

    const filterPanelContent = (
        <>
            <label htmlFor="search-field" className="filter-label">
                {t("tonies.tonies.filterBar.searchLabel")}
            </label>
            <Input.Search
                id="search-field"
                placeholder={t("tonies.tonies.filterBar.searchPlaceholder")}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={handleFilter}
                enterButton
                style={{ margin: "8px 0 8px 0" }}
            />
            <div className="filter-container">
                <label className="filter-label">{t("tonies.tonies.filterBar.filterLabel")}</label>
                <Input
                    style={{ margin: "8px 0 8px 0" }}
                    placeholder={t("tonies.tonies.filterBar.seriesFilterPlaceholder")}
                    value={seriesFilter}
                    onChange={(e) => setSeriesFilter(e.target.value)}
                />
                <Input
                    style={{ margin: "8px 0 8px 0" }}
                    placeholder={t("tonies.tonies.filterBar.episodeFilterPlaceholder")}
                    value={episodeFilter}
                    onChange={(e) => setEpisodeFilter(e.target.value)}
                />
                <Select
                    mode="multiple"
                    placeholder={t("tonies.tonies.filterBar.languagePlaceholder")}
                    value={selectedLanguages}
                    onChange={(values) => setSelectedLanguages(values)}
                    style={{ width: "100%", margin: "8px 0" }}
                >
                    {languageOptions.map((key) => (
                        <Option key={key} value={key}>
                            {key ? t("languageUtil." + key) : t("languageUtil.other")}
                        </Option>
                    ))}
                </Select>
                <div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                            gap: "16px",
                        }}
                    >
                        <div
                            style={{
                                flex: "1 1 auto",
                                minWidth: 0,
                                marginRight: 16,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <Switch checked={validFilter} onChange={(checked) => setValidFilter(checked)} />
                            {t("tonies.tonies.filterBar.valid")}
                        </div>
                        <div
                            style={{
                                flex: "1 1 auto",
                                minWidth: 0,
                                marginRight: 16,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <Switch checked={invalidFilter} onChange={(checked) => setInvalidFilter(checked)} />
                            {t("tonies.tonies.filterBar.invalid")}
                        </div>
                        <div
                            style={{
                                flex: "1 1 auto",
                                minWidth: 0,
                                marginRight: 16,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <Switch checked={existsFilter} onChange={(checked) => setExistsFilter(checked)} />{" "}
                            {t("tonies.tonies.filterBar.exists")}
                        </div>
                        <div
                            style={{
                                flex: "1 1 auto",
                                minWidth: 0,
                                marginRight: 16,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <Switch checked={notExistsFilter} onChange={(checked) => setNotExistsFilter(checked)} />
                            {t("tonies.tonies.filterBar.notExists")}
                        </div>
                        <div
                            style={{
                                flex: "1 1 auto",
                                minWidth: 0,
                                marginRight: 16,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <Switch checked={liveFilter} onChange={(checked) => setLiveFilter(checked)} />{" "}
                            {t("tonies.tonies.filterBar.live")}
                        </div>
                        <div
                            style={{
                                flex: "1 1 auto",
                                minWidth: 0,
                                marginRight: 16,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <Switch checked={unsetLiveFilter} onChange={(checked) => setUnsetLiveFilter(checked)} />{" "}
                            {t("tonies.tonies.filterBar.unsetLive")}
                        </div>

                        <div
                            style={{
                                flex: "1 1 auto",
                                minWidth: 0,
                                marginRight: 16,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <Switch
                                checked={unsetNocloudFilter}
                                onChange={(checked) => setUnsetNocloudFilter(checked)}
                            />
                            {t("tonies.tonies.filterBar.unsetNoCloud")}
                        </div>
                        <div
                            style={{
                                flex: "1 1 auto",
                                minWidth: 0,
                                marginRight: 16,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <Switch checked={nocloudFilter} onChange={(checked) => setNocloudFilter(checked)} />
                            {t("tonies.tonies.filterBar.noCloud")}
                        </div>
                        <div
                            style={{
                                flex: "1 1 auto",
                                minWidth: 0,
                                marginRight: 16,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <Switch
                                checked={hasCloudAuthFilter}
                                onChange={(checked) => setHasCloudAuthFilter(checked)}
                            />
                            {t("tonies.tonies.filterBar.hasCloudAuth")}
                        </div>
                        <div
                            style={{
                                flex: "1 1 auto",
                                minWidth: 0,
                                marginRight: 16,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <Switch
                                checked={unsetHasCloudAuthFilter}
                                onChange={(checked) => setUnsetHasCloudAuthFilter(checked)}
                            />
                            {t("tonies.tonies.filterBar.unsetHasCloudAuth")}
                        </div>
                        <div
                            style={{
                                flex: "1 1 auto",
                                minWidth: 0,
                                marginRight: 16,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <Switch
                                checked={filterLastTonieboxRUIDs}
                                onChange={(checked) => setFilterLastTonieboxRUIDs(checked)}
                            />
                            {t("tonies.tonies.filterBar.lastPlayed")}
                        </div>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: "flex-end",
                            marginTop: 8,
                        }}
                    >
                        <Button onClick={handleResetFilters} style={{ marginLeft: 16 }}>
                            {t("tonies.tonies.filterBar.resetFilters")}
                        </Button>
                        <Button onClick={handleFilter} style={{ marginLeft: 16 }}>
                            {t("tonies.tonies.filterBar.applyFilters")}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );

    const filterPanelContentItem: CollapseProps["items"] = [
        {
            key: "search-filter",
            label: collapsed ? t("tonies.tonies.filterBar.showFilters") : t("tonies.tonies.filterBar.hideFilters"),
            children: filterPanelContent,
        },
    ];

    return (
        <div className="tonies-list-container">
            {showFilter ? (
                <Collapse
                    items={filterPanelContentItem}
                    defaultActiveKey={collapsed ? [] : ["search-filter"]}
                    onChange={() => setCollapsed(!collapsed)}
                    bordered={false}
                />
            ) : (
                ""
            )}
            <List
                header={showPagination ? listPagination : ""}
                footer={showPagination ? listPagination : ""}
                grid={{
                    gutter: 16,
                    xs: 1,
                    sm: 2,
                    md: 2,
                    lg: 3,
                    xl: 4,
                    xxl: 6,
                }}
                dataSource={getCurrentPageData()}
                key={listKey}
                renderItem={(tonie) => (
                    <List.Item id={tonie.ruid}>
                        <TonieCard
                            tonieCard={tonie}
                            lastRUIDs={lastTonieboxRUIDs}
                            overlay={overlay}
                            readOnly={readOnly}
                            defaultLanguage={defaultLanguage}
                            onHide={handleHideTonieCard}
                            onUpdate={handleUpdate}
                        />
                    </List.Item>
                )}
            />
        </div>
    );
};
