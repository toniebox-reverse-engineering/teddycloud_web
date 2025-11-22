import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { languageOptions } from "../../../../utils/languageUtil";
import type { TonieCardProps } from "../../../../types/tonieTypes";
import type { ToniesFilterActions, ToniesFilterSettings, ToniesFilterState } from "../../../../types/toniesFilterTypes";

const STORAGE_KEY_FILTERS = "tonieFilters";

type UniquenessMaps = {
    episode: Record<string, boolean>;
    series: Record<string, boolean>;
    model: Record<string, boolean>;
};

type UseToniesFilterParams = {
    tonieCards: TonieCardProps[];
    lastTonieboxRUIDs: Array<[string, string, string]>;
    uniquenessMaps: UniquenessMaps;
};

type FIELD_ACCESSOR_MAP = Record<string, (t: TonieCardProps) => any>;

const FIELD_ACCESSORS: FIELD_ACCESSOR_MAP = {
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
const LOGICALS = ["and", "or", "&&", "||"];
const FUNCTIONS = ["unique(series)", "unique(episode)", "unique(model)", "tracksecondscount", "trackcount", "track"];
const EMPTYABLE_FIELDS = ["series", "episode", "model", "source", "language", "picture"];

type ValidateResult = { valid: boolean; error?: string };

export function useToniesFilter(params: UseToniesFilterParams) {
    const { tonieCards, lastTonieboxRUIDs, uniquenessMaps } = params;
    const { t } = useTranslation();

    const [filteredTonies, setFilteredTonies] = useState<TonieCardProps[]>(tonieCards);
    const [state, setState] = useState<ToniesFilterState>({
        seriesFilter: "",
        episodeFilter: "",
        selectedLanguages: [],
        validFilter: false,
        invalidFilter: false,
        existsFilter: false,
        notExistsFilter: false,
        liveFilter: false,
        unsetLiveFilter: false,
        nocloudFilter: false,
        unsetNocloudFilter: false,
        hasCloudAuthFilter: false,
        unsetHasCloudAuthFilter: false,
        searchText: "",
        filterLastTonieboxRUIDs: false,
        customFilter: "",
        hiddenRuids: [],
        customFilterValid: true,
        customFilterError: undefined,
        filterName: "",
    });
    const [existingFilters, setExistingFilters] = useState<Record<string, ToniesFilterSettings>>({});

    const setPartial = (patch: Partial<ToniesFilterState>) => {
        setState((prev) => ({ ...prev, ...patch }));
    };

    const getFilterSettings = (): ToniesFilterSettings => ({
        seriesFilter: state.seriesFilter,
        episodeFilter: state.episodeFilter,
        selectedLanguages: state.selectedLanguages,
        validFilter: state.validFilter,
        invalidFilter: state.invalidFilter,
        existsFilter: state.existsFilter,
        notExistsFilter: state.notExistsFilter,
        liveFilter: state.liveFilter,
        unsetLiveFilter: state.unsetLiveFilter,
        nocloudFilter: state.nocloudFilter,
        unsetNocloudFilter: state.unsetNocloudFilter,
        hasCloudAuthFilter: state.hasCloudAuthFilter,
        unsetHasCloudAuthFilter: state.unsetHasCloudAuthFilter,
        searchText: state.searchText,
        filterLastTonieboxRUIDs: state.filterLastTonieboxRUIDs,
        customFilter: state.customFilter,
        hiddenRuids: state.hiddenRuids,
    });

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_FILTERS) || "{}") as Record<
            string,
            ToniesFilterSettings
        >;
        setExistingFilters(stored);
    }, []);

    const checkUnique = (t: TonieCardProps, field: "series" | "episode" | "model") => {
        const value = FIELD_ACCESSORS[field](t);
        return uniquenessMaps[field][value] === true;
    };

    function applyCustomFilterInternal(tonie: TonieCardProps, query: string): boolean {
        if (!query.trim()) return true;

        try {
            let expr = query.replace(/\band\b/gi, "&&").replace(/\bor\b/gi, "||");

            expr = expr.replace(/(\w+)\s+is\s+not\s+empty/gi, "isnotempty($1)");
            expr = expr.replace(/(\w+)\s+is\s+empty/gi, "isempty($1)");

            const tokenRegex =
                /(!?unique\(\s*\w+\s*\))|((?:isnotempty|isempty)\(\s*\w+\s*\))|([a-zA-Z_]\w*\s+(?:startswith|endswith)\s+(?:"[^"]*"|'[^']*'|[^\s()]+))|([a-zA-Z_]\w*\s+(?:in|not\s+in)\s*\([^()]*\))|([a-zA-Z_]\w*(\s*~\s*)(?:"[^"]*"|'[^']*'|[^\s()]+))|([a-zA-Z_]\w*\s*(!?=)\s*(?:"[^"]*"|'[^']*'|[^\s()]+))|([a-zA-Z_]\w*\s*(>=|<=|>|<|=|!=)\s*\d+)|(![a-zA-Z_]\w*)|(\b[a-zA-Z_]\w*\b)|(\(|\)|&&|\|\|)/g;

            const tokens = expr.match(tokenRegex) ?? [];

            const mappedTokens = tokens.map((token) => {
                token = token.trim();

                if (["(", ")", "&&", "||"].includes(token)) return token;

                let m: RegExpMatchArray | null;

                // !field
                m = token.match(/^!(\w+)$/);
                if (m && FIELD_ACCESSORS[m[1]]) {
                    return `!FIELD_ACCESSORS["${m[1]}"](tonie)`;
                }

                // tracks~"pattern"
                m = token.match(/^tracks~(?:"([^"]*)"|'([^']*)'|(.*))$/);
                if (m) {
                    const pattern = m[1] ?? m[2] ?? m[3] ?? "";
                    const safePattern = JSON.stringify(pattern);
                    return `FIELD_ACCESSORS["tracks"](tonie).some(track => new RegExp(${safePattern}, "i").test(track))`;
                }

                // track = "name" / !=
                m = token.match(/^track\s*(!?=)\s*(?:"([^"]*)"|'([^']*)'|(.*))$/);
                if (m) {
                    const operator = m[1];
                    const value = (m[2] ?? m[3] ?? m[4] ?? "").toLowerCase();
                    const valJson = JSON.stringify(value);
                    if (operator === "=" || operator === "==") {
                        return `FIELD_ACCESSORS["tracks"](tonie).some(track => track.toLowerCase() === ${valJson})`;
                    } else {
                        return `!FIELD_ACCESSORS["tracks"](tonie).some(track => track.toLowerCase() === ${valJson})`;
                    }
                }

                // trackcount cmp number
                m = token.match(/^trackcount\s*(>=|<=|>|<|=|!=)\s*(\d+)$/);
                if (m) {
                    const op = m[1] === "=" ? "==" : m[1];
                    const val = parseInt(m[2], 10);
                    return `(FIELD_ACCESSORS["tracks"](tonie).length ${op} ${val})`;
                }

                // tracksecondscount cmp number
                m = token.match(/^tracksecondscount\s*(>=|<=|>|<|=|!=)\s*(\d+)$/);
                if (m) {
                    const op = m[1] === "=" ? "==" : m[1];
                    const val = parseInt(m[2], 10);
                    return `((FIELD_ACCESSORS["trackseconds"](tonie) || []).length ${op} ${val})`;
                }

                // tracksecondscount vs trackcount
                if (token === "tracksecondscount=trackcount") {
                    return `((FIELD_ACCESSORS["trackseconds"](tonie) || []).length === (FIELD_ACCESSORS["tracks"](tonie) || []).length)`;
                }
                if (token === "tracksecondscount!=trackcount") {
                    return `((FIELD_ACCESSORS["trackseconds"](tonie) || []).length !== (FIELD_ACCESSORS["tracks"](tonie) || []).length)`;
                }

                // field ~ "pattern"
                m = token.match(/^([a-zA-Z_]\w*)(\s*~\s*)(?:"([^"]*)"|'([^']*)'|(.*))$/);
                if (m && FIELD_ACCESSORS[m[1]]) {
                    const field = m[1];
                    const pattern = m[3] ?? m[4] ?? m[5] ?? "";
                    const safePattern = JSON.stringify(pattern);
                    return `new RegExp(${safePattern}, "i").test(String(FIELD_ACCESSORS["${field}"](tonie) || ""))`;
                }

                // field = / != "value"
                m = token.match(/^([a-zA-Z_]\w*)\s*(!?=)\s*(?:"([^"]*)"|'([^']*)'|(.*))$/);
                if (m && FIELD_ACCESSORS[m[1]]) {
                    const field = m[1];
                    const operator = m[2];
                    const value = (m[3] ?? m[4] ?? m[5] ?? "").toLowerCase();
                    const valJson = JSON.stringify(value);
                    if (operator === "=" || operator === "==") {
                        return `(String(FIELD_ACCESSORS["${field}"](tonie) || "").toLowerCase() === ${valJson})`;
                    } else {
                        return `(String(FIELD_ACCESSORS["${field}"](tonie) || "").toLowerCase() !== ${valJson})`;
                    }
                }

                // unique(field) / !unique(field)
                m = token.match(/^(!?)unique\(\s*(\w+)\s*\)$/);
                if (m) {
                    const neg = m[1] === "!";
                    const fieldName = m[2] as "series" | "episode" | "model";
                    if (["series", "episode", "model"].includes(fieldName)) {
                        const call = `checkUnique(tonie, "${fieldName}")`;
                        return neg ? `!(${call})` : call;
                    }
                }

                // isempty(field) / isnotempty(field)
                m = token.match(/^(isnotempty|isempty)\(\s*(\w+)\s*\)$/);
                if (m) {
                    const func = m[1];
                    const fieldName = m[2];
                    if (FIELD_ACCESSORS[fieldName]) {
                        const exprBase = `String(FIELD_ACCESSORS["${fieldName}"](tonie) ?? "")`;
                        if (func === "isempty") {
                            return `(${exprBase}.length === 0)`;
                        } else {
                            return `(${exprBase}.length > 0)`;
                        }
                    }
                }

                // startswith / endswith
                m = token.match(/^([a-zA-Z_]\w*)\s+(startswith|endswith)\s+(?:"([^"]*)"|'([^']*)'|([^\s()]+))$/i);
                if (m && FIELD_ACCESSORS[m[1]]) {
                    const field = m[1];
                    const op = m[2].toLowerCase();
                    const rawVal = m[3] ?? m[4] ?? m[5] ?? "";
                    const safe = JSON.stringify(rawVal.toLowerCase());
                    const base = `String(FIELD_ACCESSORS["${field}"](tonie) || "").toLowerCase()`;
                    if (op === "startswith") {
                        return `(${base}.startsWith(${safe}))`;
                    } else {
                        return `(${base}.endsWith(${safe}))`;
                    }
                }

                // in(...) / not in(...)
                m = token.match(/^([a-zA-Z_]\w*)\s+(in|not\s+in)\s*\(([^)]*)\)$/i);
                if (m && FIELD_ACCESSORS[m[1]]) {
                    const field = m[1];
                    const op = m[2].toLowerCase();
                    const rawList = m[3]
                        .split(",")
                        .map((s) => s.trim().replace(/^"|"$/g, "").replace(/^'|'$/g, ""))
                        .filter((s) => s.length > 0);
                    const arrayLiteral = JSON.stringify(rawList.map((x) => x.toLowerCase()));
                    const valueExpr = `String(FIELD_ACCESSORS["${field}"](tonie) || "").toLowerCase()`;
                    if (op === "in") {
                        return `(${arrayLiteral}.includes(${valueExpr}))`;
                    } else {
                        return `(!${arrayLiteral}.includes(${valueExpr}))`;
                    }
                }

                // nackte Feldnamen
                if (FIELD_ACCESSORS[token]) {
                    return `FIELD_ACCESSORS["${token}"](tonie)`;
                }

                // Default: Literal
                return JSON.stringify(token);
            });

            expr = mappedTokens.join(" ");

            // eslint-disable-next-line no-new-func
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

    function validateCustomFilterInternal(input: string): ValidateResult {
        if (!input.trim()) return { valid: true };

        try {
            let expr = input.replace(/\band\b/gi, "&&").replace(/\bor\b/gi, "||");

            expr = expr.replace(/(\w+)\s+is\s+not\s+empty/gi, "isnotempty($1)");
            expr = expr.replace(/(\w+)\s+is\s+empty/gi, "isempty($1)");

            const tokenRegex =
                /(!?unique\(\s*\w+\s*\))|((?:isnotempty|isempty)\(\s*\w+\s*\))|([a-zA-Z_]\w*\s+(?:startswith|endswith)\s+(?:"[^"]*"|'[^']*'|[^\s()]+))|([a-zA-Z_]\w*\s+(?:in|not\s+in)\s*\([^()]*\))|([a-zA-Z_]\w*(\s*~\s*)(?:"[^"]*"|'[^']*'|[^\s()]+))|([a-zA-Z_]\w*\s*(!?=)\s*(?:"[^"]*"|'[^']*'|[^\s()]+))|([a-zA-Z_]\w*\s*(>=|<=|>|<|=|!=)\s*\d+)|(![a-zA-Z_]\w*)|(\b[a-zA-Z_]\w*\b)|(\(|\)|&&|\|\|)/g;

            const tokens = expr.match(tokenRegex) ?? [];

            for (const token of tokens) {
                const tok = token.trim();
                let m: RegExpMatchArray | null;

                if (VALID_OPERATORS.includes(tok)) continue;

                // !field
                m = tok.match(/^!(\w+)$/);
                if (m) {
                    if (!VALID_FIELDS.includes(m[1])) {
                        return {
                            valid: false,
                            error: t("tonies.tonies.filterBar.customFilter.unknownFieldNegation", { field: m[1] }),
                        };
                    }
                    continue;
                }

                // tracks~...
                m = tok.match(/^tracks~(?:"([^"]*)"|'([^']*)'|(.*))$/);
                if (m) continue;

                // track = / != ...
                m = tok.match(/^track\s*(!?=)\s*(?:"([^"]*)"|'([^']*)'|(.*))$/);
                if (m) continue;

                // trackcount cmp number
                m = tok.match(/^trackcount\s*(>=|<=|>|<|=|!=)\s*\d+$/);
                if (m) continue;

                // tracksecondscount cmp number
                m = tok.match(/^tracksecondscount\s*(>=|<=|>|<|=|!=)\s*\d+$/);
                if (m) continue;

                if (tok === "tracksecondscount=trackcount" || tok === "tracksecondscount!=trackcount") continue;

                // field ~ "..."
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

                // field cmp "..."
                m = tok.match(/^([a-zA-Z_]\w*)\s*(!?=)\s*(?:"[^"]*"|'([^']*)'|[^\s()]+)$/);
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

                // isempty / isnotempty
                m = tok.match(/^(isnotempty|isempty)\(\s*(\w+)\s*\)$/);
                if (m) {
                    const fieldName = m[2];
                    if (!EMPTYABLE_FIELDS.includes(fieldName)) {
                        return {
                            valid: false,
                            error: t("tonies.tonies.filterBar.customFilter.invalidFieldUnique", { field: fieldName }),
                        };
                    }
                    continue;
                }

                // startswith / endswith
                m = tok.match(/^([a-zA-Z_]\w*)\s+(startswith|endswith)\s+(?:"[^"]*"|'[^']*'|[^\s()]+)$/i);
                if (m) {
                    if (!VALID_FIELDS.includes(m[1])) {
                        return {
                            valid: false,
                            error: t("tonies.tonies.filterBar.customFilter.unknownFieldComparison", { field: m[1] }),
                        };
                    }
                    continue;
                }

                // in(...) / not in(...)
                m = tok.match(/^([a-zA-Z_]\w*)\s+(in|not\s+in)\s*\(([^)]*)\)$/i);
                if (m) {
                    if (!VALID_FIELDS.includes(m[1])) {
                        return {
                            valid: false,
                            error: t("tonies.tonies.filterBar.customFilter.unknownFieldComparison", { field: m[1] }),
                        };
                    }
                    continue;
                }

                if (VALID_FIELDS.includes(tok)) continue;

                return {
                    valid: false,
                    error: t("tonies.tonies.filterBar.customFilter.invalidToken", { token: tok }),
                };
            }

            return { valid: true };
        } catch {
            return { valid: false, error: t("tonies.tonies.filterBar.customFilter.syntaxError") };
        }
    }

    const suggestionsAfterField = (field: string): string[] => {
        if (["exists", "valid", "live", "nocloud", "claimed", "hasCloudAuth"].includes(field)) {
            return [...LOGICALS];
        }

        const ops: string[] = [];

        // generic comparisons
        ops.push("=", "!=", "~", ">", "<", ">=", "<=");

        // is empty / is not empty
        if (EMPTYABLE_FIELDS.includes(field)) {
            ops.push("is empty", "is not empty");
        }

        // startswith / endswith
        ops.push("startswith", "endswith");

        // in(...) / not in(...)
        ops.push("in (", "not in (");

        return ops;
    };

    const getCustomFilterCompletionsInternal = (input: string): string[] => {
        const endsWithSpace = /\s$/.test(input);
        const trimmed = input.trim();

        if (!trimmed) {
            return [...VALID_FIELDS, ...LOGICALS, ...FUNCTIONS];
        }

        const tokens = trimmed.split(/\s+/);
        const lastToken = tokens[tokens.length - 1];
        const prevToken = tokens.length > 1 ? tokens[tokens.length - 2] : null;

        if (/^!?\s*unique\($/.test(lastToken)) {
            return ["series)", "episode)", "model)"];
        }

        if (endsWithSpace) {
            const prev = lastToken;

            if (VALID_FIELDS.includes(prev)) {
                return suggestionsAfterField(prev);
            }

            if (LOGICALS.includes(prev.toLowerCase())) {
                return [...VALID_FIELDS, "!", "("];
            }

            if (prev === "(") {
                return [...VALID_FIELDS, "!", "("];
            }

            if (prev === ")") {
                return [...LOGICALS];
            }

            return [...VALID_FIELDS, ...LOGICALS, ...FUNCTIONS];
        }

        let current = lastToken;
        let previous = prevToken;

        const negationMatch = current.match(/^!(\w*)$/);
        const isNegated = !!negationMatch;
        if (isNegated) current = negationMatch[1];

        const prefix = current.toLowerCase();
        const result: string[] = [];

        if (!previous) {
            result.push(...VALID_FIELDS.filter((f) => f.toLowerCase().startsWith(prefix)));
            result.push(...LOGICALS.filter((l) => l.toLowerCase().startsWith(prefix)));
            result.push(...FUNCTIONS.filter((f) => f.toLowerCase().startsWith(prefix)));
        } else if (VALID_FIELDS.includes(previous)) {
            const ops = suggestionsAfterField(previous);
            result.push(...ops.filter((op) => op.toLowerCase().startsWith(prefix)));
        } else if (LOGICALS.includes(previous.toLowerCase())) {
            result.push(...VALID_FIELDS.filter((f) => f.toLowerCase().startsWith(prefix)));
        } else {
            result.push(...VALID_FIELDS.filter((f) => f.toLowerCase().startsWith(prefix)));
            result.push(...LOGICALS.filter((l) => l.toLowerCase().startsWith(prefix)));
            result.push(...FUNCTIONS.filter((f) => f.toLowerCase().startsWith(prefix)));
        }

        if (/^!?\s*unique\($/.test(current)) {
            result.push("series)", "episode)", "model)");
        }

        const unique = Array.from(new Set(result));

        if (isNegated) {
            return unique.map((c) =>
                ["exists", "valid", "live", "nocloud", "claimed", "hasCloudAuth"].includes(c) ? `!${c}` : c
            );
        }

        return unique;
    };

    const applyFiltersInternal = (overrides?: Partial<ToniesFilterSettings>) => {
        const base = getFilterSettings();
        const effective: ToniesFilterSettings = { ...base, ...overrides };

        let filtered = tonieCards.filter(
            (tonie) =>
                ((tonie.sourceInfo?.series &&
                    tonie.sourceInfo.series.toLowerCase().includes(effective.seriesFilter.toLowerCase())) ||
                    tonie.tonieInfo.series.toLowerCase().includes(effective.seriesFilter.toLowerCase())) &&
                ((tonie.sourceInfo?.episode &&
                    tonie.sourceInfo.episode.toLowerCase().includes(effective.episodeFilter.toLowerCase())) ||
                    tonie.tonieInfo.episode.toLowerCase().includes(effective.episodeFilter.toLowerCase())) &&
                (effective.selectedLanguages.length === 0 ||
                    effective.selectedLanguages.includes(
                        tonie.tonieInfo.language !== undefined
                            ? languageOptions.includes(tonie.tonieInfo.language)
                                ? tonie.tonieInfo.language
                                : "undefined"
                            : "undefined"
                    ) ||
                    effective.selectedLanguages.includes(
                        tonie.sourceInfo && tonie.sourceInfo.language !== undefined
                            ? languageOptions.includes(tonie.sourceInfo.language)
                                ? tonie.sourceInfo.language
                                : "undefined"
                            : "undefined"
                    )) &&
                (!effective.validFilter || tonie.valid) &&
                (!effective.invalidFilter || tonie.valid === false) &&
                (!effective.existsFilter || tonie.exists) &&
                (!effective.notExistsFilter || tonie.exists === false) &&
                (!effective.liveFilter || tonie.live) &&
                (!effective.unsetLiveFilter || tonie.live === false) &&
                (!effective.nocloudFilter || tonie.nocloud) &&
                (!effective.unsetNocloudFilter || tonie.nocloud === false) &&
                (!effective.hasCloudAuthFilter || tonie.hasCloudAuth) &&
                (!effective.unsetHasCloudAuthFilter || tonie.hasCloudAuth === false)
        );

        if (effective.searchText) {
            const q = effective.searchText.toLowerCase();
            filtered = filtered.filter(
                (tonie) =>
                    tonie.tonieInfo.series.toLowerCase().includes(q) ||
                    (tonie.sourceInfo?.series && tonie.sourceInfo.series.toLowerCase().includes(q)) ||
                    tonie.tonieInfo.episode.toLowerCase().includes(q) ||
                    (tonie.sourceInfo?.episode && tonie.sourceInfo.episode.toLowerCase().includes(q)) ||
                    tonie.tonieInfo.model.toLowerCase().includes(q) ||
                    (tonie.sourceInfo?.model && tonie.sourceInfo.model.toLowerCase().includes(q)) ||
                    tonie.ruid.toLowerCase().includes(q) ||
                    tonie.uid.toLowerCase().includes(q) ||
                    tonie.source.toLowerCase().includes(q)
            );
        }

        if (effective.filterLastTonieboxRUIDs) {
            filtered = filtered.filter((tonie) => (lastTonieboxRUIDs ?? []).some(([ruid]) => ruid === tonie.ruid));
        }

        if (effective.customFilter.trim() !== "") {
            filtered = filtered.filter((tonie) => applyCustomFilterInternal(tonie, effective.customFilter));
        }

        if (effective.hiddenRuids && effective.hiddenRuids.length > 0) {
            filtered = filtered.filter((tonie) => !effective.hiddenRuids.includes(tonie.ruid));
        }
        setFilteredTonies(filtered);
    };

    const validateCustomFilter = (input: string) => {
        const result = validateCustomFilterInternal(input);
        setPartial({
            customFilterValid: result.valid,
            customFilterError: result.error,
        });
    };

    const getCustomFilterCompletions = (input: string) => getCustomFilterCompletionsInternal(input);

    const resetFilters = () => {
        setState((prev) => ({
            ...prev,
            seriesFilter: "",
            episodeFilter: "",
            selectedLanguages: [],
            validFilter: false,
            invalidFilter: false,
            existsFilter: false,
            notExistsFilter: false,
            liveFilter: false,
            unsetLiveFilter: false,
            nocloudFilter: false,
            unsetNocloudFilter: false,
            hasCloudAuthFilter: false,
            unsetHasCloudAuthFilter: false,
            searchText: "",
            filterLastTonieboxRUIDs: false,
            customFilter: "",
            customFilterValid: true,
            customFilterError: undefined,
        }));
        applyFiltersInternal({
            seriesFilter: "",
            episodeFilter: "",
            selectedLanguages: [],
            validFilter: false,
            invalidFilter: false,
            existsFilter: false,
            notExistsFilter: false,
            liveFilter: false,
            unsetLiveFilter: false,
            nocloudFilter: false,
            unsetNocloudFilter: false,
            hasCloudAuthFilter: false,
            unsetHasCloudAuthFilter: false,
            searchText: "",
            filterLastTonieboxRUIDs: false,
            customFilter: "",
        });
    };

    const hideTonieCard = (ruid: string) => {
        const hiddenRuids = [...state.hiddenRuids, ruid];
        setState((prev) => ({ ...prev, hiddenRuids }));
        applyFiltersInternal({ hiddenRuids });
    };

    const saveFilterSettings = (name: string) => {
        if (!name) return;
        setExistingFilters((prev) => {
            const next = { ...prev, [name]: getFilterSettings() };
            localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(next));
            return next;
        });
    };

    const loadFilterSettings = (name: string): boolean => {
        const filter = existingFilters[name];
        if (!filter) return false;

        setState((prev) => ({
            ...prev,
            ...filter,
            customFilterValid: true,
            customFilterError: undefined,
            filterName: name,
        }));
        applyFiltersInternal(filter);
        return true;
    };

    const deleteFilter = (name: string): boolean => {
        if (!existingFilters[name]) return false;

        setExistingFilters((prev) => {
            const { [name]: _, ...next } = prev;
            localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(next));
            return next;
        });
        return true;
    };

    const actions: ToniesFilterActions = {
        setSearchText: (v) => setPartial({ searchText: v }),
        setSeriesFilter: (v) => setPartial({ seriesFilter: v }),
        setEpisodeFilter: (v) => setPartial({ episodeFilter: v }),
        setSelectedLanguages: (v) => setPartial({ selectedLanguages: v }),
        setValidFilter: (v) => setPartial({ validFilter: v }),
        setInvalidFilter: (v) => setPartial({ invalidFilter: v }),
        setExistsFilter: (v) => setPartial({ existsFilter: v }),
        setNotExistsFilter: (v) => setPartial({ notExistsFilter: v }),
        setLiveFilter: (v) => setPartial({ liveFilter: v }),
        setUnsetLiveFilter: (v) => setPartial({ unsetLiveFilter: v }),
        setNocloudFilter: (v) => setPartial({ nocloudFilter: v }),
        setUnsetNocloudFilter: (v) => setPartial({ unsetNocloudFilter: v }),
        setHasCloudAuthFilter: (v) => setPartial({ hasCloudAuthFilter: v }),
        setUnsetHasCloudAuthFilter: (v) => setPartial({ unsetHasCloudAuthFilter: v }),
        setFilterLastTonieboxRUIDs: (v) => setPartial({ filterLastTonieboxRUIDs: v }),
        setCustomFilter: (v) => setPartial({ customFilter: v }),
        setFilterName: (v) => setPartial({ filterName: v }),

        validateCustomFilter,
        getCustomFilterCompletions,

        applyFilters: () => applyFiltersInternal(),
        resetFilters,
        hideTonieCard,
    };

    return {
        filteredTonies,
        filterState: state,
        filterActions: actions,
        existingFilters,
        saveFilterSettings,
        loadFilterSettings,
        deleteFilter,
        setFilteredTonies,
    };
}
