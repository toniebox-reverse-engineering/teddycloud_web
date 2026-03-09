import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Badge,
    Button,
    Checkbox,
    Col,
    Collapse,
    Form,
    Input,
    Modal,
    Popover,
    Row,
    Select,
    Space,
    Table,
    Tooltip,
    Typography,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

import { TonieCardProps } from "../../types/tonieTypes";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { useTeddyCloud } from "../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";
import ImageManagerModal from "./filebrowser/modals/ImageManagerModal";

const api = new TeddyCloudApi(defaultAPIConfig());

interface ToniesCustomJsonEditorProps {
    open: boolean;
    onClose: () => void;
    setValue?: (value: any) => void;
    props?: any;
    tonieCardProps?: TonieCardProps;
    audioId?: number;
    hash?: string;
    embedded?: boolean;
    startInCreateMode?: boolean;
    initialSelectedModel?: string;
    onModelCreated?: (model: string) => void;
}

type AudioPair = { audio_id: string; hash: string };
type TrackRow = { track: string };
type AudioSelectOption = {
    key: string;
    value: string;
    label: string;
    audio_id: string;
    hash: string;
};

type LibraryRecord = {
    name?: string;
    isDir?: boolean;
    tafHeader?: {
        audioId?: string | number;
        sha1Hash?: string;
    };
    tonieInfo?: {
        model?: string;
        series?: string;
    };
};

type CustomEntry = {
    no?: string;
    model: string;
    audio_id?: string[];
    hash?: string[];
    title?: string;
    series: string;
    episodes?: string;
    tracks?: string[];
    release?: string;
    language?: string;
    category?: string;
    pic?: string;
};

type FormValues = {
    no?: string;
    model: string;
    title?: string;
    series: string;
    episodes?: string;
    release?: string | number;
    language?: string;
    category?: string;
    pic?: string;
    audioPairs: AudioPair[];
    tracks: TrackRow[];
};

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const TABLE_SETTINGS_STORAGE_KEY = "tonies.customEditor.tableSettings.v1";

type OptionalColumnKey = "title" | "episodes" | "release" | "language" | "category" | "no" | "status";
type SortColumnKey = "series" | "model" | "title" | "episodes" | "release" | "language" | "category" | "no" | "status";
type SortOrder = "ascend" | "descend" | null;
type FilterFieldKey = "series" | "model" | "title" | "episodes" | "release" | "language" | "category" | "no" | "status";
type DraftStatus = "clean" | "changed" | "new" | "deleted";

type TableRow = {
    idx: number;
    entry: CustomEntry;
    status: DraftStatus;
};

type SavePlan = {
    nextWithoutDeleted: CustomEntry[];
    activeEntry: CustomEntry;
    renameOps: Array<{ fromModel: string; toModel: string }>;
    upsertEntries: CustomEntry[];
    deleteModels: string[];
};

const normalizeDirPath = (value: string) => value.replace(/^\/+/, "").replace(/\/+$/, "");

const toCustomImgWebPath = (path: string, fileName: string) => {
    const normalizedPath = normalizeDirPath(path);
    return normalizedPath ? `/custom_img/${normalizedPath}/${fileName}` : `/custom_img/${fileName}`;
};

const toPreviewableImageUrl = (value?: string) => {
    const raw = (value || "").trim();
    if (!raw) return "";
    if (/^(https?:\/\/|data:|blob:)/i.test(raw)) return raw;
    if (raw.startsWith("/")) return raw;
    if (raw.startsWith("custom_img/")) return `/${raw}`;
    const normalized = normalizeDirPath(raw);
    if (!normalized) return "";
    const encoded = normalized
        .split("/")
        .filter(Boolean)
        .map((segment) => encodeURIComponent(segment))
        .join("/");
    return `/custom_img/${encoded}`;
};

const buildAudioPairKey = (audioId: string, hash: string) => `${audioId.trim()}::${hash.trim().toLowerCase()}`;

const cloneEntry = (entry: CustomEntry): CustomEntry => JSON.parse(JSON.stringify(entry));

const normalizeText = (value?: string) => (value || "").trim();

const normalizeAudioPairs = (entry: CustomEntry) => {
    const audioIds = entry.audio_id || [];
    const hashes = entry.hash || [];
    return audioIds
        .map((audioId, index) => `${normalizeText(audioId)}::${normalizeText(hashes[index]).toLowerCase()}`)
        .filter((pair) => pair !== "::");
};

const normalizeTracks = (entry: CustomEntry) => (entry.tracks || []).map((track) => normalizeText(track)).filter(Boolean);

const areStringArraysEqual = (left: string[], right: string[]) =>
    left.length === right.length && left.every((value, index) => value === right[index]);

const toModelKey = (model?: string) => normalizeText(model).toLowerCase();

const toFormValues = (entry: CustomEntry): FormValues => ({
    no: entry.no ?? "",
    model: entry.model ?? "",
    title: entry.title ?? "",
    series: entry.series ?? "",
    episodes: entry.episodes ?? "",
    release: entry.release ?? "",
    language: entry.language ?? "",
    category: entry.category ?? "",
    pic: entry.pic ?? "",
    audioPairs:
        entry.audio_id && entry.hash
            ? entry.audio_id.map((audio_id, idx) => ({ audio_id: audio_id ?? "", hash: entry.hash?.[idx] ?? "" }))
            : [{ audio_id: "", hash: "" }],
    tracks: entry.tracks && entry.tracks.length > 0 ? entry.tracks.map((track) => ({ track })) : [{ track: "" }],
});

const parseModelId = (model: string): number | null => {
    const match = /^custom-(\d+)$/i.exec(model.trim());
    return match ? Number(match[1]) : null;
};

const buildSuggestedModel = (entries: CustomEntry[]): string => {
    let maxId = 0;
    entries.forEach((entry) => {
        const parsed = parseModelId(entry.model || "");
        if (parsed !== null && parsed > maxId) maxId = parsed;
    });
    return `custom-${maxId + 1}`;
};

const toEntry = (values: FormValues): CustomEntry => {
    const pairs = (values.audioPairs || [])
        .map((pair) => ({
            audio_id: (pair.audio_id || "").trim(),
            hash: (pair.hash || "").trim(),
        }))
        .filter((pair) => pair.audio_id && pair.hash);

    const tracks = (values.tracks || [])
        .map((track) => (track.track || "").trim())
        .filter((track) => track.length > 0);

    const releaseRaw = values.release === undefined || values.release === null ? "" : String(values.release).trim();
    const releaseNormalized = releaseRaw.length > 0 ? releaseRaw : undefined;

    const entry: CustomEntry = {
        no: (values.no || "").trim() || undefined,
        model: (values.model || "").trim(),
        audio_id: pairs.length > 0 ? pairs.map((pair) => pair.audio_id) : undefined,
        hash: pairs.length > 0 ? pairs.map((pair) => pair.hash) : undefined,
        title: (values.title || "").trim() || undefined,
        series: (values.series || "").trim(),
        episodes: (values.episodes || "").trim() || undefined,
        tracks: tracks.length > 0 ? tracks : undefined,
        release: releaseNormalized,
        language: (values.language || "").trim() || undefined,
        category: (values.category || "").trim() || undefined,
        pic: (values.pic || "").trim() || undefined,
    };

    return entry;
};

const isImageFile = (name: string) => IMAGE_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext));

