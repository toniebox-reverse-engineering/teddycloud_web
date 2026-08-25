import React, { useEffect, useMemo, useState } from "react";
import { Input, Modal, Transfer, theme, Grid, List, Button, Checkbox } from "antd";
import type { TransferProps } from "antd";
import { CheckCircleFilled, PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { toImageSrc } from "../../common/utils/imagePathUtils";

const api = new TeddyCloudApi(defaultAPIConfig());

const SEARCH_MIN_CHARS = 2;
const SEARCH_DEBOUNCE_MS = 300;

// Cap how many matched rows the mobile list mounts at once. The catalog is ~6.4k
// entries and a broad query (e.g. "benjamin") can still match >1k; antd's <List>
// is not virtualized, so we render a slice and nudge the user to narrow instead.
const RESULT_CAP = 200;

// Local debounced-value hook. The repo already ships `useDebouncedCallback`
// (callback variant) but no value variant; rather than pull in a new dep
// (lodash isn't in package.json), keep this small and inline.
function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const handle = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(handle);
    }, [value, delay]);
    return debounced;
}

export interface BulkAddDataset {
    custom: boolean;
    text: string;
    pic?: string;
    episodes: string;
    series: string;
    model: string;
    language: string;
    trackTitles: string[];
}

interface CatalogEntry {
    key: string;
    title: string;
    description: string;
    pic?: string;
    raw: BulkAddDataset;
}

export interface BulkAddToniesModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (datasets: BulkAddDataset[]) => void;
}

/**
 * One result/queued row: a 32px cover (or a tokenized placeholder when a tonie
 * has no picture) plus an ellipsized, tooltipped title. Shared by the desktop
 * <Transfer> render and the mobile tap-to-toggle list so the two never drift.
 */
const RowLabel: React.FC<{ pic?: string; title: string }> = ({ pic, title }) => {
    const { token } = theme.useToken();
    return (
        <span
            style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}
        >
            {pic ? (
                <img
                    src={toImageSrc(pic)}
                    alt=""
                    style={{
                        width: 32,
                        height: 32,
                        objectFit: "cover",
                        borderRadius: 4,
                        flexShrink: 0,
                    }}
                />
            ) : (
                <span
                    style={{
                        width: 32,
                        height: 32,
                        flexShrink: 0,
                        borderRadius: 4,
                        background: token.colorFillTertiary,
                    }}
                />
            )}
            <span
                style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: token.colorText,
                }}
                title={title}
            >
                {title}
            </span>
        </span>
    );
};

/**
 * Bulk-add tonies modal.
 *
 * Uses antd's <Transfer> primitive — which is purpose-built for "ferry items
 * from a left list to a right list". Independent search inputs on each side,
 * stable scroll, range selection — none of the issues that the prior
 * checkbox-in-Select design had.
 *
 * On confirm, the right-pane datasets are batch-added to the print sheet via
 * the parent's onConfirm callback (wired to useCustomItems.addResults).
 */
