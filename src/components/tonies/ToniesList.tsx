import {
    AutoComplete,
    Button,
    Collapse,
    CollapseProps,
    Divider,
    Dropdown,
    Empty,
    Input,
    List,
    MenuProps,
    Select,
    Switch,
    Tooltip,
    theme,
} from "antd";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import HelpModal from "../../components/utils/ToniesHelpModal";

import { TonieCardProps } from "../../types/tonieTypes";

import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

import { QuestionCircleOutlined, SearchOutlined, WarningOutlined } from "@ant-design/icons";
import { TonieCard } from "../../components/tonies/TonieCard";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { scrollToTop } from "../../utils/browserUtils";
import { languageOptions } from "../../utils/languageUtil";
import CustomFilterHelpModal from "../utils/CustomFilterHelpModal";
import LoadingSpinner from "../utils/LoadingSpinner";
import { hideSelectedTonies, setLiveFlag, setNoCloud } from "../utils/ToniesListActionsUtils";
import { exportCompleteInfoToJSON, exportToCSV, exportToHTML, exportToJSON } from "../utils/ToniesListExportUtils";
import ToniesPagination from "./ToniesPagination";

const { useToken } = theme;

const api = new TeddyCloudApi(defaultAPIConfig());
const STORAGE_KEY = "toniesListState";

