import React, { useEffect, useMemo, useState } from "react";
import { Modal, Transfer } from "antd";
import type { TransferProps } from "antd";
import { useTranslation } from "react-i18next";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { toImageSrc } from "../../common/utils/imagePathUtils";

const api = new TeddyCloudApi(defaultAPIConfig());

export interface BulkAddDataset {
    custom: boolean;
    text: string;
    pic?: string;
    episodes: string;
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
export const BulkAddToniesModal: React.FC<BulkAddToniesModalProps> = ({ open, onClose, onConfirm }) => {
    const { t } = useTranslation();

    const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
    const [targetKeys, setTargetKeys] = useState<string[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Reset transient pickup state when the modal closes; only re-fetch on open
    // if we don't have the catalog yet (it's effectively static within a session).
    useEffect(() => {
        if (!open) {
            setTargetKeys([]);
            setSelectedKeys([]);
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
                    const title = episodes ? `${titleHead} - ${episodes}`.trim() : titleHead || episodes || key;

                    const text = series && episodes ? `${series} - ${episodes}` : series || episodes || "";

                    entries.push({
                        key,
                        title,
                        description: language || "",
                        pic,
                        raw: {
                            custom: false,
                            text,
                            pic,
                            episodes,
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

    const dataSource = useMemo(
        () =>
            catalog.map((entry) => ({
                key: entry.key,
                title: entry.title,
                description: entry.description,
                pic: entry.pic,
            })),
        [catalog]
    );

    const handleChange: TransferProps["onChange"] = (nextTargetKeys) => {
        // antd 6 returns Key[]; coerce to string[] for our string-keyed catalog.
        setTargetKeys(nextTargetKeys.map((k) => String(k)));
    };

    const handleSelectChange: TransferProps["onSelectChange"] = (sourceSelected, targetSelected) => {
        setSelectedKeys([...sourceSelected, ...targetSelected].map((k) => String(k)));
    };

    const filterOption: NonNullable<TransferProps["filterOption"]> = (inputValue, option) => {
        const needle = inputValue.toLowerCase();
        const opt = option as unknown as { title?: string; description?: string };
        return (
            (opt.title ?? "").toLowerCase().includes(needle) ||
            (opt.description ?? "").toLowerCase().includes(needle)
        );
    };

    const renderItem: NonNullable<TransferProps<any>["render"]> = (item: any) => {
        const label = (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                {item.pic && (
                    <img
                        src={toImageSrc(item.pic)}
                        alt=""
                        style={{
                            width: 32,
                            height: 32,
                            objectFit: "cover",
                            borderRadius: 4,
                            flexShrink: 0,
                        }}
                    />
                )}
                <span
                    style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                    title={item.title}
                >
                    {item.title}
                </span>
            </span>
        );
        return { label, value: item.title };
    };

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
            width={900}
            destroyOnClose
        >
            <Transfer
                dataSource={dataSource}
                titles={[
                    t("tonies.teddystudio.bulkAdd.modal.leftTitle"),
                    t("tonies.teddystudio.bulkAdd.modal.rightTitle"),
                ]}
                targetKeys={targetKeys}
                selectedKeys={selectedKeys}
                onChange={handleChange}
                onSelectChange={handleSelectChange}
                showSearch
                filterOption={filterOption}
                locale={{
                    itemUnit: t("tonies.teddystudio.bulkAdd.modal.itemUnit"),
                    itemsUnit: t("tonies.teddystudio.bulkAdd.modal.itemsUnit"),
                    searchPlaceholder: t("tonies.teddystudio.bulkAdd.modal.searchPlaceholder"),
                    notFoundContent: t("tonies.teddystudio.bulkAdd.modal.notFound"),
                }}
                render={renderItem}
                listStyle={{ width: 400, height: 480 }}
                disabled={loading}
            />
        </Modal>
    );
};

export default BulkAddToniesModal;
