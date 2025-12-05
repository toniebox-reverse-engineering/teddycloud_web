import { Button, Dropdown, Empty, Flex, Grid, Space, Tooltip } from "antd";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import { TonieCardProps } from "../../../types/tonieTypes";

import { TeddyCloudApi } from "../../../api";
import { defaultAPIConfig } from "../../../config/defaultApiConfig";

import { TonieCard } from "../toniecard/TonieCard";
import { useToniesFilter } from "./hooks/useToniesFilter";
import { useTeddyCloud } from "../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../types/teddyCloudNotificationTypes";
import type { ToniesFilterSettings } from "../../../types/toniesFilterTypes";
import { canHover, scrollToTop } from "../../../utils/browser/browserUtils";
import { hideSelectedTonies, setLiveFlag, setNoCloud } from "./utils/ToniesListActions";
import { exportCompleteInfoToJSON, exportToCSV, exportToHTML, exportToJSON } from "./utils/ToniesListExport";
import { ToniesFilterPanel } from "./filterpanel/ToniesFilterPanel";
import ToniesPagination from "./pagination/ToniesPagination";
import { showHideTonieConfirm } from "./modals/ToniesHideConfirmModal";
import { EllipsisOutlined } from "@ant-design/icons";

const api = new TeddyCloudApi(defaultAPIConfig());
const STORAGE_KEY = "toniesListState";