const { Option } = Select;

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
    const { token } = useToken();
    const { addNotification } = useTeddyCloud();

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
    const [customFilter, setCustomFilter] = useState("");
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
    const [showSourceInfo, setShowSourceInfo] = useState<boolean>(false);
    const [selectedTonies, setSelectedTonies] = useState<string[]>([]);
    const [selectionMode, setSelectionMode] = useState<boolean>(false);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isCustomFilterHelpOpen, setIsCustomFilterHelpOpen] = useState(false);
    const [customFilterValid, setCustomFilterValid] = useState(true);
    const [customFilterError, setCustomFilterError] = useState<string | undefined>(undefined);
    const [customFilterOptions, setCustomFilterOptions] = useState<{ value: string }[]>([]);

    const handleUpdateCard = (updatedCard: TonieCardProps) => {
        setFilteredTonies((prev) => prev.map((c) => (c.ruid === updatedCard.ruid ? updatedCard : c)));
        setListKey((prevKey) => prevKey + 1);
    };

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
        if (!noLastRuid) {
            fetchTonieboxes();
        }
        const fetchShowSourceInfo = async () => {
            const response = await api.apiGetTeddyCloudSettingRaw("frontend.split_model_content");
            setShowSourceInfo((await response.text()) === "true" ? true : false);
        };
        fetchShowSourceInfo();
    }, []);

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

    useEffect(() => {
        if (!selectionMode) {
            setSelectedTonies([]);
        }
    }, [selectionMode]);

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

    const debounceRef = useRef<number | undefined>(undefined);

    const handleCustomFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCustomFilter(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = window.setTimeout(() => {
            try {
                const { valid, error } = validateCustomFilter(value); // your validator function
                setCustomFilterValid(valid);
                setCustomFilterError(error);
            } catch (err) {
                setCustomFilterValid(false);
                setCustomFilterError("Invalid filter expression");
            }
        }, 500);
    };

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    const FIELD_ACCESSORS: Record<string, (t: TonieCardProps) => any> = {
        series: (t) => t.sourceInfo?.series || t.tonieInfo.series || "",
        episode: (t) => t.sourceInfo?.episode || t.tonieInfo.episode || "",
        model: (t) => t.sourceInfo?.model || t.tonieInfo.model || "",
        language: (t) => t.sourceInfo?.language || t.tonieInfo.language || "",
        picture: (t) => t.sourceInfo?.picture || t.tonieInfo.picture || "",
        exists: (t) => t.exists,
        valid: (t) => t.valid,
        live: (t) => t.live,
        nocloud: (t) => t.nocloud,
        uid: (t) => t.uid,
        ruid: (t) => t.ruid,
        claimed: (t) => t.claimed,
        hasCloudAuth: (t) => t.hasCloudAuth,
        source: (t) => t.source,
        tracks: (t) => (t.sourceInfo?.tracks || t.tonieInfo?.tracks || []) as string[],
        trackseconds: (t) => (t.trackSeconds || []) as number[],
    };
    const VALID_FIELDS = Object.keys(FIELD_ACCESSORS).filter((f) => f !== "trackseconds");
    const VALID_OPERATORS = ["&&", "||", "!", "(", ")", "==", "!=", "~", ">", "<", ">=", "<="];
    const LOGICALS = ["and", "or"];
    const FUNCTIONS = [
        "unique(series)",
        "unique(episode)",
        "unique(model)",
        "tracksecondscount",
        "trackcount",
        "track",
    ];

    const handleCustomFilterSearch = (value: string) => {
        const options = getCustomFilterCompletions(value).map((v) => ({ value: v }));
        setCustomFilterOptions(options);
    };

    const handleCustomFilterSelect = (selection: string) => {
        const newValue = customFilter.replace(/([^\s()]+)$/, selection);
        const updatedFilter = newValue + " ";
        setCustomFilter(updatedFilter);

        const result = validateCustomFilter(updatedFilter);
        setCustomFilterValid(result.valid);
    };

    const getCustomFilterCompletions = (input: string) => {
        const trimmed = input.trim();
        if (!trimmed) return [...VALID_FIELDS, ...LOGICALS, ...FUNCTIONS];

        const lastTokenMatch = trimmed.match(/([^\s()]+)$/);
        let lastToken = lastTokenMatch ? lastTokenMatch[1] : "";

        const completions: string[] = [];

        const negationMatch = lastToken.match(/^!(\w*)$/);
        const isNegated = !!negationMatch;
        if (isNegated) lastToken = negationMatch[1];

        const matchingFields = VALID_FIELDS.filter((f) => f.startsWith(lastToken));
        completions.push(...matchingFields);
        completions.push(...LOGICALS.filter((l) => l.startsWith(lastToken)));
        completions.push(...FUNCTIONS.filter((f) => f.startsWith(lastToken)));

        if (VALID_FIELDS.includes(lastToken)) {
            const field = lastToken;

            if (["exists", "valid", "live", "nocloud", "claimed", "hasCloudAuth"].includes(field)) {
                // do nothing
            } else if (field === "tracks") {
                completions.push("=", "!=", "~");
            } else if (["trackseconds", "trackcount", "tracksecondscount"].includes(field)) {
                completions.push("=", "!=", ">", "<", ">=", "<=");
            } else {
                completions.push("=", "!=", "~");
            }
        }

        if (/^!?\s*unique\($/.test(lastTokenMatch ? lastTokenMatch[0] : "")) {
            completions.push("series)", "episode)", "model)");
        }

        if (isNegated) {
            return completions.map((c) =>
                ["exists", "valid", "live", "nocloud", "claimed", "hasCloudAuth"].includes(c) ? `!${c}` : c
            );
        }

        return completions;
    };

    function applyCustomFilter(tonie: TonieCardProps, query: string): boolean {
        if (!query.trim()) return true;

        type UniqueField = "series" | "episode" | "model";
        const checkUnique = (t: TonieCardProps, field: UniqueField) => {
            const value = FIELD_ACCESSORS[field](t);
            return uniquenessMaps[field][value] === true;
        };

        try {
            let expr = query.replace(/\band\b/gi, "&&").replace(/\bor\b/gi, "||");

            const tokenRegex =
                /(!?unique\(\s*\w+\s*\))|([a-zA-Z_]\w*(\s*\~\s*)(?:"[^"]*"|'[^']*'|[^\s()]+))|([a-zA-Z_]\w*\s*(!?=)\s*(?:"[^"]*"|'[^']*'|[^\s()]+))|([a-zA-Z_]\w*\s*(>=|<=|>|<|=|!=)\s*\d+)|(![a-zA-Z_]\w*)|(\b[a-zA-Z_]\w*\b)|(\(|\)|&&|\|\|)/g;
            const tokens = expr.match(tokenRegex) ?? [];

            const mappedTokens = tokens.map((token) => {
                token = token.trim();

                // 1) parentheses and logical operators remain as-is
                if (["(", ")", "&&", "||"].includes(token)) return token;

                // 2) negation !field
                let m = token.match(/^!(\w+)$/);
                if (m && FIELD_ACCESSORS[m[1]]) return `!FIELD_ACCESSORS["${m[1]}"](tonie)`;

                // 3) tracks

                // 3.1) tracks~"pattern"
                m = token.match(/^tracks~(?:"([^"]*)"|'([^']*)'|(.*))$/);
                if (m) {
                    const pattern = m[1] ?? m[2] ?? m[3] ?? "";
                    const safePattern = JSON.stringify(pattern);
                    return `FIELD_ACCESSORS["tracks"](tonie).some(track => new RegExp(${safePattern}, "i").test(track))`;
                }

                // 3.2) track="ExactTrackName"
                m = token.match(/^track\s*(!?=)\s*(?:"([^"]*)"|'([^']*)'|(.*))$/);
                if (m) {
                    const operator = m[1];
                    const value = (m[2] ?? m[3] ?? m[4] ?? "").toLowerCase();
                    if (operator === "=" || operator === "==") {
                        return `FIELD_ACCESSORS["tracks"](tonie).some(track => track.toLowerCase() === ${JSON.stringify(
                            value
                        )})`;
                    } else {
                        return `!FIELD_ACCESSORS["tracks"](tonie).some(track => track.toLowerCase() === ${JSON.stringify(
                            value
                        )})`;
                    }
                }

                // 3.3) trackcount comparison
                m = token.match(/^trackcount\s*(>=|<=|>|<|=|!=)\s*(\d+)$/);
                if (m) {
                    let op = m[1] === "=" ? "==" : m[1];
                    const val = parseInt(m[2], 10);
                    return `(FIELD_ACCESSORS["tracks"](tonie).length ${op} ${val})`;
                }

                // 3.4) trackseconds count
                m = token.match(/^tracksecondscount\s*(>=|<=|>|<|=|!=)\s*(\d+)$/);
                if (m) {
                    let op = m[1] === "=" ? "==" : m[1];
                    const val = parseInt(m[2], 10);
                    return `((FIELD_ACCESSORS["trackseconds"](tonie) || []).length ${op} ${val})`;
                }

                // 3.5) tracksecondscount==trackcount
                if (token === "tracksecondscount=trackcount") {
                    return `( (FIELD_ACCESSORS["trackseconds"](tonie) || []).length === (FIELD_ACCESSORS["tracks"](tonie) || []).length )`;
                }
                if (token === "tracksecondscount!=trackcount") {
                    return `( (FIELD_ACCESSORS["trackseconds"](tonie) || []).length !== (FIELD_ACCESSORS["tracks"](tonie) || []).length )`;
                }

                // 4) regex field~"pattern"
                m = token.match(/^([a-zA-Z_]\w*)(\s*~\s*)(?:"([^"]*)"|'([^']*)'|(.*))$/);
                if (m && FIELD_ACCESSORS[m[1]]) {
                    const pattern = m[3] ?? m[4] ?? m[5] ?? "";
                    const safePattern = JSON.stringify(pattern);
                    return `new RegExp(${safePattern}, "i").test(String(FIELD_ACCESSORS["${m[1]}"](tonie) || ""))`;
                }

                // 5) equality and inequality, case-insensitive
                m = token.match(/^([a-zA-Z_]\w*)\s*(!?=)\s*(?:"([^"]*)"|'([^']*)'|(.*))$/);
                if (m && FIELD_ACCESSORS[m[1]]) {
                    const field = m[1];
                    const operator = m[2]; // '=' or '!='
                    const value = (m[3] ?? m[4] ?? m[5] ?? "").toLowerCase();
                    if (operator === "=") {
                        return `(String(FIELD_ACCESSORS["${field}"](tonie) || "").toLowerCase() === ${JSON.stringify(
                            value
                        )})`;
                    } else {
                        return `(String(FIELD_ACCESSORS["${field}"](tonie) || "").toLowerCase() !== ${JSON.stringify(
                            value
                        )})`;
                    }
                }

                // 6) unique(field)
                m = token.match(/^(!?)unique\(\s*(\w+)\s*\)$/);
                if (m) {
                    const neg = m[1] === "!";
                    const fieldName = m[2];
                    if (["series", "episode", "model"].includes(fieldName)) {
                        const call = `checkUnique(tonie, "${fieldName}")`;
                        return neg ? `!(${call})` : call;
                    }
                }

                // 7) bare boolean field
                if (FIELD_ACCESSORS[token]) return `FIELD_ACCESSORS["${token}"](tonie)`;

                // 8) fallback: keep as string literal (in case user quotes manually)
                return JSON.stringify(token);
            });

            expr = mappedTokens.join(" ");

            return Function(
                "tonie",
                "FIELD_ACCESSORS",
                "checkUnique",
                `return (${expr});`
            )(tonie, FIELD_ACCESSORS, checkUnique);
        } catch (err) {
            console.error("Custom filter error:", err);
            return false;
        }
    }

    function validateCustomFilter(input: string): { valid: boolean; error?: string } {
        if (!input.trim()) return { valid: true };

        try {
            // normalize logical operators
            let expr = input.replace(/\band\b/gi, "&&").replace(/\bor\b/gi, "||");

            // tokenization regex matching all supported token types
            const tokenRegex =
                /(!?unique\(\s*\w+\s*\))|([a-zA-Z_]\w*(\s*\~\s*)(?:"[^"]*"|'[^']*'|[^\s()]+))|([a-zA-Z_]\w*\s*(!?=)\s*(?:"[^"]*"|'[^']*'|[^\s()]+))|([a-zA-Z_]\w*\s*(>=|<=|>|<|=|!=)\s*\d+)|(![a-zA-Z_]\w*)|(\b[a-zA-Z_]\w*\b)|(\(|\)|&&|\|\|)/g;
            const tokens = expr.match(tokenRegex) ?? [];

            for (const token of tokens) {
                const tok = token.trim();

                // parentheses and logical operators are valid
                if (VALID_OPERATORS.includes(tok)) continue;

                // !field
                let m = tok.match(/^!(\w+)$/);
                if (m) {
                    if (!VALID_FIELDS.includes(m[1])) {
                        return {
                            valid: false,
                            error: t("tonies.tonies.filterBar.customFilter.unknownFieldNegation", { field: m[1] }),
                        };
                    }
                    continue;
                }

                // Add tokens for tracks/track/tracksecondscount/trackcounts/
                m = tok.match(/^tracks~(?:"([^"]*)"|'([^']*)'|(.*))$/);
                if (m) continue;

                m = tok.match(/^track\s*(!?=)\s*(?:"([^"]*)"|'([^']*)'|(.*))$/);
                if (m) continue;

                m = tok.match(/^trackcount\s*(>=|<=|>|<|=|!=)\s*\d+$/);
                if (m) continue;

                m = tok.match(/^tracksecondscount\s*(>=|<=|>|<|=|!=)\s*\d+$/);
                if (m) continue;

                if (tok === "tracksecondscount=trackcount" || tok === "tracksecondscount!=trackcount") continue;

                // field~"pattern"
                m = tok.match(/^([a-zA-Z_]\w*)(\s*~\s*)(?:"[^"]*"|'[^']*'|[^\s()]+)$/);
                if (m) {
                    if (!VALID_FIELDS.includes(m[1])) {
                        return {
                            valid: false,
                            error: t("tonies.tonies.filterBar.customFilter.unknownFieldRegex", { field: m[1] }),
                        };
                    }
                    continue;
                }

                // equality / inequality
                m = tok.match(/^([a-zA-Z_]\w*)\s*(!?=)\s*(?:"[^"]*"|'[^']*'|[^\s()]+)$/);
                if (m) {
                    if (!VALID_FIELDS.includes(m[1])) {
                        return {
                            valid: false,
                            error: t("tonies.tonies.filterBar.customFilter.unknownFieldComparison", { field: m[1] }),
                        };
                    }
                    continue;
                }

                // unique(field)
                m = tok.match(/^(!?)unique\(\s*(\w+)\s*\)$/);
                if (m) {
                    const fieldName = m[2];
                    if (!["series", "episode", "model"].includes(fieldName)) {
                        return {
                            valid: false,
                            error: t("tonies.tonies.filterBar.customFilter.invalidFieldUnique", { field: fieldName }),
                        };
                    }
                    continue;
                }

                // bare field
                if (VALID_FIELDS.includes(tok)) continue;

                // fallback invalid token
                return {
                    valid: false,
                    error: t("tonies.tonies.filterBar.customFilter.invalidToken", { token: tok }),
                };
            }

            return { valid: true };
        } catch (err) {
            return { valid: false, error: t("tonies.tonies.filterBar.customFilter.syntaxError") };
        }
    }

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
                (!invalidFilter || tonie.valid === false) &&
                (!existsFilter || tonie.exists) &&
                (!notExistsFilter || tonie.exists === false) &&
                (!liveFilter || tonie.live) &&
                (!unsetLiveFilter || tonie.live === false) &&
                (!nocloudFilter || tonie.nocloud) &&
                (!unsetNocloudFilter || tonie.nocloud === false) &&
                (!hasCloudAuthFilter || tonie.hasCloudAuth) &&
                (!unsetHasCloudAuthFilter || tonie.hasCloudAuth === false)
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
                    tonie.uid.toLowerCase().includes(searchText.toLowerCase()) ||
                    tonie.source.toLowerCase().includes(searchText.toLowerCase())
            );
        }
        if (filterLastTonieboxRUIDs) {
            // Filter by RUID part of the lastTonieboxRUIDs array
            filtered = filtered.filter((tonie) => lastTonieboxRUIDs.some(([ruid]) => ruid === tonie.ruid));
        }
        if (customFilter.trim() !== "") {
            filtered = filtered.filter((tonie) => applyCustomFilter(tonie, customFilter));
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
        setFilteredTonies((prevFiltered) => prevFiltered.filter((tonie) => tonie.ruid !== ruid));
        setHiddenRuids((prevHidden) => [...prevHidden, ruid]);
        setSelectedTonies((prevMarked) => prevMarked.filter((m) => m !== ruid));
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
        setCustomFilter("");
        setCustomFilterError(undefined);
        setCustomFilterValid(true);
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
        setListKey((prevKey) => prevKey + 1);
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
        setTimeout(() => scrollToTop(), 0);
    };

    const toggleSelectTonie = (ruid: string) => {
        setSelectedTonies((prev) => (prev.includes(ruid) ? prev.filter((id) => id !== ruid) : [...prev, ruid]));
    };
    const selectionMenu: MenuProps["items"] = [
        {
            key: "unselect-all",
            label: t("tonies.selectMode.unselectAll"),
            onClick: () => setSelectedTonies([]),
        },
    ];

    const exportMenu: MenuProps["items"] = [
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

    const actionMenu: MenuProps["items"] = [
        {
            key: "unset-no-cloud",
            label: t("tonies.selectMode.unsetNoCloud"),
            onClick: () => setNoCloud(tonieCards, selectedTonies, t, overlay, addNotification, false, handleUpdateCard),
        },
        {
            key: "set-live",
            label: t("tonies.selectMode.setLive"),
            onClick: () => setLiveFlag(tonieCards, selectedTonies, t, overlay, addNotification, true, handleUpdateCard),
        },
        {
            key: "unset-live",
            label: t("tonies.selectMode.unsetLive"),
            onClick: () =>
                setLiveFlag(tonieCards, selectedTonies, t, overlay, addNotification, false, handleUpdateCard),
        },
        {
            key: "hide",
            label: t("tonies.selectMode.hideSelectedTags"),
            onClick: () =>
                hideSelectedTonies(tonieCards, selectedTonies, t, overlay, addNotification, handleHideTonieCard),
        },
    ];

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
            <Input
                id="search-field"
                placeholder={t("tonies.tonies.filterBar.searchPlaceholder")}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ margin: "8px 0 8px 0" }}
                suffix={<SearchOutlined onMouseDown={(e) => e.preventDefault()} onClick={handleFilter} />}
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
                    <div style={{ margin: "8px 0" }}>
                        <Divider size="small" style={{ marginTop: 16 }} />
                        <label className="filter-label">{t("tonies.tonies.filterBar.customFilter.label")}</label>
                        <div style={{ display: "flex", gap: 8 }}>
                            {!customFilterValid && (
                                <Tooltip title={customFilterError} placement="right">
                                    <WarningOutlined
                                        style={{
                                            color: token.colorErrorText,
                                        }}
                                    />
                                </Tooltip>
                            )}
                            <AutoComplete
                                style={{ width: "100%", margin: "8px 0" }}
                                options={customFilterOptions}
                                value={customFilter}
                                onSelect={handleCustomFilterSelect}
                                onSearch={handleCustomFilterSearch}
                                filterOption={false}
                            >
                                <Input
                                    placeholder={t("tonies.tonies.filterBar.customFilter.placeholder")}
                                    onChange={handleCustomFilterChange}
                                    suffix={
                                        <Button
                                            icon={<QuestionCircleOutlined />}
                                            type="text"
                                            size="small"
                                            onClick={() => setIsCustomFilterHelpOpen(true)}
                                            style={{ padding: 0 }}
                                        />
                                    }
                                />
                            </AutoComplete>
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

    const listActions = (
        <>
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "baseline",
                    marginBottom: 8,
                }}
            >
                <Button size="small" icon={<QuestionCircleOutlined />} onClick={() => setIsHelpModalOpen(true)}>
                    {t("fileBrowser.help.showHelp")}
                </Button>
            </div>
            {isHelpModalOpen && (
                <HelpModal isHelpModalOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
            )}
            {isCustomFilterHelpOpen && (
                <CustomFilterHelpModal
                    visible={isCustomFilterHelpOpen}
                    onClose={() => setIsCustomFilterHelpOpen(false)}
                />
            )}
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
                        <Dropdown.Button
                            size="small"
                            style={{ width: "unset" }}
                            menu={{ items: selectionMenu }}
                            onClick={() => setSelectedTonies(tonieCards.map((c) => c.ruid))}
                        >
                            {t("tonies.selectMode.selectAll")}
                        </Dropdown.Button>
                        <Dropdown.Button
                            size="small"
                            style={{ width: "unset" }}
                            menu={{ items: actionMenu }}
                            onClick={() =>
                                setNoCloud(
                                    tonieCards,
                                    selectedTonies,
                                    t,
                                    overlay,
                                    addNotification,
                                    true,
                                    handleUpdateCard
                                )
                            }
                            disabled={selectedTonies.length === 0}
                        >
                            {t("tonies.selectMode.setNoCloud")}
                        </Dropdown.Button>
                        <Dropdown.Button
                            size="small"
                            style={{ width: "unset" }}
                            menu={{ items: exportMenu }}
                            onClick={() => exportToCSV(tonieCards, selectedTonies, t)}
                            disabled={selectedTonies.length === 0}
                        >
                            <Tooltip title={t("tonies.selectMode.exportCsvTooltip")}>
                                {t("tonies.selectMode.exportCsv")}
                            </Tooltip>
                        </Dropdown.Button>
                    </div>
                )}
            </div>
        </>
    );

    const noDataTonies = (
        <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
                <div>
                    <p>{t("tonies.noData")}</p>
                    <p>{t("tonies.noDataText")}</p>
                </div>
            }
        />
    );

    if (loading) {
        return <LoadingSpinner />;
    } else {
        return (
            <div className="tonies-list-container">
                {!readOnly ? listActions : ""}
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
                                showSourceInfo={showSourceInfo}
                                onHide={handleHideTonieCard}
                                onUpdate={handleUpdate}
                                selectionMode={selectionMode}
                                selected={selectedTonies.includes(tonie.ruid)}
                                onToggleSelect={toggleSelectTonie}
                            />
                        </List.Item>
                    )}
                    locale={{ emptyText: noDataTonies }}
                />
            </div>
        );
    }
};