export const ToniesCustomJsonEditor: React.FC<ToniesCustomJsonEditorProps> = ({
    open,
    onClose,
    setValue,
    props,
    tonieCardProps,
    audioId,
    hash,
    embedded = false,
    startInCreateMode = false,
    initialSelectedModel = "",
    onModelCreated,
}) => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();
    const [form] = Form.useForm<FormValues>();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [customEntries, setCustomEntries] = useState<CustomEntry[]>([]);
    const [persistedEntries, setPersistedEntries] = useState<CustomEntry[]>([]);
    const [deletedModelKeys, setDeletedModelKeys] = useState<Set<string>>(new Set());
    const [baseEntries, setBaseEntries] = useState<CustomEntry[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const [imageManagerOpen, setImageManagerOpen] = useState(false);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");

    const [imagePathOptions, setImagePathOptions] = useState<string[]>([]);
    const imagePathsCollectedRef = useRef(false);
    const [customAudioOptions, setCustomAudioOptions] = useState<AudioSelectOption[]>([]);
    const [customAudioOptionsLoading, setCustomAudioOptionsLoading] = useState(false);
    const [visibleOptionalColumns, setVisibleOptionalColumns] = useState<OptionalColumnKey[]>(["status"]);
    const [tableSortColumn, setTableSortColumn] = useState<SortColumnKey>("model");
    const [tableSortOrder, setTableSortOrder] = useState<SortOrder>("ascend");
    const [filterText, setFilterText] = useState("");
    const [filterFields, setFilterFields] = useState<FilterFieldKey[]>(["series", "model"]);
    const [selectedRowIndexes, setSelectedRowIndexes] = useState<number[]>([]);
    const [showChangesOnly, setShowChangesOnly] = useState(false);
    const [preflightOpen, setPreflightOpen] = useState(false);
    const [pendingSavePlan, setPendingSavePlan] = useState<SavePlan | null>(null);
    const [validationMessages, setValidationMessages] = useState<string[]>([]);
    const [brokenImageUrls, setBrokenImageUrls] = useState<Set<string>>(new Set());

    const listWithCurrentDraft = async (skipValidationForCurrentSelection = false) => {
        const values = skipValidationForCurrentSelection
            ? (form.getFieldsValue(true) as FormValues)
            : await form.validateFields();
        const draft = toEntry(values);
        const next = customEntries.map((entry) => cloneEntry(entry));
        if (selectedIndex === null || selectedIndex < 0 || selectedIndex >= next.length) {
            throw new Error(t("tonies.customEditor.errors.invalidSelectedIndex"));
        }
        next[selectedIndex] = draft;
        return { next, activeEntry: draft };
    };

    const mergeCurrentFormIntoEntries = (entries: CustomEntry[]) => {
        if (selectedIndex === null || selectedIndex < 0 || selectedIndex >= entries.length) {
            return entries.map((entry) => cloneEntry(entry));
        }
        const values = form.getFieldsValue(true) as FormValues;
        const draft = toEntry(values);
        const next = entries.map((entry) => cloneEntry(entry));
        next[selectedIndex] = draft;
        return next;
    };

    const validateEntryList = (entries: CustomEntry[]) => {
        const modelMap = new Map<string, number>();
        const pairMap = new Map<string, string>();

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const modelKey = entry.model.trim().toLowerCase();
            if (modelMap.has(modelKey)) {
                return {
                    error: t("tonies.addNewCustomTonieModal.modelRequired") + ` (Duplikat: ${entry.model})`,
                    baseWarning: "",
                };
            }
            modelMap.set(modelKey, i);

            const audioIds = entry.audio_id || [];
            const hashes = entry.hash || [];
            for (let j = 0; j < Math.min(audioIds.length, hashes.length); j++) {
                const pair = `${audioIds[j]}::${hashes[j].toLowerCase()}`;
                if (pairMap.has(pair)) {
                    return {
                        error: `Doppelte audio_id+hash-Kombination erkannt: ${audioIds[j]}`,
                        baseWarning: "",
                    };
                }
                pairMap.set(pair, entry.model);
            }
        }

        const baseModelSet = new Set(baseEntries.map((entry) => (entry.model || "").trim().toLowerCase()));
        const baseWarningModels = entries
            .filter((entry) => baseModelSet.has(entry.model.trim().toLowerCase()))
            .map((entry) => entry.model);
        if (baseWarningModels.length > 0) {
            return {
                error: "",
                baseWarning: `Modell existiert in base tonies.json: ${Array.from(new Set(baseWarningModels)).join(", ")}`,
            };
        }

        return { error: "", baseWarning: "" };
    };

    const buildNewEntryDraft = (seedEntries: CustomEntry[]): CustomEntry => {
        const suggestedModel = buildSuggestedModel(seedEntries);
        const seedAudioId = audioId && hash ? [String(audioId)] : undefined;
        const seedHash = audioId && hash ? [hash] : undefined;
        return {
            no: "",
            model: suggestedModel,
            title: "",
            series: tonieCardProps?.tonieInfo?.series || "",
            episodes: tonieCardProps?.tonieInfo?.episode || "",
            release: "",
            language: tonieCardProps?.tonieInfo?.language || "",
            category: "",
            pic: tonieCardProps?.tonieInfo?.picture || "",
            audio_id: seedAudioId,
            hash: seedHash,
            tracks: undefined,
        };
    };

    const createAndSelectNewEntry = (seedEntries: CustomEntry[]) => {
        const newEntry = buildNewEntryDraft(seedEntries);
        const nextEntries = [...seedEntries.map((entry) => cloneEntry(entry)), newEntry];
        setCustomEntries(nextEntries);
        setSelectedIndex(nextEntries.length - 1);
        form.setFieldsValue(toFormValues(newEntry));
        return nextEntries;
    };

    const loadJsonData = async () => {
        setLoading(true);
        try {
            const [customResponse, baseResponse] = await Promise.all([
                api.apiGetTeddyCloudApiRaw("/api/toniesCustomJson"),
                api.apiGetTeddyCloudApiRaw("/api/toniesJson"),
            ]);

            const [customData, baseData] = await Promise.all([customResponse.json(), baseResponse.json()]);
            const normalizedCustom = Array.isArray(customData) ? customData : [];
            const normalizedBase = Array.isArray(baseData) ? baseData : [];
            setCustomEntries(normalizedCustom);
            setPersistedEntries(normalizedCustom);
            setDeletedModelKeys(new Set());
            setBaseEntries(normalizedBase);

            if (startInCreateMode) {
                void createAndSelectNewEntry(normalizedCustom);
                return;
            }

            const initialModelKey = toModelKey(initialSelectedModel);
            if (normalizedCustom.length > 0 && initialModelKey) {
                const selectedIdx = normalizedCustom.findIndex((entry) => toModelKey(entry.model) === initialModelKey);
                if (selectedIdx >= 0) {
                    setSelectedIndex(selectedIdx);
                    form.setFieldsValue(toFormValues(normalizedCustom[selectedIdx]));
                    return;
                }
            }

            if (normalizedCustom.length > 0) {
                setSelectedIndex(0);
                form.setFieldsValue(toFormValues(normalizedCustom[0]));
            } else {
                void createAndSelectNewEntry(normalizedCustom);
            }
        } catch (error) {
            const maybeErrorFields = (error as any)?.errorFields as Array<{ errors?: string[] }> | undefined;
            if (Array.isArray(maybeErrorFields) && maybeErrorFields.length > 0) {
                const issues = maybeErrorFields.flatMap((item) => item.errors || []).filter(Boolean);
                if (issues.length > 0) {
                    setValidationMessages(Array.from(new Set(issues)));
                }
            } else if (error instanceof Error) {
                setValidationMessages([error.message]);
            }
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.addNewCustomTonieModal.failedToCreate"),
                String(error),
                t("tonies.customToniesEditorJsonEntry")
            );
        } finally {
            setLoading(false);
        }
    };

    const collectImagePaths = async () => {
        const discovered: string[] = [];
        const fetchDir = async (current: string): Promise<string[]> => {
            const subdirs: string[] = [];
            try {
                const response = await api.apiGetTeddyCloudApiRaw(
                    `/api/fileIndexV2?path=${encodeURIComponent(current)}&special=custom_img`
                );
                if (!response.ok) return [];
                const data = await response.json();
                const files = Array.isArray(data?.files) ? data.files : [];

                files.forEach((entry: any) => {
                    if (!entry || entry.name === "..") return;
                    if (entry.isDir) {
                        subdirs.push(current ? `${current}/${entry.name}` : entry.name);
                    } else if (isImageFile(entry.name)) {
                        discovered.push(toCustomImgWebPath(current, entry.name));
                    }
                });
            } catch {
                // ignore
            }
            return subdirs;
        };

        let currentLevels: string[] = [""];
        const seen = new Set<string>([""]);

        while (currentLevels.length > 0) {
            const results = await Promise.all(currentLevels.map((p) => fetchDir(p)));
            const nextLevels: string[] = [];
            results.forEach((subdirs) => {
                subdirs.forEach((d) => {
                    if (!seen.has(d)) {
                        seen.add(d);
                        nextLevels.push(d);
                    }
                });
            });
            currentLevels = nextLevels;
        }

        setImagePathOptions(Array.from(new Set(discovered)).sort((a, b) => a.localeCompare(b)));
    };

    const collectCustomAudioOptions = async () => {
        setCustomAudioOptionsLoading(true);
        const queue: string[] = [""];
        const seen = new Set<string>();
        const optionsByKey = new Map<string, AudioSelectOption>();

        try {
            while (queue.length > 0) {
                const current = queue.shift() || "";
                if (seen.has(current)) continue;
                seen.add(current);

                const response = await api.apiGetTeddyCloudApiRaw(
                    `/api/fileIndexV2?path=${encodeURIComponent(current)}&special=library`
                );
                const data = await response.json();
                const files = Array.isArray(data?.files) ? (data.files as LibraryRecord[]) : [];

                files.forEach((entry) => {
                    if (!entry || entry.name === "..") return;
                    if (entry.isDir) {
                        const nextPath = current ? `${current}/${entry.name}` : `${entry.name}`;
                        queue.push(nextPath);
                        return;
                    }

                    const audioIdRaw = entry.tafHeader?.audioId;
                    const hashRaw = entry.tafHeader?.sha1Hash;
                    if (audioIdRaw === undefined || audioIdRaw === null || !hashRaw) return;

                    const model = (entry.tonieInfo?.model || "").trim();
                    if (!/^custom-/i.test(model)) return;

                    const audioId = String(audioIdRaw).trim();
                    const hash = String(hashRaw).trim();
                    if (!audioId || !hash) return;

                    const filePath = current ? `${current}/${entry.name}` : `${entry.name}`;
                    const key = buildAudioPairKey(audioId, hash);
                    const series = (entry.tonieInfo?.series || "").trim();
                    const seriesPart = series ? `${series} - ` : "";
                    const label = `${seriesPart}${entry.name} (${audioId}/${hash.slice(0, 8)}...) [${model}]`;

                    if (!optionsByKey.has(key)) {
                        optionsByKey.set(key, {
                            key,
                            value: key,
                            label: `${label} @ ${filePath}`,
                            audio_id: audioId,
                            hash,
                        });
                    }
                });
            }

            const sorted = Array.from(optionsByKey.values()).sort((a, b) => a.label.localeCompare(b.label));
            setCustomAudioOptions(sorted);
        } catch {
            setCustomAudioOptions([]);
        } finally {
            setCustomAudioOptionsLoading(false);
        }
    };

    const isVisible = embedded || open;

    useEffect(() => {
        if (!isVisible) return;
        void loadJsonData();
        void collectCustomAudioOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialSelectedModel, isVisible, startInCreateMode]);

    const runCollectImagePathsWhenNeeded = () => {
        if (!imagePathsCollectedRef.current) {
            imagePathsCollectedRef.current = true;
            void collectImagePaths();
        }
    };

    useEffect(() => {
        try {
            const raw = localStorage.getItem(TABLE_SETTINGS_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as {
                visibleOptionalColumns?: OptionalColumnKey[];
                tableSortColumn?: SortColumnKey;
                tableSortOrder?: SortOrder;
                filterFields?: FilterFieldKey[];
            };
            const allowedOptional: OptionalColumnKey[] = ["title", "episodes", "release", "language", "category", "no", "status"];
            const allowedSort: SortColumnKey[] = ["series", "model", "title", "episodes", "release", "language", "category", "no", "status"];
            const allowedFilterFields: FilterFieldKey[] = ["series", "model", "title", "episodes", "release", "language", "category", "no", "status"];
            if (Array.isArray(parsed.visibleOptionalColumns)) {
                const nextVisible = parsed.visibleOptionalColumns.filter(
                    (value): value is OptionalColumnKey => allowedOptional.includes(value as OptionalColumnKey)
                );
                setVisibleOptionalColumns(nextVisible);
            }
            if (parsed.tableSortColumn && allowedSort.includes(parsed.tableSortColumn)) {
                setTableSortColumn(parsed.tableSortColumn);
            }
            if (parsed.tableSortOrder === "ascend" || parsed.tableSortOrder === "descend" || parsed.tableSortOrder === null) {
                setTableSortOrder(parsed.tableSortOrder);
            }
            if (Array.isArray(parsed.filterFields)) {
                const nextFilterFields = parsed.filterFields.filter(
                    (value): value is FilterFieldKey => allowedFilterFields.includes(value as FilterFieldKey)
                );
                if (nextFilterFields.length > 0) {
                    setFilterFields(nextFilterFields);
                }
            }
        } catch {
            // ignore invalid persisted table config
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(
                TABLE_SETTINGS_STORAGE_KEY,
                JSON.stringify({
                    visibleOptionalColumns,
                    tableSortColumn,
                    tableSortOrder,
                    filterFields,
                })
            );
        } catch {
            // ignore storage write errors
        }
    }, [filterFields, tableSortColumn, tableSortOrder, visibleOptionalColumns]);

    useEffect(() => {
        setSelectedRowIndexes((prev) => prev.filter((idx) => idx >= 0 && idx < customEntries.length));
    }, [customEntries.length]);

    const watchedAudioPairs = Form.useWatch("audioPairs", form) as AudioPair[] | undefined;
    const watchedValues = Form.useWatch([], form) as FormValues | undefined;

    const audioPairSelectOptions = useMemo(() => {
        const byKey = new Map(customAudioOptions.map((option) => [option.key, option] as const));
        (watchedAudioPairs || []).forEach((pair) => {
            const audioId = (pair?.audio_id || "").trim();
            const hashValue = (pair?.hash || "").trim();
            if (!audioId || !hashValue) return;
            const key = buildAudioPairKey(audioId, hashValue);
            if (byKey.has(key)) return;
            byKey.set(key, {
                key,
                value: key,
                label: t("tonies.customEditor.audio.notInIndex", {
                    defaultValue: "Nicht im Custom-Audio-Index: {{audioId}}/{{hash}}",
                    audioId,
                    hash: hashValue,
                }),
                audio_id: audioId,
                hash: hashValue,
            });
        });
        return Array.from(byKey.values());
    }, [customAudioOptions, watchedAudioPairs]);

    const selectedEntry = useMemo(() => {
        if (selectedIndex === null || selectedIndex < 0 || selectedIndex >= customEntries.length) return null;
        return customEntries[selectedIndex];
    }, [customEntries, selectedIndex]);

    const selectedIsDeleted = useMemo(() => {
        if (!selectedEntry) return false;
        return deletedModelKeys.has(toModelKey(selectedEntry.model));
    }, [deletedModelKeys, selectedEntry]);

    const currentDraft = useMemo(() => toEntry((watchedValues || {}) as FormValues), [watchedValues]);

    const persistedByModel = useMemo(
        () =>
            new Map(
                persistedEntries.map((entry) => [toModelKey(entry.model), cloneEntry(entry)] as const)
            ),
        [persistedEntries]
    );

    const currentBaselineEntry = useMemo(() => {
        const modelKey = normalizeText(currentDraft.model).toLowerCase();
        return persistedByModel.get(modelKey) || null;
    }, [currentDraft.model, persistedByModel]);

    const isFieldChanged = (field: keyof CustomEntry) => {
        const draftValue = normalizeText(currentDraft[field] as string | undefined);
        if (!currentBaselineEntry) return draftValue.length > 0;
        const baseValue = normalizeText(currentBaselineEntry[field] as string | undefined);
        return draftValue !== baseValue;
    };

    const areAudioPairsChanged = useMemo(() => {
        const currentPairs = normalizeAudioPairs(currentDraft);
        if (!currentBaselineEntry) return currentPairs.length > 0;
        return !areStringArraysEqual(currentPairs, normalizeAudioPairs(currentBaselineEntry));
    }, [currentBaselineEntry, currentDraft]);

    const areTracksChanged = useMemo(() => {
        const currentTracks = normalizeTracks(currentDraft);
        if (!currentBaselineEntry) return currentTracks.length > 0;
        return !areStringArraysEqual(currentTracks, normalizeTracks(currentBaselineEntry));
    }, [currentBaselineEntry, currentDraft]);

    const changedInputStyle = (changed: boolean) =>
        changed
            ? ({
                  backgroundColor: "rgba(250, 173, 20, 0.18)",
                  borderColor: "#faad14",
              } as const)
            : undefined;

    const batchEditableFields: Array<keyof CustomEntry> = ["series", "release", "language", "category", "pic"];

    const effectiveEntries = useMemo(
        () =>
            customEntries.map((entry, index) =>
                selectedIndex !== null && index === selectedIndex ? ({ ...entry, ...currentDraft } as CustomEntry) : entry
            ),
        [currentDraft, customEntries, selectedIndex]
    );

    const hasBatchPreviewChange = (idx: number) => {
        if (selectedIndex === null) return false;
        if (idx === selectedIndex) return false;
        if (selectedRowIndexes.length <= 1) return false;
        if (!selectedRowIndexes.includes(selectedIndex)) return false;
        if (!selectedRowIndexes.includes(idx)) return false;
        const sourceEntry = effectiveEntries[selectedIndex];
        const targetEntry = effectiveEntries[idx];
        if (!sourceEntry || !targetEntry) return false;
        return batchEditableFields.some(
            (field) => normalizeText(sourceEntry[field] as string | undefined) !== normalizeText(targetEntry[field] as string | undefined)
        );
    };

    const modelDraftStatusByIndex = useMemo(() => {
        const status = new Map<number, "clean" | "changed" | "new" | "deleted">();
        customEntries.forEach((entry, index) => {
            const effectiveEntry =
                selectedIndex !== null && index === selectedIndex ? ({ ...entry, ...currentDraft } as CustomEntry) : entry;
            const modelKey = toModelKey(effectiveEntry.model);
            if (deletedModelKeys.has(modelKey)) {
                status.set(index, "deleted");
                return;
            }
            const persisted = persistedByModel.get(modelKey);
            if (!persisted) {
                status.set(index, "new");
                return;
            }
            const entryChanged =
                normalizeText(effectiveEntry.no) !== normalizeText(persisted.no) ||
                normalizeText(effectiveEntry.model) !== normalizeText(persisted.model) ||
                normalizeText(effectiveEntry.title) !== normalizeText(persisted.title) ||
                normalizeText(effectiveEntry.series) !== normalizeText(persisted.series) ||
                normalizeText(effectiveEntry.episodes) !== normalizeText(persisted.episodes) ||
                normalizeText(effectiveEntry.release) !== normalizeText(persisted.release) ||
                normalizeText(effectiveEntry.language) !== normalizeText(persisted.language) ||
                normalizeText(effectiveEntry.category) !== normalizeText(persisted.category) ||
                normalizeText(effectiveEntry.pic) !== normalizeText(persisted.pic) ||
                !areStringArraysEqual(normalizeAudioPairs(effectiveEntry), normalizeAudioPairs(persisted)) ||
                !areStringArraysEqual(normalizeTracks(effectiveEntry), normalizeTracks(persisted));
            status.set(index, entryChanged || hasBatchPreviewChange(index) ? "changed" : "clean");
        });
        return status;
    }, [customEntries, currentDraft, deletedModelKeys, effectiveEntries, persistedByModel, selectedIndex, selectedRowIndexes]);

    const statusSortWeight = (status: DraftStatus) => {
        if (status === "changed") return 0;
        if (status === "new") return 1;
        if (status === "deleted") return 2;
        return 3;
    };

    const sortValueForEntry = (entry: CustomEntry, status: DraftStatus, column: SortColumnKey) => {
        if (column === "status") return statusSortWeight(status);
        if (column === "title") return normalizeText(entry.title).toLowerCase();
        if (column === "episodes") return normalizeText(entry.episodes).toLowerCase();
        if (column === "release") return normalizeText(entry.release).toLowerCase();
        if (column === "language") return normalizeText(entry.language).toLowerCase();
        if (column === "category") return normalizeText(entry.category).toLowerCase();
        if (column === "no") return normalizeText(entry.no).toLowerCase();
        if (column === "series") return normalizeText(entry.series).toLowerCase();
        return normalizeText(entry.model).toLowerCase();
    };

    const filterValueForEntry = (entry: CustomEntry, status: DraftStatus, field: FilterFieldKey) => {
        if (field === "status") return status;
        if (field === "title") return normalizeText(entry.title);
        if (field === "episodes") return normalizeText(entry.episodes);
        if (field === "release") return normalizeText(entry.release);
        if (field === "language") return normalizeText(entry.language);
        if (field === "category") return normalizeText(entry.category);
        if (field === "no") return normalizeText(entry.no);
        if (field === "series") return normalizeText(entry.series);
        return normalizeText(entry.model);
    };

    const tableRows = useMemo(() => {
        const filterNeedle = filterText.trim().toLowerCase();
        const rows: TableRow[] = customEntries.map((_, idx) => ({
            idx,
            entry: effectiveEntries[idx],
            status: modelDraftStatusByIndex.get(idx) || "clean",
        }));
        const filteredRowsByText =
            filterNeedle.length === 0
                ? rows
                : rows.filter((row) =>
                      filterFields.some((field) =>
                          filterValueForEntry(row.entry, row.status, field).toLowerCase().includes(filterNeedle)
                      )
                  );
        const filteredRows = showChangesOnly
            ? filteredRowsByText.filter((row) => row.status !== "clean")
            : filteredRowsByText;

        const direction = tableSortOrder === "descend" ? -1 : 1;
        return filteredRows.sort((left, right) => {
            const leftSort = sortValueForEntry(left.entry, left.status, tableSortColumn);
            const rightSort = sortValueForEntry(right.entry, right.status, tableSortColumn);
            const bySort =
                tableSortColumn === "status"
                    ? (Number(leftSort) - Number(rightSort)) * direction
                    : String(leftSort).localeCompare(String(rightSort)) * direction;
            if (bySort !== 0) return bySort;
            return left.entry.model.localeCompare(right.entry.model) * direction;
        });
    }, [
        customEntries,
        effectiveEntries,
        filterFields,
        filterText,
        modelDraftStatusByIndex,
        showChangesOnly,
        tableSortColumn,
        tableSortOrder,
    ]);

    const changedCount = useMemo(() => tableRows.filter((row) => row.status !== "clean").length, [tableRows]);
    const hasUnsavedChanges = changedCount > 0 || deletedModelKeys.size > 0;

    const applySelectionForVisibleRows = (visibleRows: TableRow[], keys: React.Key[]) => {
        const visibleIndexes = new Set(visibleRows.map((row) => row.idx));
        const selectedFromVisible = keys
            .map((key) => Number(key))
            .filter((value) => Number.isInteger(value) && value >= 0 && value < customEntries.length);
        setSelectedRowIndexes((prev) => {
            const selectedOutsideVisible = prev.filter((idx) => !visibleIndexes.has(idx));
            return Array.from(new Set([...selectedOutsideVisible, ...selectedFromVisible])).filter(
                (idx) => idx >= 0 && idx < customEntries.length
            );
        });
    };

    const selectedValidIndexes = useMemo(
        () => selectedRowIndexes.filter((idx) => idx >= 0 && idx < customEntries.length),
        [customEntries.length, selectedRowIndexes]
    );
    const selectedDeletedIndexes = useMemo(
        () => selectedValidIndexes.filter((idx) => deletedModelKeys.has(toModelKey(effectiveEntries[idx]?.model))),
        [deletedModelKeys, effectiveEntries, selectedValidIndexes]
    );
    const selectedNonDeletedIndexes = useMemo(
        () => selectedValidIndexes.filter((idx) => !deletedModelKeys.has(toModelKey(effectiveEntries[idx]?.model))),
        [deletedModelKeys, effectiveEntries, selectedValidIndexes]
    );
    const hasSelection = selectedRowIndexes.length > 0;
    const isMultiSelectMode = selectedRowIndexes.length > 1;
    const onlyDeletedSelected = hasSelection && selectedNonDeletedIndexes.length === 0;
    const hasDeletedSelection = selectedDeletedIndexes.length > 0;

    const getStatusLabel = (status: DraftStatus) => {
        if (status === "clean") return t("common.clean", { defaultValue: "unverändert" });
        if (status === "new") return t("common.new", { defaultValue: "neu*" });
        if (status === "changed") return t("common.changed", { defaultValue: "geändert*" });
        return t("common.deleted", { defaultValue: "gelöscht*" });
    };


    const handleSelectEntry = (idx: number) => {
        if (idx < 0 || idx >= customEntries.length) return;
        const nextEntries = mergeCurrentFormIntoEntries(customEntries);
        setCustomEntries(nextEntries);
        setSelectedIndex(idx);
        form.setFieldsValue(toFormValues(nextEntries[idx]));
    };

    const handleDeleteEntry = () => {
        const materializedEntries = mergeCurrentFormIntoEntries(customEntries);
        setCustomEntries(materializedEntries);
        const targetIndexes = hasSelection
            ? selectedNonDeletedIndexes.filter((idx) => idx >= 0 && idx < materializedEntries.length)
            : selectedIndex !== null
              ? [selectedIndex]
              : [];
        if (targetIndexes.length === 0) return;
        setDeletedModelKeys((prev) => {
            const next = new Set(prev);
            targetIndexes.forEach((idx) => {
                next.add(toModelKey(materializedEntries[idx].model));
            });
            return next;
        });
    };

    const handleDeleteEntryByIndex = (idx: number) => {
        if (idx < 0 || idx >= customEntries.length) return;
        const materializedEntries = mergeCurrentFormIntoEntries(customEntries);
        setCustomEntries(materializedEntries);
        setDeletedModelKeys((prev) => {
            const next = new Set(prev);
            next.add(toModelKey(materializedEntries[idx].model));
            return next;
        });
    };

    const handleRestoreEntry = () => {
        const targetIndexes = hasSelection
            ? selectedDeletedIndexes
            : selectedEntry && deletedModelKeys.has(toModelKey(selectedEntry.model))
              ? [selectedIndex as number]
              : [];
        if (targetIndexes.length === 0) return;
        setDeletedModelKeys((prev) => {
            const next = new Set(prev);
            targetIndexes.forEach((idx) => {
                const entry = effectiveEntries[idx];
                if (!entry) return;
                next.delete(toModelKey(entry.model));
            });
            return next;
        });
    };

    const handleRestoreEntryByIndex = (idx: number) => {
        if (idx < 0 || idx >= effectiveEntries.length) return;
        const entry = effectiveEntries[idx];
        if (!entry) return;
        setDeletedModelKeys((prev) => {
            const next = new Set(prev);
            next.delete(toModelKey(entry.model));
            return next;
        });
    };

    const handleDuplicateEntry = () => {
        if (!selectedEntry) return;
        const materializedEntries = mergeCurrentFormIntoEntries(customEntries);
        const base = cloneEntry(materializedEntries[selectedIndex as number]);
        base.model = buildSuggestedModel(materializedEntries);
        if (base.title) {
            base.title = `${base.title} Kopie`;
        }
        const nextEntries = [...materializedEntries, base];
        setCustomEntries(nextEntries);
        setSelectedIndex(nextEntries.length - 1);
        setSelectedRowIndexes([nextEntries.length - 1]);
        form.setFieldsValue(toFormValues(base));
    };

    const handleDuplicateEntryByIndex = (idx: number) => {
        if (idx < 0 || idx >= customEntries.length) return;
        const materializedEntries = mergeCurrentFormIntoEntries(customEntries);
        const base = cloneEntry(materializedEntries[idx]);
        base.model = buildSuggestedModel(materializedEntries);
        if (base.title) {
            base.title = `${base.title} Kopie`;
        }
        const nextEntries = [...materializedEntries, base];
        setCustomEntries(nextEntries);
        setSelectedIndex(nextEntries.length - 1);
        form.setFieldsValue(toFormValues(base));
    };

    const handleDuplicateSelection = () => {
        const indexes = selectedNonDeletedIndexes.filter((idx) => idx >= 0 && idx < customEntries.length);
        if (indexes.length === 0) return;

        const materializedEntries = mergeCurrentFormIntoEntries(customEntries);
        const nextEntries = materializedEntries.map((entry) => cloneEntry(entry));
        const appendedIndexes: number[] = [];

        indexes.forEach((idx) => {
            const source = nextEntries[idx];
            if (!source) return;
            const duplicated = cloneEntry(source);
            duplicated.model = buildSuggestedModel(nextEntries);
            if (duplicated.title) {
                duplicated.title = `${duplicated.title} Kopie`;
            }
            nextEntries.push(duplicated);
            appendedIndexes.push(nextEntries.length - 1);
        });

        if (appendedIndexes.length === 0) return;
        setCustomEntries(nextEntries);
        setSelectedRowIndexes(appendedIndexes);
        setSelectedIndex(appendedIndexes[0]);
        form.setFieldsValue(toFormValues(nextEntries[appendedIndexes[0]]));
    };

    const buildSavePlan = async (): Promise<SavePlan> => {
        const { next, activeEntry } = await listWithCurrentDraft(selectedIsDeleted);
        const multiTargets = selectedNonDeletedIndexes.filter((idx) => idx >= 0 && idx < next.length);
        const nextWithBatchApplied = next.map((entry) => cloneEntry(entry));
        // Always use the latest visible draft values as batch source.
        const latestBatchSource = currentDraft;
        if (multiTargets.length > 1 && selectedIndex !== null) {
            multiTargets.forEach((idx) => {
                if (idx === selectedIndex) return;
                batchEditableFields.forEach((field) => {
                    (nextWithBatchApplied[idx] as any)[field] = (latestBatchSource as any)[field];
                });
            });
        }
        const nextWithoutDeleted = nextWithBatchApplied.filter((entry) => !deletedModelKeys.has(toModelKey(entry.model)));
        const validation = validateEntryList(nextWithoutDeleted);
        if (validation.error) {
            throw new Error(validation.error);
        }
        if (validation.baseWarning) {
            setValidationMessages((prev) => Array.from(new Set([...prev, validation.baseWarning])));
        }

        if (nextWithoutDeleted.length === 0) {
            throw new Error(t("tonies.customEditor.errors.emptyResult", { defaultValue: "Mindestens ein Modell muss erhalten bleiben." }));
        }

        const modelKey = (model: string) => model.trim().toLowerCase();
        const fingerprint = (entry: CustomEntry, withModel: boolean) =>
            JSON.stringify({
                ...entry,
                model: withModel ? entry.model : "",
            });

        const oldEntries = persistedEntries.map((entry) => cloneEntry(entry));
        const oldByModel = new Map(oldEntries.map((entry) => [modelKey(entry.model), entry] as const));
        const newByModel = new Map(nextWithoutDeleted.map((entry) => [modelKey(entry.model), entry] as const));

        const removedModels = oldEntries
            .map((entry) => entry.model)
            .filter((model) => !newByModel.has(modelKey(model)));
        const addedEntries = nextWithoutDeleted.filter((entry) => !oldByModel.has(modelKey(entry.model)));

        const addedByFingerprint = new Map<string, CustomEntry[]>();
        addedEntries.forEach((entry) => {
            const key = fingerprint(entry, false);
            const list = addedByFingerprint.get(key) || [];
            list.push(entry);
            addedByFingerprint.set(key, list);
        });

        const renameOps: Array<{ fromModel: string; toModel: string }> = [];
        const renamedSources = new Set<string>();
        const renamedTargets = new Set<string>();

        removedModels.forEach((fromModel) => {
            const oldEntry = oldByModel.get(modelKey(fromModel));
            if (!oldEntry) return;
            const key = fingerprint(oldEntry, false);
            const candidates = addedByFingerprint.get(key);
            const candidate = candidates && candidates.length > 0 ? candidates.shift() : undefined;
            if (!candidate) return;

            renameOps.push({ fromModel, toModel: candidate.model });
            renamedSources.add(modelKey(fromModel));
            renamedTargets.add(modelKey(candidate.model));
        });

        const upsertEntries: CustomEntry[] = [];
        nextWithoutDeleted.forEach((entry) => {
            const key = modelKey(entry.model);
            if (renamedTargets.has(key)) return;

            const oldEntry = oldByModel.get(key);
            if (!oldEntry) {
                upsertEntries.push(entry);
                return;
            }
            if (fingerprint(oldEntry, true) !== fingerprint(entry, true)) {
                upsertEntries.push(entry);
            }
        });

        const deleteModels = removedModels.filter((model) => !renamedSources.has(modelKey(model)));

        return {
            nextWithoutDeleted,
            activeEntry,
            renameOps,
            upsertEntries,
            deleteModels,
        };
    };

    const executeSavePlan = async (plan: SavePlan) => {
        const postJson = async (path: string, payload: unknown) => {
            const response = await api.apiPostTeddyCloudRaw(
                path,
                JSON.stringify(payload),
                undefined,
                undefined,
                { "Content-Type": "application/json" }
            );
            const responseText = await response.text();
            if (!response.ok) {
                throw new Error(responseText || `HTTP ${response.status}`);
            }
        };

        const { renameOps, upsertEntries, deleteModels, nextWithoutDeleted, activeEntry } = plan;
        for (const rename of renameOps) {
            await postJson("/api/toniesCustomJsonRename", rename);
        }
        if (upsertEntries.length > 0) {
            await postJson("/api/toniesCustomJsonUpsert", upsertEntries);
        }
        if (deleteModels.length > 0) {
            await postJson("/api/toniesCustomJsonDelete", { models: deleteModels });
        }

        setCustomEntries(nextWithoutDeleted);
        setPersistedEntries(nextWithoutDeleted.map((entry) => cloneEntry(entry)));
        setDeletedModelKeys(new Set());
        setSelectedRowIndexes((prev) => prev.filter((idx) => idx >= 0 && idx < nextWithoutDeleted.length));

        const activeModelKey = toModelKey(activeEntry.model);
        const activeStillExists = nextWithoutDeleted.some((entry) => toModelKey(entry.model) === activeModelKey);
        const modelToSelect = activeStillExists ? activeEntry.model : nextWithoutDeleted[0]?.model || "";
        if (modelToSelect) {
            setValue?.(modelToSelect);
            if (props?.onChange) props.onChange(modelToSelect);
        }
        return { model: modelToSelect, count: nextWithoutDeleted.length };
    };

    const handleDiscard = () => {
        setCustomEntries(persistedEntries.map((entry) => cloneEntry(entry)));
        setDeletedModelKeys(new Set());
        if (persistedEntries.length > 0) {
            setSelectedIndex(0);
            form.setFieldsValue(toFormValues(persistedEntries[0]));
            return;
        }
        void createAndSelectNewEntry([]);
    };

    const handleSave = async () => {
        setValidationMessages([]);
        setSaving(true);
        try {
            const plan = await buildSavePlan();
            const operationCount = plan.renameOps.length + plan.upsertEntries.length + plan.deleteModels.length;
            if (operationCount === 0) {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonies.customEditor.noChangesTitle", { defaultValue: "Keine Änderungen erkannt" }),
                    t("tonies.customEditor.noChangesBody", { defaultValue: "Es gibt aktuell nichts zu speichern." }),
                    t("tonies.customToniesEditorJsonEntry")
                );
                return;
            }
            setPendingSavePlan(plan);
            setPreflightOpen(true);
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.addNewCustomTonieModal.failedToCreate"),
                String(error),
                t("tonies.customToniesEditorJsonEntry")
            );
        } finally {
            setSaving(false);
        }
    };

    const handlePreflightConfirm = async () => {
        if (!pendingSavePlan) return;
        setSaving(true);
        try {
            const result = await executeSavePlan(pendingSavePlan);
            if (result.model) {
                onModelCreated?.(result.model);
            }
            addNotification(
                NotificationTypeEnum.Success,
                t("tonies.addNewCustomTonieModal.successfullyCreated"),
                t("tonies.customEditor.saveSuccessWithCount", {
                    defaultValue: "tonies.custom.json gespeichert ({{count}} Einträge). Sicherung und Neuladen wurden ausgelöst.",
                    count: result.count,
                }),
                t("tonies.customToniesEditorJsonEntry")
            );
            setPreflightOpen(false);
            setPendingSavePlan(null);
            await loadJsonData();
            await collectImagePaths();
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.addNewCustomTonieModal.failedToCreate"),
                String(error),
                t("tonies.customToniesEditorJsonEntry")
            );
        } finally {
            setSaving(false);
        }
    };

    const selectedPic = Form.useWatch("pic", form);
    const disablePerFieldInMultiSelect = {
        no: isMultiSelectMode,
        model: isMultiSelectMode,
        title: isMultiSelectMode,
        episodes: isMultiSelectMode,
        series: false,
        release: false,
        language: false,
        category: false,
        pic: false,
        audioPairs: isMultiSelectMode,
        tracks: isMultiSelectMode,
    } as const;

    const tableColumns = useMemo(
        () => [
            {
                title: t("tonies.customEditor.columns.image", { defaultValue: "Bild" }),
                key: "pic",
                width: 70,
                fixed: "left" as const,
                render: (_: unknown, row: TableRow) => {
                    const imageUrl = toPreviewableImageUrl(row.entry.pic);
                    if (!imageUrl) return "-";
                    const isBroken = brokenImageUrls.has(imageUrl);
                    return (
                        <button
                            type="button"
                            aria-label={t("tonies.customEditor.actions.preview", { defaultValue: "Vorschau" })}
                            onClick={(event) => {
                                event.stopPropagation();
                                setPreviewUrl(imageUrl);
                                setPreviewOpen(true);
                            }}
                            style={{
                                border: "1px solid #5a5a5a",
                                background: "transparent",
                                padding: 0,
                                cursor: "zoom-in",
                                width: 44,
                                height: 44,
                                borderRadius: 4,
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {isBroken ? (
                                <span style={{ display: "block", fontSize: 18, lineHeight: "44px", textAlign: "center" }}>🖼️</span>
                            ) : (
                                <img
                                    src={imageUrl}
                                    alt={row.entry.model}
                                    referrerPolicy="no-referrer"
                                    loading="lazy"
                                    decoding="async"
                                    onError={() =>
                                        setBrokenImageUrls((prev) => {
                                            const next = new Set(prev);
                                            next.add(imageUrl);
                                            return next;
                                        })
                                    }
                                    onLoad={() =>
                                        setBrokenImageUrls((prev) => {
                                            if (!prev.has(imageUrl)) return prev;
                                            const next = new Set(prev);
                                            next.delete(imageUrl);
                                            return next;
                                        })
                                    }
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: "100%",
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "scale-down",
                                        objectPosition: "center",
                                        backgroundColor: "transparent",
                                        display: "block",
                                    }}
                                />
                            )}
                        </button>
                    );
                },
            },
            {
                title: t("tonies.addNewCustomTonieModal.model"),
                key: "model",
                width: 220,
                fixed: "left" as const,
                sorter: true,
                sortOrder: tableSortColumn === "model" ? tableSortOrder || undefined : undefined,
                render: (_: unknown, row: TableRow) => (
                    <span
                        style={
                            row.status === "deleted"
                                ? { textDecoration: "line-through", textDecorationThickness: 2 }
                                : undefined
                        }
                    >
                        {row.entry.model}
                    </span>
                ),
            },
            {
                title: t("tonies.addNewCustomTonieModal.series"),
                key: "series",
                width: 200,
                ellipsis: true,
                sorter: true,
                sortOrder: tableSortColumn === "series" ? tableSortOrder || undefined : undefined,
                render: (_: unknown, row: TableRow) => row.entry.series || "-",
            },
            ...(visibleOptionalColumns.includes("title")
                ? [
                      {
                          title: t("tonies.addNewCustomTonieModal.formfieldTitle"),
                          key: "title",
                          width: 220,
                          ellipsis: true,
                          sorter: true,
                          sortOrder: tableSortColumn === "title" ? tableSortOrder || undefined : undefined,
                          render: (_: unknown, row: TableRow) => row.entry.title || "-",
                      },
                  ]
                : []),
            ...(visibleOptionalColumns.includes("episodes")
                ? [
                      {
                          title: t("tonies.addNewCustomTonieModal.episode"),
                          key: "episodes",
                          width: 160,
                          ellipsis: true,
                          sorter: true,
                          sortOrder: tableSortColumn === "episodes" ? tableSortOrder || undefined : undefined,
                          render: (_: unknown, row: TableRow) => row.entry.episodes || "-",
                      },
                  ]
                : []),
            ...(visibleOptionalColumns.includes("release")
                ? [
                      {
                          title: t("tonies.addNewCustomTonieModal.release"),
                          key: "release",
                          width: 120,
                          sorter: true,
                          sortOrder: tableSortColumn === "release" ? tableSortOrder || undefined : undefined,
                          render: (_: unknown, row: TableRow) => row.entry.release || "-",
                      },
                  ]
                : []),
            ...(visibleOptionalColumns.includes("language")
                ? [
                      {
                          title: t("tonies.addNewCustomTonieModal.language"),
                          key: "language",
                          width: 120,
                          sorter: true,
                          sortOrder: tableSortColumn === "language" ? tableSortOrder || undefined : undefined,
                          render: (_: unknown, row: TableRow) => row.entry.language || "-",
                      },
                  ]
                : []),
            ...(visibleOptionalColumns.includes("category")
                ? [
                      {
                          title: t("tonies.addNewCustomTonieModal.category"),
                          key: "category",
                          width: 150,
                          sorter: true,
                          sortOrder: tableSortColumn === "category" ? tableSortOrder || undefined : undefined,
                          render: (_: unknown, row: TableRow) => row.entry.category || "-",
                      },
                  ]
                : []),
            ...(visibleOptionalColumns.includes("no")
                ? [
                      {
                          title: t("tonies.addNewCustomTonieModal.no"),
                          key: "no",
                          width: 90,
                          sorter: true,
                          sortOrder: tableSortColumn === "no" ? tableSortOrder || undefined : undefined,
                          render: (_: unknown, row: TableRow) => row.entry.no || "-",
                      },
                  ]
                : []),
            ...(visibleOptionalColumns.includes("status")
                ? [
                      {
                          title: t("tonies.customEditor.columns.status", { defaultValue: "Status" }),
                          key: "status",
                          width: 130,
                          sorter: true,
                          sortOrder: tableSortColumn === "status" ? tableSortOrder || undefined : undefined,
                          render: (_: unknown, row: TableRow) => getStatusLabel(row.status),
                      },
                  ] : []),
            {
                title: t("tonies.customEditor.columns.actions", { defaultValue: "Aktionen" }),
                key: "actions",
                width: 210,
                render: (_: unknown, row: TableRow) => (
                    <Space size="small">
                        <Button size="small" onClick={() => handleSelectEntry(row.idx)}>
                            {t("tonies.customEditor.actions.edit", { defaultValue: "Bearbeiten" })}
                        </Button>
                        <Button size="small" onClick={() => handleDuplicateEntryByIndex(row.idx)}>
                            {t("tonies.customEditor.actions.duplicate", { defaultValue: "Duplizieren" })}
                        </Button>
                        {row.status === "deleted" ? (
                            <Button size="small" onClick={() => handleRestoreEntryByIndex(row.idx)}>
                                {t("tonies.customEditor.actions.restore", { defaultValue: "Wiederherstellen" })}
                            </Button>
                        ) : (
                            <Button size="small" danger onClick={() => handleDeleteEntryByIndex(row.idx)}>
                                {t("tonies.customEditor.actions.delete", { defaultValue: "Löschen" })}
                            </Button>
                        )}
                    </Space>
                ),
            },
        ],
        [brokenImageUrls, tableSortColumn, tableSortOrder, visibleOptionalColumns, getStatusLabel, t]
    );

    const editorBody = (
        <Row gutter={16}>
            <Col span={24}>
                <Typography.Title level={5} style={{ marginTop: 0 }}>
                    {t("tonies.customEditor.title", { defaultValue: "Modell-Editor" })}
                </Typography.Title>

                <div
                    style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 5,
                        background: "var(--ant-color-bg-container, #141414)",
                        border: "1px solid #303030",
                        borderRadius: 8,
                        padding: 10,
                        marginBottom: 10,
                    }}
                >
                    <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
                        <Space wrap>
                            <Button
                                type="primary"
                                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                                onClick={() => {
                                    const nextEntries = mergeCurrentFormIntoEntries(customEntries);
                                    void createAndSelectNewEntry(nextEntries);
                                }}
                            >
                                {t("tonies.customEditor.actions.newModel", { defaultValue: "Neues Modell" })}
                            </Button>
                            {isMultiSelectMode ? (
                                <>
                                    <Button onClick={handleDuplicateSelection} disabled={selectedNonDeletedIndexes.length === 0}>
                                        {t("tonies.customEditor.actions.duplicate", { defaultValue: "Duplizieren" })}
                                    </Button>
                                    {selectedNonDeletedIndexes.length > 0 ? (
                                        <Button danger onClick={handleDeleteEntry}>
                                            {t("tonies.customEditor.actions.deleteCount", {
                                                defaultValue: "{{count}} Modell(e) löschen",
                                                count: selectedNonDeletedIndexes.length,
                                            })}
                                        </Button>
                                    ) : null}
                                    {selectedDeletedIndexes.length > 0 ? (
                                        <Button onClick={handleRestoreEntry}>
                                            {t("tonies.customEditor.actions.restore", { defaultValue: "Wiederherstellen" })}
                                        </Button>
                                    ) : null}
                                </>
                            ) : null}
                        </Space>
                    </Space>
                </div>

                <Space wrap style={{ marginBottom: 8 }}>
                    <Input
                        autoFocus
                        allowClear
                        placeholder={t("tonies.customEditor.filterPlaceholder", { defaultValue: "Modelle filtern..." })}
                        value={filterText}
                        onChange={(event) => setFilterText(event.target.value)}
                        style={{ width: 240 }}
                    />
                    <Select<FilterFieldKey[]>
                        mode="multiple"
                        value={filterFields}
                        style={{ minWidth: 280 }}
                        onChange={(values) => {
                            const next = values.filter(
                                (value): value is FilterFieldKey =>
                                    [
                                        "series",
                                        "model",
                                        "title",
                                        "episodes",
                                        "release",
                                        "language",
                                        "category",
                                        "no",
                                        "status",
                                    ].includes(value)
                            );
                            setFilterFields(next.length > 0 ? next : ["series", "model"]);
                        }}
                        options={[
                            { value: "series", label: t("tonies.addNewCustomTonieModal.series") },
                            { value: "model", label: t("tonies.addNewCustomTonieModal.model") },
                            { value: "title", label: t("tonies.addNewCustomTonieModal.formfieldTitle") },
                            { value: "episodes", label: t("tonies.addNewCustomTonieModal.episode") },
                            { value: "release", label: t("tonies.addNewCustomTonieModal.release") },
                            { value: "language", label: t("tonies.addNewCustomTonieModal.language") },
                            { value: "category", label: t("tonies.addNewCustomTonieModal.category") },
                            { value: "no", label: t("tonies.addNewCustomTonieModal.no") },
                            { value: "status", label: t("tonies.customEditor.columns.status", { defaultValue: "Status" }) },
                        ]}
                    />
                    <Button
                        type={showChangesOnly ? "primary" : "default"}
                        onClick={() => {
                            setShowChangesOnly((prev) => !prev);
                            if (tableSortColumn !== "status") {
                                setTableSortColumn("status");
                                setTableSortOrder("ascend");
                            }
                        }}
                    >
                        {t("tonies.customEditor.actions.toggleChangesOnly", { defaultValue: "Nur Änderungen" })}
                    </Button>
                </Space>

                <div className="custom-tonie-table" style={{ border: "1px solid #303030", borderRadius: 8, padding: 8, marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <Typography.Text strong>{t("tonies.customEditor.modelsTitle", { defaultValue: "Modelle" })}</Typography.Text>
                        <Popover
                            trigger="click"
                            placement="bottomRight"
                            content={
                                <Space direction="vertical" size={10} style={{ minWidth: 260 }}>
                                    <Typography.Text strong>{t("tonies.customEditor.optionalColumns", { defaultValue: "Zusatzspalten" })}</Typography.Text>
                                    <Checkbox.Group
                                        value={visibleOptionalColumns}
                                        onChange={(values) =>
                                            setVisibleOptionalColumns(values.filter((value): value is OptionalColumnKey => typeof value === "string" && [
                                                "title",
                                                "episodes",
                                                "release",
                                                "language",
                                                "category",
                                                "no",
                                                "status",
                                            ].includes(value)))
                                        }
                                        options={[
                                            { label: t("tonies.addNewCustomTonieModal.formfieldTitle"), value: "title" },
                                            { label: t("tonies.addNewCustomTonieModal.episode"), value: "episodes" },
                                            { label: t("tonies.addNewCustomTonieModal.release"), value: "release" },
                                            { label: t("tonies.addNewCustomTonieModal.language"), value: "language" },
                                            { label: t("tonies.addNewCustomTonieModal.category"), value: "category" },
                                            { label: t("tonies.addNewCustomTonieModal.no"), value: "no" },
                                            { label: t("tonies.customEditor.columns.status", { defaultValue: "Status" }), value: "status" },
                                        ]}
                                    />
                                </Space>
                            }
                        >
                            <Button>{t("tonies.customEditor.tableMenu", { defaultValue: "Tabellen-Menü" })}</Button>
                        </Popover>
                    </div>

                    <Table<any>
                        size="small"
                        pagination={false}
                        scroll={{ y: 320, x: "max-content" }}
                        rowKey={(row) => String(row.idx)}
                        rowClassName={(row: TableRow) => {
                            const classes: string[] = [];
                            if (selectedIndex === row.idx) classes.push("custom-tonie-row-focused");
                            if (row.status === "deleted") classes.push("custom-tonie-row-deleted");
                            if (row.status === "new") classes.push("custom-tonie-row-new");
                            if (row.status === "changed") classes.push("custom-tonie-row-changed");
                            return classes.join(" ");
                        }}
                        rowSelection={{
                            selectedRowKeys: selectedRowIndexes.map((idx) => String(idx)),
                            onChange: (keys) => applySelectionForVisibleRows(tableRows, keys),
                        }}
                        onChange={(_, __, sorter: any) => {
                            const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;
                            if (!singleSorter?.columnKey) return;
                            const key = String(singleSorter.columnKey) as SortColumnKey;
                            if (
                                !["series", "model", "title", "episodes", "release", "language", "category", "no", "status"].includes(
                                    key
                                )
                            ) {
                                return;
                            }
                            setTableSortColumn(key);
                            setTableSortOrder(singleSorter.order || null);
                        }}
                        onRow={(row: TableRow) => {
                            const status = row.status;
                            return {
                                onClick: () => handleSelectEntry(row.idx),
                                style:
                                    selectedIndex === row.idx
                                        ? { backgroundColor: "rgba(22, 119, 255, 0.12)", cursor: "pointer" }
                                        : status === "deleted"
                                          ? { backgroundColor: "rgba(255, 77, 79, 0.08)", cursor: "pointer" }
                                          : status === "new"
                                            ? { backgroundColor: "rgba(82, 196, 26, 0.08)", cursor: "pointer" }
                                            : status === "changed"
                                              ? { backgroundColor: "rgba(250, 173, 20, 0.08)", cursor: "pointer" }
                                              : { cursor: "pointer" },
                            };
                        }}
                        columns={tableColumns}
                        dataSource={tableRows}
                    />
                </div>

                <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 8 }}
                    message={
                        selectedRowIndexes.length > 1
                            ? t("tonies.customEditor.selection.multiple", {
                                  defaultValue: "{{count}} Modelle ausgewählt",
                                  count: selectedRowIndexes.length,
                              })
                            : selectedEntry?.model
                              ? t("tonies.customEditor.selection.single", {
                                    defaultValue: "Ausgewähltes Modell: {{model}}",
                                    model: selectedEntry.model,
                                })
                              : t("tonies.customEditor.selection.none", { defaultValue: "Kein Modell ausgewählt" })
                    }
                    description={t("tonies.customEditor.selection.description", {
                        defaultValue: "Das Bearbeitungsformular unten gilt immer für die aktuelle Auswahl.",
                    })}
                />
                {isMultiSelectMode ? (
                    <Alert
                        type="warning"
                        showIcon
                        style={{ marginBottom: 8 }}
                        message={t("tonies.customEditor.batch.title", { defaultValue: "Batch-Bearbeitung aktiv" })}
                        description={t("tonies.customEditor.batch.description", {
                            defaultValue:
                                "Bei Mehrfachauswahl werden nur Serie, Release, Sprache, Kategorie und Bild auf alle ausgewählten Modelle angewendet.",
                        })}
                    />
                ) : null}
                {validationMessages.length > 0 ? (
                    <Alert
                        type="error"
                        showIcon
                        style={{ marginBottom: 8 }}
                        message={t("tonies.customEditor.validation.title", { defaultValue: "Bitte zuerst diese Probleme beheben" })}
                        description={
                            <Space direction="vertical">
                                {validationMessages.map((issue) => (
                                    <Typography.Text key={issue} type="danger">
                                        - {issue}
                                    </Typography.Text>
                                ))}
                                <Space>
                                    <Button size="small" onClick={() => form.scrollToField("series")}>
                                        {t("tonies.addNewCustomTonieModal.series")}
                                    </Button>
                                    <Button size="small" onClick={() => form.scrollToField("model")}>
                                        {t("tonies.addNewCustomTonieModal.model")}
                                    </Button>
                                    <Button size="small" onClick={() => form.scrollToField("audioPairs")}>
                                        {t("tonies.addNewCustomTonieModal.audioId")}
                                    </Button>
                                </Space>
                            </Space>
                        }
                    />
                ) : null}

                <Form<FormValues> form={form} layout="vertical" style={{ marginTop: 12 }} disabled={selectedIsDeleted || onlyDeletedSelected}>
                    <Row gutter={12}>
                        <Col span={8}>
                            <Form.Item
                                label={t("tonies.addNewCustomTonieModal.model")}
                                name="model"
                                rules={[
                                    { required: true, message: t("tonies.addNewCustomTonieModal.modelRequired") },
                                ]}
                            >
                                <Input disabled={disablePerFieldInMultiSelect.model} style={changedInputStyle(isFieldChanged("model"))} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label={t("tonies.addNewCustomTonieModal.series")}
                                name="series"
                                rules={[
                                    { required: true, message: t("tonies.addNewCustomTonieModal.seriesRequired") },
                                ]}
                            >
                                <Input disabled={disablePerFieldInMultiSelect.series} style={changedInputStyle(isFieldChanged("series"))} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label={t("tonies.addNewCustomTonieModal.episode")} name="episodes">
                                <Input disabled={disablePerFieldInMultiSelect.episodes} style={changedInputStyle(isFieldChanged("episodes"))} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Collapse
                        defaultActiveKey={["media", "metadata"]}
                        size="small"
                        style={{ marginBottom: 8 }}
                    >
                        <Collapse.Panel
                            key="media"
                            header={t("tonies.customEditor.sections.media", { defaultValue: "Medien und Bilder" })}
                        >

                    <Row gutter={12}>
                        <Col span={24}>
                            <Form.Item
                                label={
                                    <>
                                        {t("tonies.addNewCustomTonieModal.pic")}
                                        <Tooltip
                                            title={t("tonies.customEditor.picHint", {
                                                defaultValue:
                                                    "Extern: https://example.com/images/sample.png | Lokal: /custom_img/images/custom-tonies/sample-coin.png",
                                            })}
                                        >
                                            <InfoCircleOutlined style={{ marginLeft: 6 }} />
                                        </Tooltip>
                                    </>
                                }
                                name="pic"
                            >
                                <Input
                                    disabled={disablePerFieldInMultiSelect.pic}
                                    list="custom-image-options"
                                    style={changedInputStyle(isFieldChanged("pic"))}
                                    onFocus={runCollectImagePathsWhenNeeded}
                                />
                            </Form.Item>
                            <datalist id="custom-image-options">
                                {imagePathOptions.map((path) => (
                                    <option key={path} value={path} />
                                ))}
                            </datalist>
                            <Space style={{ marginBottom: 12 }}>
                                <Button disabled={disablePerFieldInMultiSelect.pic} onClick={() => setImageManagerOpen(true)}>
                                    {t("tonies.imageManager.title")}
                                </Button>
                                <Button
                                    onClick={() => {
                                        const pic = form.getFieldValue("pic");
                                        if (!pic) return;
                                        setPreviewUrl(toPreviewableImageUrl(pic));
                                        setPreviewOpen(true);
                                    }}
                                    disabled={!selectedPic}
                                >
                                    {t("tonies.customEditor.actions.preview", { defaultValue: "Vorschau" })}
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                        </Collapse.Panel>
                        <Collapse.Panel
                            key="metadata"
                            header={t("tonies.customEditor.sections.metadata", { defaultValue: "Optionale Metadaten" })}
                        >

                    <Row gutter={12}>
                        <Col span={8}>
                            <Form.Item label={t("tonies.addNewCustomTonieModal.no")} name="no">
                                <Input disabled={disablePerFieldInMultiSelect.no} style={changedInputStyle(isFieldChanged("no"))} />
                            </Form.Item>
                        </Col>
                        <Col span={16}>
                            <Form.Item label={t("tonies.addNewCustomTonieModal.formfieldTitle")} name="title">
                                <Input disabled={disablePerFieldInMultiSelect.title} style={changedInputStyle(isFieldChanged("title"))} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={12}>
                        <Col span={8}>
                            <Form.Item
                                label={t("tonies.addNewCustomTonieModal.release")}
                                name="release"
                                rules={[
                                    {
                                        validator: (_, value) => {
                                            const asString =
                                                value === undefined || value === null ? "" : String(value).trim();
                                            if (asString.length === 0 || /^[0-9]+$/.test(asString)) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(
                                                new Error(
                                                    t("tonies.customEditor.errors.releaseNumeric", {
                                                        defaultValue: "Release muss numerisch sein",
                                                    })
                                                )
                                            );
                                        },
                                    },
                                ]}
                            >
                                <Input disabled={disablePerFieldInMultiSelect.release} style={changedInputStyle(isFieldChanged("release"))} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label={t("tonies.addNewCustomTonieModal.language")} name="language">
                                <Input disabled={disablePerFieldInMultiSelect.language} style={changedInputStyle(isFieldChanged("language"))} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label={t("tonies.addNewCustomTonieModal.category")} name="category">
                                <Input disabled={disablePerFieldInMultiSelect.category} style={changedInputStyle(isFieldChanged("category"))} />
                            </Form.Item>
                        </Col>
                    </Row>
                        </Collapse.Panel>
                        <Collapse.Panel
                            key="audio"
                            header={t("tonies.customEditor.sections.audio", { defaultValue: "Audio-Zuordnung" })}
                        >

                    <Form.List name="audioPairs">
                        {(fields, { add, remove }) => (
                            <>
                                <div
                                    style={{
                                        border: areAudioPairsChanged ? "1px solid #faad14" : "1px solid transparent",
                                        borderRadius: 8,
                                        padding: areAudioPairsChanged ? 8 : 0,
                                        marginBottom: 8,
                                    }}
                                >
                                <Alert
                                    type="warning"
                                    showIcon
                                    style={{ marginBottom: 12 }}
                                    message={t("tonies.customEditor.coinWarning.title", { defaultValue: "Warnung zur Coin-Zuordnung" })}
                                    description={t("tonies.customEditor.coinWarning.description", {
                                        defaultValue:
                                            "Nutze für Coin-Zuordnungen keine offiziellen Audio-IDs. Das kann offizielle Tonies überschreiben. Verwende nur Audio aus deiner eigenen Custom-Bibliothek.",
                                    })}
                                />
                                {fields.map(({ key, name, ...restField }, idx) => (
                                    <Row key={key} gutter={12}>
                                        <Col span={10}>
                                            <Form.Item
                                                label={idx === 0 ? t("tonies.customEditor.audio.libraryLabel") : ""}
                                                shouldUpdate={(prev, next) =>
                                                    prev?.audioPairs?.[name]?.audio_id !== next?.audioPairs?.[name]?.audio_id ||
                                                    prev?.audioPairs?.[name]?.hash !== next?.audioPairs?.[name]?.hash
                                                }
                                            >
                                                {() => {
                                                    const audioId = (form.getFieldValue(["audioPairs", name, "audio_id"]) || "").trim();
                                                    const hashValue = (form.getFieldValue(["audioPairs", name, "hash"]) || "").trim();
                                                    const value =
                                                        audioId && hashValue ? buildAudioPairKey(audioId, hashValue) : undefined;
                                                    return (
                                                        <Select
                                                            value={value}
                                                            disabled={disablePerFieldInMultiSelect.audioPairs}
                                                            allowClear
                                                            showSearch
                                                            loading={customAudioOptionsLoading}
                                                            placeholder={t("tonies.customEditor.audio.placeholder", {
                                                                defaultValue: "Custom-Audio aus der Bibliothek wählen",
                                                            })}
                                                            optionFilterProp="label"
                                                            options={audioPairSelectOptions}
                                                            style={changedInputStyle(areAudioPairsChanged)}
                                                            onChange={(selected) => {
                                                                if (!selected) {
                                                                    form.setFieldValue(["audioPairs", name, "audio_id"], "");
                                                                    form.setFieldValue(["audioPairs", name, "hash"], "");
                                                                    return;
                                                                }
                                                                const option = audioPairSelectOptions.find((entry) => entry.value === selected);
                                                                if (!option) return;
                                                                form.setFieldValue(["audioPairs", name, "audio_id"], option.audio_id);
                                                                form.setFieldValue(["audioPairs", name, "hash"], option.hash);
                                                            }}
                                                        />
                                                    );
                                                }}
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, "audio_id"]}
                                                label={idx === 0 ? t("tonies.addNewCustomTonieModal.audioId") : ""}
                                            >
                                                <Input
                                                    disabled={disablePerFieldInMultiSelect.audioPairs}
                                                    style={changedInputStyle(areAudioPairsChanged)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, "hash"]}
                                                label={idx === 0 ? t("tonies.addNewCustomTonieModal.hash") : ""}
                                            >
                                                <Input
                                                    disabled={disablePerFieldInMultiSelect.audioPairs}
                                                    style={changedInputStyle(areAudioPairsChanged)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={2}>
                                            <Button
                                                disabled={disablePerFieldInMultiSelect.audioPairs}
                                                style={{ marginTop: idx === 0 ? 30 : 0 }}
                                                onClick={() => remove(name)}
                                            >
                                                -
                                            </Button>
                                        </Col>
                                    </Row>
                                ))}
                                <Button disabled={disablePerFieldInMultiSelect.audioPairs} type="dashed" onClick={() => add()} block>
                                    {t("tonies.addNewCustomTonieModal.addAudioIdHash")}
                                </Button>
                                </div>
                            </>
                        )}
                    </Form.List>
                        </Collapse.Panel>
                        <Collapse.Panel key="tracks" header={t("tonies.customEditor.sections.tracks", { defaultValue: "Tracks" })}>

                    <Form.List name="tracks">
                        {(fields, { add, remove }) => (
                            <>
                                <div
                                    style={{
                                        border: areTracksChanged ? "1px solid #faad14" : "1px solid transparent",
                                        borderRadius: 8,
                                        padding: areTracksChanged ? 8 : 0,
                                        marginBottom: 8,
                                    }}
                                >
                                {fields.map(({ key, name, ...restField }, idx) => (
                                    <Row key={key} gutter={12} style={{ marginTop: 8 }}>
                                        <Col span={22}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, "track"]}
                                                label={idx === 0 ? t("tonies.addNewCustomTonieModal.track") : ""}
                                            >
                                                <Input
                                                    disabled={disablePerFieldInMultiSelect.tracks}
                                                    style={changedInputStyle(areTracksChanged)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={2}>
                                            <Button
                                                disabled={disablePerFieldInMultiSelect.tracks}
                                                style={{ marginTop: idx === 0 ? 30 : 0 }}
                                                onClick={() => remove(name)}
                                            >
                                                -
                                            </Button>
                                        </Col>
                                    </Row>
                                ))}
                                <Button disabled={disablePerFieldInMultiSelect.tracks} type="dashed" onClick={() => add()} block>
                                    {t("tonies.addNewCustomTonieModal.addTrack")}
                                </Button>
                                </div>
                            </>
                        )}
                    </Form.List>
                        </Collapse.Panel>
                    </Collapse>
                </Form>
            </Col>
        </Row>
    );

    return (
        <>
            {embedded ? (
                <div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 8,
                            marginBottom: 12,
                        }}
                    >
                        <h1 style={{ margin: 0 }}>{t("tonies.customToniesEditorJsonEntry")}</h1>
                        <Space>
                            <Badge
                                status={hasUnsavedChanges ? "warning" : "success"}
                                text={
                                    hasUnsavedChanges
                                        ? t("tonies.customEditor.unsaved", {
                                              defaultValue: "{{count}} ungespeicherte Änderung(en)",
                                              count: changedCount,
                                          })
                                        : t("tonies.customEditor.savedState", { defaultValue: "Alle Änderungen gespeichert" })
                                }
                            />
                            <Button onClick={handleDiscard}>
                                {t("tonies.customEditor.actions.discard", { defaultValue: "Verwerfen" })}
                            </Button>
                            <Button type="primary" loading={saving || loading} onClick={handleSave}>
                                {t("tonies.addNewCustomTonieModal.save")}
                            </Button>
                        </Space>
                    </div>
                    {editorBody}
                </div>
            ) : (
                <Modal
                    title={t("tonies.customToniesEditorJsonEntry")}
                    open={open}
                    onCancel={onClose}
                    width={Math.max(Math.min(window.innerWidth * 0.92, 1500), 900)}
                    footer={
                        <Space>
                            <Badge
                                status={hasUnsavedChanges ? "warning" : "success"}
                                text={
                                    hasUnsavedChanges
                                        ? t("tonies.customEditor.unsaved", {
                                              defaultValue: "{{count}} ungespeicherte Änderung(en)",
                                              count: changedCount,
                                          })
                                        : t("tonies.customEditor.savedState", { defaultValue: "Alle Änderungen gespeichert" })
                                }
                            />
                            <Button onClick={handleDiscard}>
                                {t("tonies.customEditor.actions.discard", { defaultValue: "Verwerfen" })}
                            </Button>
                            <Button type="primary" loading={saving || loading} onClick={handleSave}>
                                {t("tonies.addNewCustomTonieModal.save")}
                            </Button>
                        </Space>
                    }
                    destroyOnClose
                >
                    {editorBody}
                </Modal>
            )}

            <ImageManagerModal
                open={imageManagerOpen}
                onClose={() => setImageManagerOpen(false)}
                initialSelection={form.getFieldValue("pic") || ""}
                onSelectImage={(path) => {
                    form.setFieldValue("pic", path);
                    void collectImagePaths();
                }}
            />

            <Modal
                title={t("tonies.customEditor.previewTitle", { defaultValue: "Bildvorschau" })}
                open={previewOpen}
                onCancel={() => setPreviewOpen(false)}
                footer={null}
            >
                {previewUrl ? <img src={previewUrl} alt="preview" referrerPolicy="no-referrer" style={{ width: "100%" }} /> : null}
            </Modal>
            <Modal
                title={t("tonies.customEditor.preflight.title", { defaultValue: "Änderungen vor dem Speichern prüfen" })}
                open={preflightOpen}
                onCancel={() => {
                    setPreflightOpen(false);
                    setPendingSavePlan(null);
                }}
                onOk={handlePreflightConfirm}
                okText={t("tonies.customEditor.preflight.confirm", { defaultValue: "Jetzt speichern" })}
                cancelText={t("common.cancel", { defaultValue: "Abbrechen" })}
                confirmLoading={saving}
            >
                <Space direction="vertical">
                    <Typography.Text>
                        {t("tonies.customEditor.preflight.description", {
                            defaultValue: "Bitte bestätige den Umfang dieses Speichervorgangs.",
                        })}
                    </Typography.Text>
                    <Typography.Text>
                        {t("tonies.customEditor.preflight.upserts", {
                            defaultValue: "Aktualisierungen/Neuanlagen: {{count}}",
                            count: pendingSavePlan?.upsertEntries.length || 0,
                        })}
                    </Typography.Text>
                    <Typography.Text>
                        {t("tonies.customEditor.preflight.renames", {
                            defaultValue: "Umbenennungen: {{count}}",
                            count: pendingSavePlan?.renameOps.length || 0,
                        })}
                    </Typography.Text>
                    <Typography.Text>
                        {t("tonies.customEditor.preflight.deletes", {
                            defaultValue: "Löschungen: {{count}}",
                            count: pendingSavePlan?.deleteModels.length || 0,
                        })}
                    </Typography.Text>
                </Space>
            </Modal>
        </>
    );
};

export default ToniesCustomJsonEditor;