export const ToniesList: React.FC<{
    tonieCards: TonieCardProps[];
    showFilter: boolean;
    showPagination: boolean;
    overlay: string;
    readOnly: boolean;
    defaultLanguage?: string;
    noLastRuid?: boolean;
    onToniesCardUpdate?: (updatedTonieCard: TonieCardProps) => void;
}> = ({
    tonieCards,
    showFilter,
    showPagination,
    overlay,
    readOnly,
    defaultLanguage = "",
    noLastRuid = false,
    onToniesCardUpdate,
}) => {
    const { t } = useTranslation();
    const location = useLocation();
    const { addNotification } = useTeddyCloud();
    const screens = Grid.useBreakpoint();

    // ------------------------
    // Local state
    // ------------------------

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
    const [listKey, setListKey] = useState(0);
    const [showSourceInfo, setShowSourceInfo] = useState<boolean>(false);
    const [selectedTonies, setSelectedTonies] = useState<string[]>([]);
    const [selectionMode, setSelectionMode] = useState<boolean>(false);
    const [collapsed, setCollapsed] = useState(true);

    const [filterName, setFilterName] = useState("");
    const [existingFilters, setExistingFilters] = useState<Record<string, ToniesFilterSettings>>({});

    const [urlFilterPending, setUrlFilterPending] = useState(false);

    const toniesListRef = useRef<HTMLDivElement | null>(null);

    const columns = screens.xxl ? 6 : screens.xl ? 4 : screens.lg ? 3 : screens.md ? 2 : screens.sm ? 2 : 1;

    // ------------------------
    // Effects – basic wiring
    // ------------------------

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("tonieFilters") || "{}") as Record<string, ToniesFilterSettings>;
        setExistingFilters(stored);
    }, []);

    // ------------------------
    // Derived data / memoized values
    // ------------------------

    const ruidHash = useMemo(() => tonieCards.map((tonie) => tonie.ruid).join(","), [tonieCards]);

    const uniquenessMaps = useMemo(() => {
        function buildMap(getKey: (t: TonieCardProps) => string) {
            const counts: Record<string, number> = {};
            tonieCards.forEach((t) => {
                const key = getKey(t);
                counts[key] = (counts[key] || 0) + 1;
            });
            return Object.fromEntries(Object.entries(counts).map(([k, c]) => [k, c === 1]));
        }

        const getEpisode = (t: TonieCardProps) => t.sourceInfo?.episode || t.tonieInfo.episode || "";
        const getSeries = (t: TonieCardProps) => t.sourceInfo?.series || t.tonieInfo.series || "";
        const getModel = (t: TonieCardProps) => t.sourceInfo?.model || t.tonieInfo.model || "";

        return {
            episode: buildMap(getEpisode),
            series: buildMap(getSeries),
            model: buildMap(getModel),
        };
    }, [tonieCards]);

    const {
        filteredTonies,
        filterState,
        filterActions,
        existingFilters: hookExistingFilters,
        saveFilterSettings,
        loadFilterSettings,
        deleteFilter,
        setFilteredTonies,
    } = useToniesFilter({
        tonieCards,
        lastTonieboxRUIDs,
        uniquenessMaps,
    });

    // NOTE: currently unused, but kept for possible future use
    const filteredRuidSet = useMemo(() => {
        if (!filteredTonies) return null;
        return new Set(filteredTonies.map((t) => t.ruid));
    }, [filteredTonies]);

    // ------------------------
    // Helpers
    // ------------------------

    const getBaseList = () => filteredTonies ?? tonieCards;

    // ------------------------
    // Effects – filters / URL / remote data
    // ------------------------

    useEffect(() => {
        if (Object.keys(hookExistingFilters).length > 0) {
            setExistingFilters(hookExistingFilters);
        }
    }, [hookExistingFilters]);

    useEffect(() => {
        const storedState = localStorage.getItem(STORAGE_KEY);
        if (storedState) {
            try {
                const { pageSize: storedPageSize, showAll: storedShowAll } = JSON.parse(storedState);
                if (storedShowAll) {
                    setPageSize(storedPageSize);
                    handleShowAll(storedPageSize);
                } else {
                    setPageSize(storedPageSize);
                    handlePageSizeChange(1, storedPageSize);
                }
            } catch (error) {
                console.error("Error parsing stored state:", error);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const fetchTonieboxes = async () => {
            const fetchTonieboxLastRUID = async (id: string) => api.apiGetTonieboxLastRUID(id);
            const fetchTonieboxLastRUIDTime = async (id: string) => api.apiGetTonieboxLastRUIDTime(id);

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

        if (!noLastRuid) {
            fetchTonieboxes();
        }

        const fetchShowSourceInfo = async () => {
            const response = await api.apiGetTeddyCloudSettingRaw("frontend.split_model_content");
            setShowSourceInfo((await response.text()) === "true");
        };
        fetchShowSourceInfo();
    }, [noLastRuid]);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const tonieRUID = searchParams.get("tonieRUID");
        if (tonieRUID) {
            filterActions.setSearchText(tonieRUID);
            setCollapsed(false);
            setUrlFilterPending(true);
        }
        setListKey((prevKey) => prevKey + 1);
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search, ruidHash]);

    useEffect(() => {
        if (!urlFilterPending) return;

        handleApplyFilters();
        setUrlFilterPending(false);
        setCurrentPage(1);
        setTimeout(() => scrollToTop((!collapsed && toniesListRef.current) || undefined), 0);
    }, [urlFilterPending, filterState.searchText]);

    // keep selection consistent with current base list (filtered + local)
    useEffect(() => {
        const baseRuidSet = new Set(getBaseList().map((t) => t.ruid));
        setSelectedTonies((prev) => prev.filter((ruid) => baseRuidSet.has(ruid)));
    }, [filteredTonies, tonieCards]);

    useEffect(() => {
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
    }, [pageSize, paginationEnabled, showAll]);

    useEffect(() => {
        handlePageSizeChange(1, pageSize);
    }, [pageSize]);

    useEffect(() => {
        if (!selectionMode) {
            setSelectedTonies([]);
        }
    }, [selectionMode]);

    // ------------------------
    // Handlers – update / hide single card
    // ------------------------

    const handleUpdate = (updatedTonieCard: TonieCardProps) => {
        setFilteredTonies((prev) =>
            prev.map((tonie) => (tonie.ruid === updatedTonieCard.ruid ? updatedTonieCard : tonie))
        );
        onToniesCardUpdate?.(updatedTonieCard);
        setListKey((prevKey) => prevKey + 1);
    };

    const handleHideTonieCard = (ruid: string) => {
        filterActions.hideTonieCard(ruid);
        setSelectedTonies((prevMarked) => prevMarked.filter((m) => m !== ruid));
        setListKey((prevKey) => prevKey + 1);
    };

    // ------------------------
    // Handlers – pagination
    // ------------------------

    const handleShowAll = (size?: number) => {
        const effectiveSize = size ?? pageSize;
        setPageSize(effectiveSize);
        setListKey((prevKey) => prevKey + 1);
        setShowAll(true);
        setPaginationEnabled(false);
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
        setTimeout(() => scrollToTop((!collapsed && toniesListRef.current) || undefined), 0);
    };

    // ------------------------
    // Handlers – selection / filters
    // ------------------------

    const toggleSelectTonie = (ruid: string) => {
        setSelectedTonies((prev) => (prev.includes(ruid) ? prev.filter((id) => id !== ruid) : [...prev, ruid]));
    };

    const handleApplyFilters = () => {
        setCurrentPage(1);
        setListKey((prevKey) => prevKey + 1);
        filterActions.applyFilters();
    };

    const handleResetFilters = () => {
        filterActions.resetFilters();
        const urlWithoutParams = window.location.pathname;
        window.history.pushState({}, "", urlWithoutParams);
        location.search = "";
        setCollapsed(true);
        setCurrentPage(1);
        setListKey((prevKey) => prevKey + 1);
    };

    // ------------------------
    // Menus – selection / export / bulk actions
    // ------------------------

    const selectionMenu = [
        {
            key: "unselect-all",
            label: t("tonies.selectMode.unselectAll"),
            onClick: () => setSelectedTonies([]),
        },
    ];

    const exportMenu = [
        {
            key: "json",
            label: t("tonies.selectMode.exportToJson"),
            onClick: () => exportToJSON(tonieCards, selectedTonies, t),
        },
        {
            key: "html",
            label: t("tonies.selectMode.exportToHtml"),
            onClick: () => exportToHTML(tonieCards, selectedTonies, false, t),
        },
        {
            key: "html-inline",
            label: t("tonies.selectMode.exportToHtmlInline"),
            onClick: () => exportToHTML(tonieCards, selectedTonies, true, t),
        },
        {
            key: "complete-info-json",
            label: t("tonies.selectMode.exportCompleteInfoToJson"),
            onClick: () => exportCompleteInfoToJSON(tonieCards, selectedTonies),
        },
    ];

    const actionMenu = [
        {
            key: "unset-no-cloud",
            label: t("tonies.selectMode.unsetNoCloud"),
            onClick: () => setNoCloud(tonieCards, selectedTonies, t, overlay, addNotification, false, handleUpdate),
        },
        {
            key: "set-live",
            label: t("tonies.selectMode.setLive"),
            onClick: () => setLiveFlag(tonieCards, selectedTonies, t, overlay, addNotification, true, handleUpdate),
        },
        {
            key: "unset-live",
            label: t("tonies.selectMode.unsetLive"),
            onClick: () => setLiveFlag(tonieCards, selectedTonies, t, overlay, addNotification, false, handleUpdate),
        },
        {
            key: "hide",
            label: t("tonies.selectMode.hideSelectedTags"),
            onClick: () =>
                hideSelectedTonies(
                    tonieCards,
                    selectedTonies,
                    t,
                    overlay,
                    addNotification,
                    handleHideTonieCard,
                    (label) => showHideTonieConfirm(t, label)
                ),
        },
    ];

    // ------------------------
    // Helpers – paging & counts
    // ------------------------

    const getCurrentPageData = () => {
        const base = getBaseList();

        if (showAll) {
            return base;
        } else {
            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            return base.slice(startIndex, endIndex);
        }
    };

    const totalCount = getBaseList().length;

    const listPagination = (
        <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap" }}>
            {!paginationEnabled ? (
                <Button onClick={handleShowPagination}>{t("tonies.tonies.showPagination")}</Button>
            ) : (
                <ToniesPagination
                    currentPage={currentPage}
                    onChange={handlePageSizeChange}
                    total={totalCount}
                    pageSize={pageSize}
                    additionalButtonOnClick={() => handleShowAll()}
                />
            )}
        </div>
    );

    // ------------------------
    // Handlers – filter CRUD
    // ------------------------

    const handleSaveFilter = (name: string) => {
        if (!name) return;
        saveFilterSettings(name);
        addNotification(
            NotificationTypeEnum.Success,
            t("tonies.messages.filterSaved"),
            t("tonies.messages.filterSavedDetails", { name }),
            t("tonies.title")
        );
        const stored = JSON.parse(localStorage.getItem("tonieFilters") || "{}") as Record<string, ToniesFilterSettings>;
        setExistingFilters(stored);
    };

    const handleLoadFilter = (name: string) => {
        if (!name) return;
        const ok = loadFilterSettings(name);
        if (!ok) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.noFilterFound"),
                t("tonies.messages.noFilterFoundWithName", { name }),
                t("tonies.title")
            );
            return;
        }
        setCurrentPage(1);
        setListKey((prevKey) => prevKey + 1);
    };

    const handleDeleteFilter = (name: string) => {
        if (!name) return;
        const ok = deleteFilter(name);
        if (!ok) return;
        const stored = JSON.parse(localStorage.getItem("tonieFilters") || "{}") as Record<string, ToniesFilterSettings>;
        setExistingFilters(stored);
        setFilterName("");
        addNotification(
            NotificationTypeEnum.Success,
            t("tonies.messages.filterDeleted"),
            t("tonies.messages.filterDeletedDetails", { name }),
            t("tonies.title")
        );
    };

    // ------------------------
    // Render helpers
    // ------------------------

    const listActions = (
        <div style={{ marginBottom: 8 }}>
            <ToniesFilterPanel
                state={{
                    ...filterState,
                    filterName,
                }}
                actions={{
                    ...filterActions,
                    setFilterName,
                    applyFilters: handleApplyFilters,
                    resetFilters: handleResetFilters,
                }}
                existingFilters={existingFilters}
                onSaveFilter={handleSaveFilter}
                onLoadFilter={handleLoadFilter}
                onDeleteFilter={handleDeleteFilter}
                showFilter={showFilter}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
            />
            <div className="selectionPanel">
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        flexWrap: "wrap",
                        alignItems: "baseline",
                        marginTop: 8,
                    }}
                >
                    <div style={{ fontSize: "small", textWrap: "nowrap" }}>
                        {selectionMode && (
                            <div style={{ marginBottom: 8 }}>
                                {selectedTonies.length} {t("tonies.selectMode.selected")}
                            </div>
                        )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <Tooltip
                            open={!canHover ? false : undefined}
                            title={
                                selectionMode
                                    ? t("tonies.selectMode.cancelButtonTooltip")
                                    : t("tonies.selectMode.selectButtonTooltip")
                            }
                        >
                            <Button size="small" type="default" onClick={() => setSelectionMode(!selectionMode)}>
                                {selectionMode ? t("tonies.cancel") : t("tonies.selectMode.select")}
                            </Button>
                        </Tooltip>
                    </div>
                </div>
                {selectionMode && (
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            justifyContent: "flex-start",
                            flexWrap: "wrap",
                        }}
                    >
                        <Space.Compact>
                            <Button
                                size="small"
                                style={{ width: "unset" }}
                                onClick={() => setSelectedTonies(getBaseList().map((c) => c.ruid))}
                            >
                                {t("tonies.selectMode.selectAll")}
                            </Button>
                            <Dropdown menu={{ items: selectionMenu }} placement="bottomRight">
                                <Button size="small" style={{ width: "unset" }}>
                                    <EllipsisOutlined />
                                </Button>
                            </Dropdown>
                        </Space.Compact>
                        <Space.Compact>
                            <Button
                                size="small"
                                style={{ width: "unset" }}
                                onClick={() =>
                                    setNoCloud(
                                        tonieCards,
                                        selectedTonies,
                                        t,
                                        overlay,
                                        addNotification,
                                        true,
                                        handleUpdate
                                    )
                                }
                                disabled={selectedTonies.length === 0}
                            >
                                {t("tonies.selectMode.setNoCloud")}
                            </Button>{" "}
                            <Dropdown
                                menu={{ items: actionMenu }}
                                disabled={selectedTonies.length === 0}
                                placement="bottomRight"
                            >
                                <Button size="small" style={{ width: "unset" }} disabled={selectedTonies.length === 0}>
                                    <EllipsisOutlined />
                                </Button>
                            </Dropdown>
                        </Space.Compact>
                        <Space.Compact>
                            <Button
                                size="small"
                                style={{ width: "unset" }}
                                onClick={() => exportToCSV(tonieCards, selectedTonies, t)}
                                disabled={selectedTonies.length === 0}
                            >
                                {t("tonies.selectMode.exportCsv")}
                            </Button>
                            <Dropdown
                                menu={{ items: exportMenu }}
                                disabled={selectedTonies.length === 0}
                                placement="bottomRight"
                            >
                                <Button size="small" style={{ width: "unset" }} disabled={selectedTonies.length === 0}>
                                    <EllipsisOutlined />
                                </Button>
                            </Dropdown>
                        </Space.Compact>
                    </div>
                )}
            </div>
        </div>
    );

    const noDataTonies = (
        <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
                <div>
                    <p>{t("tonies.noData")}</p>
                    {tonieCards.length === 0 && <p>{t("tonies.noDataText")}</p>}
                </div>
            }
        />
    );

    const currentPageData = getCurrentPageData();

    // ------------------------
    // Render
    // ------------------------

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="tonies-list-container" style={{ marginTop: 8 }}>
            {!readOnly ? listActions : null}

            <Flex ref={toniesListRef} vertical gap={16} key={listKey}>
                {showPagination && listPagination}

                {currentPageData.length === 0 ? (
                    <div style={{ textAlign: "center", width: "100%" }}>{noDataTonies}</div>
                ) : (
                    <Flex wrap gap={16}>
                        {currentPageData.map((tonie) => (
                            <div
                                key={tonie.ruid}
                                id={tonie.ruid}
                                style={{
                                    flex: `0 0 calc(${100 / columns}% - 16px)`,
                                    maxWidth: `calc(${100 / columns}% - 16px)`,
                                }}
                            >
                                <TonieCard
                                    tonieCard={tonie}
                                    lastRUIDs={lastTonieboxRUIDs}
                                    overlay={overlay}
                                    readOnly={readOnly}
                                    defaultLanguage={defaultLanguage}
                                    showSourceInfo={showSourceInfo}
                                    onHide={handleHideTonieCard}
                                    onUpdate={handleUpdate}
                                    selectionMode={selectionMode}
                                    selected={selectedTonies.includes(tonie.ruid)}
                                    onToggleSelect={toggleSelectTonie}
                                />
                            </div>
                        ))}
                    </Flex>
                )}

                {showPagination && listPagination}
            </Flex>
        </div>
    );
};