export const BulkAddToniesModal: React.FC<BulkAddToniesModalProps> = ({
    open,
    onClose,
    onConfirm,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const screens = Grid.useBreakpoint();

    const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
    const [targetKeys, setTargetKeys] = useState<string[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

    // Reset transient pickup state when the modal closes; only re-fetch on open
    // if we don't have the catalog yet (it's effectively static within a session).
    useEffect(() => {
        if (!open) {
            setTargetKeys([]);
            setSelectedKeys([]);
            setSearchInput("");
            return;
        }
        if (catalog.length > 0) return;

        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const [defaultResponse, customResponse] = await Promise.all([
                    api.apiGetTeddyCloudApiRaw(`/api/toniesJson`),
                    api.apiGetTeddyCloudApiRaw(`/api/toniesCustomJson`),
                ]);
                const [defaultData, customData] = await Promise.all([
                    defaultResponse.json(),
                    customResponse.json(),
                ]);
                const merged = [
                    ...(Array.isArray(defaultData) ? defaultData : []),
                    ...(Array.isArray(customData) ? customData : []),
                ];

                const entries: CatalogEntry[] = [];
                const seenKeys = new Set<string>();
                merged.forEach((item: any, index: number) => {
                    const model = (item?.model ?? "").toString();
                    const series = (item?.series ?? "").toString();
                    const episodes = (item?.episodes ?? "").toString();
                    const language = (item?.language ?? "").toString();
                    const pic = typeof item?.pic === "string" ? item.pic : undefined;
                    const tracks = Array.isArray(item?.tracks) ? (item.tracks as string[]) : [];

                    // Build a stable key. Most catalog entries have a unique model;
                    // fall back to a synthetic key so duplicates don't drop entries.
                    let key = model || `__no-model-${index}`;
                    if (seenKeys.has(key)) {
                        key = `${key}__${index}`;
                    }
                    seenKeys.add(key);

                    const titleParts: string[] = [];
                    if (model) titleParts.push(`[${model}]`);
                    if (series) titleParts.push(series);
                    const titleHead = titleParts.join(" ");
                    const title = episodes
                        ? `${titleHead} - ${episodes}`.trim()
                        : titleHead || episodes || key;

                    // Match post-#297 dataset shape (gh-296 fix): `text` is just
                    // the series, and `series` is a separate field. Renderer
                    // composes display from series + episodes separately, so
                    // concatenating into `text` here causes doubled label text.
                    entries.push({
                        key,
                        title,
                        description: language || "",
                        pic,
                        raw: {
                            custom: false,
                            text: series,
                            pic,
                            episodes,
                            series,
                            model,
                            language,
                            trackTitles: tracks,
                        },
                    });
                });

                if (!cancelled) {
                    setCatalog(entries);
                }
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error("Failed to load tonies catalog for bulk-add:", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, [open, catalog.length]);

    // Gate the dataSource behind the modal-level search. The full catalog can
    // be thousands of rows; mounting them all in <Transfer> on open is what
    // made the modal unusably slow. Empty array until the user types
    // SEARCH_MIN_CHARS+ characters, then filter by substring against the
    // visible title plus the raw model / series / episodes fields so users
    // can find an entry by any of those.
    const dataSource = useMemo(() => {
        const needle = debouncedSearch.trim().toLowerCase();
        if (needle.length < SEARCH_MIN_CHARS) return [];
        return catalog
            .filter((entry) => {
                const haystack = [
                    entry.title,
                    entry.description,
                    entry.raw.model,
                    entry.raw.text,
                    entry.raw.episodes,
                ]
                    .join(" ")
                    .toLowerCase();
                return haystack.includes(needle);
            })
            .map((entry) => ({
                key: entry.key,
                title: entry.title,
                description: entry.description,
                pic: entry.pic,
            }));
    }, [catalog, debouncedSearch]);

    // Always include the queued (right-pane) items in the dataSource, even
    // when they don't match the current search. <Transfer> needs to find a
    // dataSource entry for every targetKey or it silently drops the row from
    // the right pane on re-render.
    const dataSourceWithQueued = useMemo(() => {
        if (targetKeys.length === 0) return dataSource;
        const present = new Set(dataSource.map((d) => d.key));
        const extras = catalog
            .filter((e) => targetKeys.includes(e.key) && !present.has(e.key))
            .map((entry) => ({
                key: entry.key,
                title: entry.title,
                description: entry.description,
                pic: entry.pic,
            }));
        return [...dataSource, ...extras];
    }, [dataSource, targetKeys, catalog]);

    // Mobile-only derived data. selectedSet gives O(1) per-row membership (the
    // basket can be large and the results list long).
    const selectedSet = useMemo(() => new Set(targetKeys), [targetKeys]);

    // Select-all operates on the full filtered match set (dataSource, pre-cap),
    // mirroring the desktop Transfer's per-pane "select all". Tri-state: checked
    // when every match is queued, indeterminate when only some are.
    const filteredKeys = useMemo(() => dataSource.map((d) => d.key), [dataSource]);
    const allFilteredSelected =
        filteredKeys.length > 0 && filteredKeys.every((k) => selectedSet.has(k));
    const someFilteredSelected = filteredKeys.some((k) => selectedSet.has(k));

    const searchTooShort = debouncedSearch.trim().length < SEARCH_MIN_CHARS;

    // Mobile results are sliced to RESULT_CAP (perf — antd <List> isn't virtualized);
    // isTruncated drives a "keep typing to narrow" footer so a capped list never
    // looks like the complete result set.
    const visibleResults = useMemo(() => dataSource.slice(0, RESULT_CAP), [dataSource]);
    const isTruncated = dataSource.length > RESULT_CAP;

    const handleChange: TransferProps["onChange"] = (nextTargetKeys) => {
        // antd 6 returns Key[]; coerce to string[] for our string-keyed catalog.
        setTargetKeys(nextTargetKeys.map((k) => String(k)));
    };

    // Mobile tap-to-toggle: add or remove a key from the queue (idempotent).
    const toggleKey = (key: string) =>
        setTargetKeys((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
        );

    // Add or remove every current match (the full filtered set) at once.
    const toggleSelectAll = () =>
        setTargetKeys((prev) => {
            const prevSet = new Set(prev);
            const allSelected =
                filteredKeys.length > 0 && filteredKeys.every((k) => prevSet.has(k));
            if (allSelected) {
                const drop = new Set(filteredKeys);
                return prev.filter((k) => !drop.has(k));
            }
            return [...prev, ...filteredKeys.filter((k) => !prevSet.has(k))];
        });

    const handleSelectChange: TransferProps["onSelectChange"] = (
        sourceSelected,
        targetSelected,
    ) => {
        setSelectedKeys([...sourceSelected, ...targetSelected].map((k) => String(k)));
    };

    const renderItem: NonNullable<TransferProps<any>["render"]> = (item: any) => ({
        label: <RowLabel pic={item.pic} title={item.title} />,
        value: item.title,
    });

    const handleOk = () => {
        const keyToRaw = new Map(catalog.map((e) => [e.key, e.raw] as const));
        const selectedDatasets: BulkAddDataset[] = [];
        targetKeys.forEach((key) => {
            const raw = keyToRaw.get(key);
            if (raw) selectedDatasets.push(raw);
        });
        onConfirm(selectedDatasets);
        onClose();
    };

    // Responsive sizing. `screens.md` is antd's 768px breakpoint (the repo's
    // standard mobile check): below it we render a single-column touch UI; at/above
    // it the desktop <Transfer>. The desktop pane width splits the modal content
    // across both panes plus the ~64px arrow column, clamped to [240, 400] so the
    // two panes still fit at the md=768 boundary yet stay 400px wide on large
    // screens (visually identical to before). Unused on mobile (no Transfer there).
    const isMobile = !screens.md;
    const modalWidth = Math.min(window.innerWidth - 32, 900);
    const sectionWidth = isMobile
        ? 0
        : Math.min(Math.max(Math.floor((modalWidth - 64) / 2), 240), 400);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            title={t("tonies.teddystudio.bulkAdd.modal.title")}
            okText={t("tonies.teddystudio.bulkAdd.modal.confirm", {
                count: targetKeys.length,
                defaultValue: `Add ${targetKeys.length}`,
            })}
            okButtonProps={{ disabled: targetKeys.length === 0 }}
            cancelText={t("tonies.teddystudio.cancel")}
            width={modalWidth}
            destroyOnHidden
        >
            <Input.Search
                placeholder={t("tonies.teddystudio.bulkAdd.modal.searchPrompt")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                allowClear
                style={{ marginBottom: 12 }}
            />
            {isMobile ? (
                <div>
                    {/* Compact actions header: tri-state "Select all" + the queued
                        count + "Clear all". The selection itself is shown inline on
                        the list rows below, so there is no separate chip tray. */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            minHeight: 32,
                            marginBottom: 8,
                            paddingBottom: 8,
                            borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        }}
                    >
                        {!searchTooShort && filteredKeys.length > 0 ? (
                            <Checkbox
                                checked={allFilteredSelected}
                                indeterminate={someFilteredSelected && !allFilteredSelected}
                                onChange={toggleSelectAll}
                            >
                                {t("tonies.teddystudio.bulkAdd.modal.selectAll", {
                                    defaultValue: "Select all",
                                })}
                            </Checkbox>
                        ) : (
                            <span />
                        )}
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                            <span
                                aria-live="polite"
                                aria-atomic="true"
                                style={{
                                    fontSize: token.fontSizeSM,
                                    color: token.colorTextDescription,
                                }}
                            >
                                {t("tonies.teddystudio.bulkAdd.modal.selectedCount", {
                                    count: targetKeys.length,
                                    defaultValue: "{{count}} queued to add",
                                })}
                            </span>
                            {targetKeys.length > 0 && (
                                <Button
                                    type="link"
                                    size="small"
                                    onClick={() => setTargetKeys([])}
                                    style={{
                                        paddingInline: 0,
                                        height: "auto",
                                        fontSize: token.fontSizeSM,
                                    }}
                                >
                                    {t("tonies.teddystudio.bulkAdd.modal.clearSelection", {
                                        defaultValue: "Clear all",
                                    })}
                                </Button>
                            )}
                        </span>
                    </div>

                    {searchTooShort ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "40px 16px",
                                color: token.colorTextDescription,
                            }}
                        >
                            {t("tonies.teddystudio.bulkAdd.modal.searchHint")}
                        </div>
                    ) : (
                        <div style={{ maxHeight: "55vh", overflowY: "auto", overflowX: "hidden" }}>
                            <List
                                loading={loading}
                                dataSource={visibleResults}
                                locale={{
                                    emptyText: t("tonies.teddystudio.bulkAdd.modal.notFound"),
                                }}
                                rowKey="key"
                                renderItem={(item) => {
                                    const added = selectedSet.has(item.key);
                                    return (
                                        <List.Item
                                            role="checkbox"
                                            aria-checked={added}
                                            aria-label={item.title}
                                            tabIndex={0}
                                            onClick={() => toggleKey(item.key)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    toggleKey(item.key);
                                                }
                                            }}
                                            style={{
                                                cursor: "pointer",
                                                paddingInline: 8,
                                                minHeight: 56,
                                                gap: 12,
                                                background: added
                                                    ? token.controlItemBgActive
                                                    : "transparent",
                                            }}
                                        >
                                            <RowLabel pic={item.pic} title={item.title} />
                                            {added ? (
                                                <CheckCircleFilled
                                                    style={{
                                                        color: token.colorPrimary,
                                                        fontSize: 20,
                                                        flexShrink: 0,
                                                    }}
                                                />
                                            ) : (
                                                <PlusOutlined
                                                    style={{
                                                        color: token.colorTextSecondary,
                                                        fontSize: 18,
                                                        flexShrink: 0,
                                                    }}
                                                />
                                            )}
                                        </List.Item>
                                    );
                                }}
                            />
                            {isTruncated && (
                                <div
                                    style={{
                                        textAlign: "center",
                                        padding: "8px 16px",
                                        fontSize: token.fontSizeSM,
                                        color: token.colorTextDescription,
                                    }}
                                >
                                    {t("tonies.teddystudio.bulkAdd.modal.resultsTruncated", {
                                        shown: RESULT_CAP,
                                        total: dataSource.length,
                                        defaultValue:
                                            "Showing first {{shown}} of {{total}} — keep typing to narrow",
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : searchTooShort && targetKeys.length === 0 ? (
                <div
                    style={{
                        textAlign: "center",
                        padding: "48px 16px",
                        color: token.colorTextDescription,
                    }}
                >
                    {t("tonies.teddystudio.bulkAdd.modal.searchHint")}
                </div>
            ) : (
                <Transfer
                    dataSource={dataSourceWithQueued}
                    titles={[
                        t("tonies.teddystudio.bulkAdd.modal.leftTitle"),
                        t("tonies.teddystudio.bulkAdd.modal.rightTitle"),
                    ]}
                    targetKeys={targetKeys}
                    selectedKeys={selectedKeys}
                    onChange={handleChange}
                    onSelectChange={handleSelectChange}
                    showSearch={false}
                    locale={{
                        itemUnit: t("tonies.teddystudio.bulkAdd.modal.itemUnit"),
                        itemsUnit: t("tonies.teddystudio.bulkAdd.modal.itemsUnit"),
                        notFoundContent: searchTooShort
                            ? t("tonies.teddystudio.bulkAdd.modal.searchHint")
                            : t("tonies.teddystudio.bulkAdd.modal.notFound"),
                    }}
                    render={renderItem}
                    styles={{ section: { width: sectionWidth, height: 480 } }}
                    disabled={loading}
                />
            )}
        </Modal>
    );
};

export default BulkAddToniesModal;
