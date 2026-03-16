import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Button,
    Checkbox,
    Col,
    Collapse,
    Divider,
    Flex,
    Form,
    Grid,
    Input,
    Modal,
    Row,
    Space,
    theme,
    Tooltip,
    Typography,
} from "antd";
import {
    CloseOutlined,
    DeleteOutlined,
    EyeOutlined,
    FolderOpenOutlined,
    InfoCircleOutlined,
    RollbackOutlined,
} from "@ant-design/icons";

import { TonieCardProps } from "../../types/tonieTypes";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { useTeddyCloud } from "../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";
import SelectImageModal from "./common/modals/SelectImageModal";
import { EditCustomModelModal } from "./custommodel/modals/EditCustomModelModal";
import { SelectAudioModal } from "./common/modals/SelectAudioModal";
import { CustomModelFilterBar } from "./custommodel/CustomModelFilterBar";
import { CustomModelList } from "./custommodel/CustomModelList";
import { toPreviewableImageUrl } from "./common/utils/imagePathUtils";
import type {
    CustomEntry,
    FormValues,
    SortColumnKey,
    SortOrder,
    FilterFieldKey,
    PendingRenameSave,
    TableRow,
} from "./custommodel/types/customEditorTypes";
import {
    TABLE_SETTINGS_STORAGE_KEY,
    CUSTOM_EDITOR_PAGE_SIZE_KEY,
    ALLOWED_SORT_COLUMNS,
    ALLOWED_FILTER_FIELDS,
} from "./custommodel/types/customEditorTypes";
import {
    cloneEntry,
    normalizeText,
    normalizeAudioPairs,
    normalizeTracks,
    areStringArraysEqual,
    toModelKey,
    toFormValues,
    toEntry,
    buildSuggestedModel,
    sortValueForEntry,
    filterValueForEntry,
    isImageFile,
} from "./custommodel/utils/customEditorUtils";
import { toCustomImgWebPath } from "./common/utils/imagePathUtils";

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
    /** When true, show only the create form (no list). Used when adding model from EditTonieModal. */
    createOnly?: boolean;
    initialSelectedModel?: string;
    onModelCreated?: (model: string) => void;
}

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
    createOnly = false,
    initialSelectedModel = "",
    onModelCreated,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const { addNotification } = useTeddyCloud();
    const [form] = Form.useForm<FormValues>();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [customEntries, setCustomEntries] = useState<CustomEntry[]>([]);
    const [persistedEntries, setPersistedEntries] = useState<CustomEntry[]>([]);
    const [baseEntries, setBaseEntries] = useState<CustomEntry[]>([]);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const [imageManagerOpen, setImageManagerOpen] = useState(false);
    const [selectAudioModalOpen, setSelectAudioModalOpen] = useState(false);
    const [keySelectAudioFileBrowser, setKeySelectAudioFileBrowser] = useState(0);
    const [targetAudioPairIndex, setTargetAudioPairIndex] = useState<number | null>(null);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");

    const [imagePathOptions, setImagePathOptions] = useState<string[]>([]);
    const imagePathsCollectedRef = useRef(false);
    const [tableSortColumn, setTableSortColumn] = useState<SortColumnKey>("model");
    const [tableSortOrder, setTableSortOrder] = useState<SortOrder>("ascend");
    const [filterText, setFilterText] = useState("");
    const [filterFields, setFilterFields] = useState<FilterFieldKey[]>(["series", "model"]);
    const [seriesFilter, setSeriesFilter] = useState("");
    const [episodeFilter, setEpisodeFilter] = useState("");
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [filterCollapsed, setFilterCollapsed] = useState(true);
    const [modelListPage, setModelListPage] = useState(1);
    const [modelListPageSize, setModelListPageSize] = useState<number>(() => {
        try {
            const stored = localStorage.getItem(CUSTOM_EDITOR_PAGE_SIZE_KEY);
            if (stored) {
                const n = parseInt(stored, 10);
                if ([24, 48, 96, 192].includes(n)) return n;
            }
        } catch {
            /* ignore */
        }
        return 24;
    });
    const [paginationEnabled, setPaginationEnabled] = useState(true);
    const [renameConfirmOpen, setRenameConfirmOpen] = useState(false);
    const [renameConfirmSkipUpdate, setRenameConfirmSkipUpdate] = useState(false);
    const [pendingRenameSave, setPendingRenameSave] = useState<PendingRenameSave | null>(null);
    const [validationMessages, setValidationMessages] = useState<string[]>([]);
    const [brokenImageUrls, setBrokenImageUrls] = useState<Set<string>>(new Set());

    const mergeCurrentFormIntoEntries = (entries: CustomEntry[]) => {
        if (editIndex === null || editIndex < 0 || editIndex >= entries.length) {
            return entries.map((entry) => cloneEntry(entry));
        }
        const values = form.getFieldsValue(true) as FormValues;
        const draft = toEntry(values);
        const next = entries.map((entry) => cloneEntry(entry));
        next[editIndex] = draft;
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
                    error: t("tonies.addNewCustomTonieModal.modelRequired") + " (" + t("tonies.customEditor.errors.duplicateModel", { model: entry.model }) + ")",
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
                        error: t("tonies.customEditor.errors.duplicateAudioHash", { audioId: audioIds[j] }),
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
                baseWarning: t("tonies.customEditor.errors.modelExistsInBase", {
                    models: Array.from(new Set(baseWarningModels)).join(", "),
                }),
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
        setEditIndex(nextEntries.length - 1);
        form.setFieldsValue(toFormValues(newEntry));
        setEditModalOpen(true);
        return nextEntries;
    };

    const handleOpenEditModal = (idx: number) => {
        if (idx < 0 || idx >= customEntries.length) return;
        const nextEntries = mergeCurrentFormIntoEntries(customEntries);
        setCustomEntries(nextEntries);
        setEditIndex(idx);
        form.setFieldsValue(toFormValues(nextEntries[idx]));
        setEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        const nextEntries = mergeCurrentFormIntoEntries(customEntries);
        const currentEntry = editIndex !== null ? nextEntries[editIndex] : null;
        const isNewDuplicate =
            currentEntry &&
            !persistedEntries.some((e) => toModelKey(e.model) === toModelKey(currentEntry.model));
        if (isNewDuplicate) {
            setCustomEntries(nextEntries.filter((_, i) => i !== editIndex));
        } else {
            setCustomEntries(nextEntries);
        }
        setEditIndex(null);
        setEditModalOpen(false);
        if (createOnly) onClose();
    };

    const postJson = async (path: string, payload: unknown) => {
        const response = await api.apiPostTeddyCloudRaw(
            path,
            JSON.stringify(payload),
            undefined,
            undefined,
            { "Content-Type": "application/json" }
        );
        if (!response) {
            throw new Error("No response from server");
        }
        const responseText = await response.text();
        if (!response.ok) {
            throw new Error(responseText || `HTTP ${response.status}`);
        }
    };

    const handleSaveFromModal = async (silent = false) => {
        if (editIndex === null || editIndex < 0 || editIndex >= customEntries.length) return;
        try {
            await form.validateFields();
        } catch {
            return;
        }
        const values = form.getFieldsValue(true) as FormValues;
        const draft = toEntry(values);

        const validation = validateEntryList(customEntries.map((e, i) => (i === editIndex ? draft : e)));
        if (validation.error) {
            setValidationMessages([validation.error]);
            return;
        }

        const originalEntry = customEntries[editIndex];
        const isRename = originalEntry && toModelKey(originalEntry.model) !== toModelKey(draft.model);

        if (isRename && originalEntry) {
            setPendingRenameSave({ fromModel: originalEntry.model, toModel: draft.model, draft, silent });
            setRenameConfirmOpen(true);
            setRenameConfirmSkipUpdate(false);
            return;
        }

        await performSaveFromModal(draft, silent);
    };

    const formatApiError = (error: unknown): string => {
        const err = error as { cause?: { message?: string }; message?: string };
        const msg = err?.message ?? String(error);
        const cause = err?.cause?.message;
        if (cause && msg !== cause) {
            return `${msg} (${cause})`;
        }
        return msg;
    };

    const performSaveFromModal = async (draft: CustomEntry, silent: boolean) => {
        setSaving(true);
        try {
            await postJson("/api/toniesCustomJsonUpsert", draft);
            const next = customEntries.map((entry) => cloneEntry(entry));
            next[editIndex!] = draft;
            setCustomEntries(next);
            setPersistedEntries(next.map((e) => cloneEntry(e)));
            if (!silent) {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonies.teddystudio.labelSavedSuccesful"),
                    t("tonies.teddystudio.labelSavedSuccesfulDetails", { title: draft.series || draft.model }),
                    t("tonies.customEditor.title"),
                    undefined,
                    false
                );
            }
            setValue?.(draft.model);
            if (props?.onChange) props.onChange(draft.model);
            onModelCreated?.(draft.model);
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.addNewCustomTonieModal.failedToCreate"),
                formatApiError(error),
                t("tonies.customToniesEditorJsonEntry")
            );
        } finally {
            setSaving(false);
        }
    };

    const handleRenameConfirmOk = async () => {
        if (!pendingRenameSave) return;
        setSaving(true);
        try {
            await postJson("/api/toniesCustomJsonRename", {
                fromModel: pendingRenameSave.fromModel,
                toModel: pendingRenameSave.toModel,
                updateContentJson: !renameConfirmSkipUpdate,
            });
            await performSaveFromModal(pendingRenameSave.draft, pendingRenameSave.silent);
            addNotification(
                NotificationTypeEnum.Success,
                t("tonies.addNewCustomTonieModal.successfullyCreated"),
                t("tonies.customEditor.saveSuccessWithCount", {
                    count: customEntries.length,
                }),
                t("tonies.customToniesEditorJsonEntry")
            );
            setRenameConfirmOpen(false);
            setPendingRenameSave(null);
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.customEditor.renameFailed"),
                formatApiError(error),
                t("tonies.customToniesEditorJsonEntry")
            );
        } finally {
            setSaving(false);
        }
    };

    const handlePrevInModal = () => {
        if (editIndex === null || editIndex <= 0) return;
        const values = form.getFieldsValue(true) as FormValues;
        const draft = toEntry(values);
        const next = customEntries.map((entry) => cloneEntry(entry));
        next[editIndex] = draft;
        setCustomEntries(next);
        const newIdx = editIndex - 1;
        setEditIndex(newIdx);
        form.setFieldsValue(toFormValues(next[newIdx]));
    };

    const handleNextInModal = () => {
        if (editIndex === null || editIndex >= customEntries.length - 1) return;
        const values = form.getFieldsValue(true) as FormValues;
        const draft = toEntry(values);
        const next = customEntries.map((entry) => cloneEntry(entry));
        next[editIndex] = draft;
        setCustomEntries(next);
        const newIdx = editIndex + 1;
        setEditIndex(newIdx);
        form.setFieldsValue(toFormValues(next[newIdx]));
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
            setBaseEntries(normalizedBase);

            if (startInCreateMode) {
                void createAndSelectNewEntry(normalizedCustom);
                return;
            }

            const initialModelKey = toModelKey(initialSelectedModel);
            if (normalizedCustom.length > 0 && initialModelKey) {
                const selectedIdx = normalizedCustom.findIndex((entry) => toModelKey(entry.model) === initialModelKey);
                if (selectedIdx >= 0) {
                    setEditIndex(selectedIdx);
                    form.setFieldsValue(toFormValues(normalizedCustom[selectedIdx]));
                    setEditModalOpen(true);
                    return;
                }
            }

            if (normalizedCustom.length > 0) {
                setEditIndex(0);
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

    const isVisible = embedded || open;

    useEffect(() => {
        if (!isVisible) return;
        void loadJsonData();
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
                tableSortColumn?: SortColumnKey;
                tableSortOrder?: SortOrder;
                filterFields?: FilterFieldKey[];
                filterCollapsed?: boolean;
            };
            if (parsed.tableSortColumn && ALLOWED_SORT_COLUMNS.includes(parsed.tableSortColumn)) {
                setTableSortColumn(parsed.tableSortColumn);
            }
            if (parsed.tableSortOrder === "ascend" || parsed.tableSortOrder === "descend" || parsed.tableSortOrder === null) {
                setTableSortOrder(parsed.tableSortOrder);
            }
            if (Array.isArray(parsed.filterFields)) {
                const nextFilterFields = parsed.filterFields.filter(
                    (value): value is FilterFieldKey => ALLOWED_FILTER_FIELDS.includes(value as FilterFieldKey)
                );
                if (nextFilterFields.length > 0) {
                    setFilterFields(nextFilterFields);
                }
            }
            if (typeof parsed.filterCollapsed === "boolean") {
                setFilterCollapsed(parsed.filterCollapsed);
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
                    tableSortColumn,
                    tableSortOrder,
                    filterFields,
                    filterCollapsed,
                })
            );
        } catch {
            // ignore storage write errors
        }
    }, [filterCollapsed, filterFields, tableSortColumn, tableSortOrder]);


    const watchedValues = Form.useWatch([], form) as FormValues | undefined;

    const selectedEntry = useMemo(() => {
        if (editIndex === null || editIndex < 0 || editIndex >= customEntries.length) return null;
        return customEntries[editIndex];
    }, [customEntries, editIndex]);

    const selectedIsDeleted = false;

    const currentDraft = useMemo(() => toEntry((watchedValues || {}) as FormValues), [watchedValues]);

    const persistedByModel = useMemo(
        () =>
            new Map(
                persistedEntries.map((entry) => [toModelKey(entry.model), cloneEntry(entry)] as const)
            ),
        [persistedEntries]
    );

    const currentBaselineEntry = useMemo(() => {
        const originalEntry = editIndex !== null && editIndex >= 0 && editIndex < customEntries.length ? customEntries[editIndex] : null;
        const lookupModel = originalEntry ? originalEntry.model : currentDraft.model;
        const modelKey = normalizeText(lookupModel).toLowerCase();
        return persistedByModel.get(modelKey) || null;
    }, [currentDraft.model, customEntries, editIndex, persistedByModel]);

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
                  backgroundColor: token.colorWarningBg,
                  borderColor: token.colorWarningBorder,
              } as const)
            : undefined;

    const effectiveEntries = useMemo(
        () =>
            customEntries.map((entry, index) =>
                editIndex !== null && index === editIndex ? ({ ...entry, ...currentDraft } as CustomEntry) : entry
            ),
        [currentDraft, customEntries, editIndex]
    );

    const modelDraftStatusByIndex = useMemo(() => {
        const status = new Map<number, "clean" | "changed" | "new" | "deleted">();
        customEntries.forEach((entry, index) => {
            const effectiveEntry =
                editIndex !== null && index === editIndex ? ({ ...entry, ...currentDraft } as CustomEntry) : entry;
            const lookupModel = entry.model;
            const modelKey = toModelKey(lookupModel);
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
            status.set(index, entryChanged ? "changed" : "clean");
        });
        return status;
    }, [customEntries, currentDraft, effectiveEntries, persistedByModel, editIndex]);

    const sortValueForEntry = (entry: CustomEntry, column: SortColumnKey) => {
        if (column === "title") return normalizeText(entry.title).toLowerCase();
        if (column === "episodes") return normalizeText(entry.episodes).toLowerCase();
        if (column === "release") return normalizeText(entry.release).toLowerCase();
        if (column === "language") return normalizeText(entry.language).toLowerCase();
        if (column === "category") return normalizeText(entry.category).toLowerCase();
        if (column === "no") return normalizeText(entry.no).toLowerCase();
        if (column === "series") return normalizeText(entry.series).toLowerCase();
        return normalizeText(entry.model).toLowerCase();
    };

    const filterValueForEntry = (entry: CustomEntry, field: FilterFieldKey) => {
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
        const seriesNeedle = seriesFilter.trim().toLowerCase();
        const episodeNeedle = episodeFilter.trim().toLowerCase();
        const langSet = selectedLanguages.length > 0 ? new Set(selectedLanguages.map((l) => l.toLowerCase())) : null;

        const rows: TableRow[] = customEntries.map((_, idx) => ({
            idx,
            entry: effectiveEntries[idx],
            status: modelDraftStatusByIndex.get(idx) || "clean",
        }));

        let filtered = rows;

        if (filterNeedle.length > 0) {
            filtered = filtered.filter((row) =>
                filterFields.some((field) =>
                    String(filterValueForEntry(row.entry, field)).toLowerCase().includes(filterNeedle)
                )
            );
        }
        if (seriesNeedle.length > 0) {
            filtered = filtered.filter((row) =>
                normalizeText(row.entry.series).toLowerCase().includes(seriesNeedle)
            );
        }
        if (episodeNeedle.length > 0) {
            filtered = filtered.filter((row) =>
                normalizeText(row.entry.episodes).toLowerCase().includes(episodeNeedle)
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
            const leftSort = sortValueForEntry(left.entry, tableSortColumn);
            const rightSort = sortValueForEntry(right.entry, tableSortColumn);
            const bySort =
                String(leftSort).localeCompare(String(rightSort), undefined, { numeric: true }) * direction;
            if (bySort !== 0) return bySort;
            return left.entry.model.localeCompare(right.entry.model, undefined, { numeric: true }) * direction;
        });
    }, [
        customEntries,
        effectiveEntries,
        episodeFilter,
        filterFields,
        filterText,
        modelDraftStatusByIndex,
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

    const handleShowAll = () => {
        setModelListPageSize(tableRows.length);
        setModelListPage(1);
        setPaginationEnabled(false);
    };

    const handleShowPagination = () => {
        setModelListPageSize(24);
        localStorage.setItem(CUSTOM_EDITOR_PAGE_SIZE_KEY, "24");
        setModelListPage(1);
        setPaginationEnabled(true);
    };

    useEffect(() => {
        if (modelListPage > modelListTotalPages) {
            setModelListPage(modelListTotalPages);
        }
    }, [modelListPage, modelListTotalPages]);

    const handleDeleteEntryByIndex = async (idx: number) => {
        if (idx < 0 || idx >= customEntries.length) return;
        const entry = customEntries[idx];
        if (!entry) return;
        setSaving(true);
        try {
            await postJson("/api/toniesCustomJsonDelete", { models: [entry.model] });
            const next = customEntries.filter((_, i) => i !== idx);
            setCustomEntries(next);
            setPersistedEntries(next.map((e) => cloneEntry(e)));
            if (editIndex === idx) {
                setEditModalOpen(false);
                setEditIndex(null);
            } else if (editIndex !== null && editIndex > idx) {
                setEditIndex(editIndex - 1);
            }
            addNotification(
                NotificationTypeEnum.Success,
                t("tonies.customEditor.actions.delete"),
                t("tonies.customEditor.deleteConfirm.deleted", {
                    model: entry.model,
                }),
                t("tonies.customToniesEditorJsonEntry")
            );
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

    const handleDuplicateEntryByIndex = (idx: number) => {
        if (idx < 0 || idx >= customEntries.length) return;
        const materializedEntries = mergeCurrentFormIntoEntries(customEntries);
        const base = cloneEntry(materializedEntries[idx]);
        base.model = buildSuggestedModel(materializedEntries);
        if (base.title) {
            base.title = `${base.title} ${t("tonies.customEditor.duplicateTitleSuffix")}`;
        }
        const nextEntries = [...materializedEntries, base];
        setCustomEntries(nextEntries);
        setEditIndex(nextEntries.length - 1);
        setEditModalOpen(true);
        form.setFieldsValue(toFormValues(base));
    };


    const selectedPic = Form.useWatch("pic", form);
    const disablePerFieldInMultiSelect = {
        no: false,
        model: false,
        title: false,
        episodes: false,
        series: false,
        release: false,
        language: false,
        category: false,
        pic: false,
        audioPairs: false,
        tracks: false,
    } as const;

    const screens = Grid.useBreakpoint();
    const gridColumns = screens.xxl ? 6 : screens.xl ? 4 : screens.lg ? 3 : screens.md ? 2 : screens.sm ? 2 : 1;

    const editModalVisible = createOnly ? open : editModalOpen;

    const editorBody = (
        <Row gutter={16}>
            <Col span={24}>
                <CustomModelFilterBar
                    filterText={filterText}
                    setFilterText={setFilterText}
                    seriesFilter={seriesFilter}
                    setSeriesFilter={setSeriesFilter}
                    episodeFilter={episodeFilter}
                    setEpisodeFilter={setEpisodeFilter}
                    selectedLanguages={selectedLanguages}
                    setSelectedLanguages={setSelectedLanguages}
                    filterFields={filterFields}
                    setFilterFields={setFilterFields}
                    filterCollapsed={filterCollapsed}
                    setFilterCollapsed={setFilterCollapsed}
                />

                <CustomModelList
                    tableRows={tableRows}
                    paginatedRows={paginatedRows}
                    paginationEnabled={paginationEnabled}
                    modelListPage={modelListPage}
                    modelListPageSize={modelListPageSize}
                    modelListTotalPages={modelListTotalPages}
                    gridColumns={gridColumns}
                    token={token}
                    onMergeAndCreateNew={() => {
                        const nextEntries = mergeCurrentFormIntoEntries(customEntries);
                        void createAndSelectNewEntry(nextEntries);
                    }}
                    onEdit={handleOpenEditModal}
                    onDuplicate={handleDuplicateEntryByIndex}
                    onDelete={handleDeleteEntryByIndex}
                    onPreviewClick={(url) => {
                        setPreviewUrl(url);
                        setPreviewOpen(true);
                    }}
                    onShowAll={handleShowAll}
                    onShowPagination={handleShowPagination}
                    onPageChange={(page, size) => {
                        setModelListPage(page);
                        const newSize = size || modelListPageSize;
                        if (newSize !== modelListPageSize) {
                            setModelListPageSize(newSize);
                            localStorage.setItem(CUSTOM_EDITOR_PAGE_SIZE_KEY, String(newSize));
                            setModelListPage(1);
                        }
                    }}
                />
                {validationMessages.length > 0 ? (
                    <Alert
                        type="error"
                        showIcon
                        style={{ marginBottom: 8 }}
                        message={t("tonies.customEditor.validation.title")}
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

                <EditCustomModelModal
                    open={editModalVisible}
                    onCancel={handleCloseEditModal}
                    onSave={() => handleSaveFromModal(false)}
                    onSaveForNavigate={() => handleSaveFromModal(true)}
                    onPrev={handlePrevInModal}
                    onNext={handleNextInModal}
                    canGoPrev={!createOnly && editIndex !== null && editIndex > 0}
                    canGoNext={!createOnly && editIndex !== null && editIndex < customEntries.length - 1}
                    currentIndex={editIndex ?? 0}
                    totalItems={createOnly ? 1 : customEntries.length}
                    title={createOnly ? t("tonies.customEditor.editModalTitleCreate") : undefined}
                    hasChanges={() => {
                        if (editIndex === null) return false;
                        const draft = toEntry((form.getFieldsValue(true) as FormValues) || {});
                        const entry = customEntries[editIndex];
                        if (!entry) return true;
                        return (
                            normalizeText(draft.model) !== normalizeText(entry.model) ||
                            normalizeText(draft.series) !== normalizeText(entry.series) ||
                            normalizeText(draft.episodes) !== normalizeText(entry.episodes) ||
                            normalizeText(draft.pic) !== normalizeText(entry.pic) ||
                            !areStringArraysEqual(normalizeAudioPairs(draft), normalizeAudioPairs(entry)) ||
                            !areStringArraysEqual(normalizeTracks(draft), normalizeTracks(entry))
                        );
                    }}
                >
                <Form<FormValues> form={form} layout="vertical" style={{ marginTop: 12 }} disabled={selectedIsDeleted}>
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
                            header={t("tonies.customEditor.sections.media")}
                        >

                    <Row gutter={12}>
                        <Col span={24}>
                                    <Form.Item
                                label={
                                    <>
                                        {t("tonies.addNewCustomTonieModal.pic")}
                                            <Tooltip
                                            title={t("tonies.customEditor.picHint")}
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
                                    {t("tonies.imageManager.titleSelect")}
                                </Button>
                                <Tooltip title={t("tonies.customEditor.actions.preview")}>
                                    <Button
                                        icon={<EyeOutlined />}
                                        onClick={() => {
                                            const pic = form.getFieldValue("pic");
                                            if (!pic) return;
                                            setPreviewUrl(toPreviewableImageUrl(pic));
                                            setPreviewOpen(true);
                                        }}
                                        disabled={!selectedPic}
                                    />
                                </Tooltip>
                            </Space>
                                </Col>
                            </Row>
                        </Collapse.Panel>
                        <Collapse.Panel
                            key="metadata"
                            header={t("tonies.customEditor.sections.metadata")}
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
                                                    t("tonies.customEditor.errors.releaseNumeric")
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
                            header={t("tonies.customEditor.sections.audio")}
                        >

                    <Form.List name="audioPairs">
                                        {(fields, { add, remove }) => (
                                            <>
                                <div
                                    style={{
                                        border: areAudioPairsChanged ? `1px solid ${token.colorWarningBorder}` : "1px solid transparent",
                                        borderRadius: 8,
                                        padding: areAudioPairsChanged ? 8 : 0,
                                        marginBottom: 8,
                                    }}
                                >
                                <Alert
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: 12 }}
                                    message={t("tonies.customEditor.coinHint.title")}
                                    description={t("tonies.customEditor.coinHint.description")}
                                />
                                {fields.map(({ key, name, ...restField }, idx) => {
                                                    const baselineAudioId = currentBaselineEntry?.audio_id?.[idx] ?? "";
                                                    const baselineHash = currentBaselineEntry?.hash?.[idx] ?? "";
                                                    return (
                                    <Row key={key} gutter={12} style={{ marginTop: 8 }}>
                                        <Col span={10}>
                                            <Form.Item
                                                label={idx === 0 ? t("tonies.customEditor.audio.libraryLabel", { library: t("tonies.library.title") }) : ""}
                                                shouldUpdate={(prev, next) =>
                                                    prev?.audioPairs?.[name] !== next?.audioPairs?.[name]
                                                }
                                            >
                                                {() => {
                                                    const audioId = (form.getFieldValue(["audioPairs", name, "audio_id"]) || "").trim();
                                                    const hashValue = (form.getFieldValue(["audioPairs", name, "hash"]) || "").trim();
                                                    const pathValue = form.getFieldValue(["audioPairs", name, "path"]) || "";
                                                    const displayValue = pathValue || (audioId && hashValue ? `${audioId} / ${hashValue.slice(0, 8)}...` : "");
                                                    const isUnchanged = audioId === baselineAudioId && hashValue === baselineHash;
                                                    const handleClear = () => {
                                                        form.setFieldValue(["audioPairs", name, "audio_id"], "");
                                                        form.setFieldValue(["audioPairs", name, "hash"], "");
                                                        form.setFieldValue(["audioPairs", name, "path"], "");
                                                    };
                                                    const handleUndo = () => {
                                                        form.setFieldValue(["audioPairs", name, "audio_id"], baselineAudioId);
                                                        form.setFieldValue(["audioPairs", name, "hash"], baselineHash);
                                                        form.setFieldValue(["audioPairs", name, "path"], "");
                                                    };
                                                    const handleBrowse = () => {
                                                        setTargetAudioPairIndex(name);
                                                        setKeySelectAudioFileBrowser((k) => k + 1);
                                                        setSelectAudioModalOpen(true);
                                                    };
                                                    return (
                                                        <Input
                                                            value={displayValue}
                                                            disabled={disablePerFieldInMultiSelect.audioPairs}
                                                            placeholder={t("tonies.customEditor.audio.placeholder", {
                                                                library: t("tonies.library.title"),
                                                            })}
                                                            readOnly
                                                            style={changedInputStyle(areAudioPairsChanged)}
                                                            prefix={[
                                                                <CloseOutlined
                                                                    key="clear"
                                                                    onMouseDown={(e) => e.preventDefault()}
                                                                    onClick={handleClear}
                                                                />,
                                                                <Divider key="d1" orientation="vertical" style={{ marginLeft: 2 }} />,
                                                                <RollbackOutlined
                                                                    key="undo"
                                                                    onMouseDown={(e) => e.preventDefault()}
                                                                    onClick={handleUndo}
                                                                    style={{
                                                                        color: isUnchanged ? token.colorTextDisabled : token.colorText,
                                                                        cursor: isUnchanged ? "default" : "pointer",
                                                                    }}
                                                                />,
                                                                <Divider key="d2" orientation="vertical" style={{ marginLeft: 2 }} />,
                                                            ]}
                                                            suffix={
                                                                <FolderOpenOutlined
                                                                    onMouseDown={(e) => e.preventDefault()}
                                                                    onClick={handleBrowse}
                                                                    style={{ cursor: "pointer" }}
                                                                />
                                                            }
                                                        />
                                                    );
                                                }}
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item {...restField} name={[name, "audio_id"]} label={idx === 0 ? t("tonies.addNewCustomTonieModal.audioId") : ""}>
                                                <Input
                                                    disabled={disablePerFieldInMultiSelect.audioPairs}
                                                    placeholder="audio_id"
                                                    style={changedInputStyle(areAudioPairsChanged)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item {...restField} name={[name, "hash"]} label={idx === 0 ? t("tonies.addNewCustomTonieModal.hash") : ""}>
                                                <Input
                                                    disabled={disablePerFieldInMultiSelect.audioPairs}
                                                    placeholder="hash"
                                                    style={changedInputStyle(areAudioPairsChanged)}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={2}>
                                            <Form.Item label={idx === 0 ? " " : ""}>
                                                <Button disabled={disablePerFieldInMultiSelect.audioPairs} onClick={() => remove(name)}>
                                                    -
                                                </Button>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                                );
                                                })}
                                <Button
                                    disabled={disablePerFieldInMultiSelect.audioPairs}
                                    type="dashed"
                                    onClick={() => add({ audio_id: "", hash: "", path: "" })}
                                    block
                                >
                                    {t("tonies.addNewCustomTonieModal.addAudioIdHash")}
                                </Button>
                                </div>
                                            </>
                                        )}
                                    </Form.List>
                        </Collapse.Panel>
                        <Collapse.Panel key="tracks" header={t("tonies.customEditor.sections.tracks")}>

                    <Form.List name="tracks">
                                {(fields, { add, remove }) => (
                                    <>
                                <div
                                    style={{
                                        border: areTracksChanged ? `1px solid ${token.colorWarningBorder}` : "1px solid transparent",
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
                                <Button
                                    disabled={disablePerFieldInMultiSelect.tracks}
                                    type="dashed"
                                    onClick={() => add({ track: "" })}
                                    block
                                >
                                    {t("tonies.addNewCustomTonieModal.addTrack")}
                                </Button>
                                </div>
                                    </>
                                )}
                            </Form.List>
                        </Collapse.Panel>
                    </Collapse>
                </Form>
                </EditCustomModelModal>
                        </Col>
                    </Row>
    );

    const editModalContent = (
        <EditCustomModelModal
            open={editModalVisible}
            onCancel={handleCloseEditModal}
            onSave={() => handleSaveFromModal(false)}
            onSaveForNavigate={() => handleSaveFromModal(true)}
            onPrev={handlePrevInModal}
            onNext={handleNextInModal}
            canGoPrev={!createOnly && editIndex !== null && editIndex > 0}
            canGoNext={!createOnly && editIndex !== null && editIndex < customEntries.length - 1}
            currentIndex={editIndex ?? 0}
            totalItems={createOnly ? 1 : customEntries.length}
            title={createOnly ? t("tonies.customEditor.editModalTitleCreate") : undefined}
            hasChanges={() => {
                if (editIndex === null) return false;
                const draft = toEntry((form.getFieldsValue(true) as FormValues) || {});
                const entry = customEntries[editIndex];
                if (!entry) return true;
                return (
                    normalizeText(draft.model) !== normalizeText(entry.model) ||
                    normalizeText(draft.series) !== normalizeText(entry.series) ||
                    normalizeText(draft.episodes) !== normalizeText(entry.episodes) ||
                    normalizeText(draft.pic) !== normalizeText(entry.pic) ||
                    !areStringArraysEqual(normalizeAudioPairs(draft), normalizeAudioPairs(entry)) ||
                    !areStringArraysEqual(normalizeTracks(draft), normalizeTracks(entry))
                );
            }}
        >
            <Form<FormValues> form={form} layout="vertical" style={{ marginTop: 12 }} disabled={selectedIsDeleted}>
                <Row gutter={12}>
                    <Col span={8}>
                        <Form.Item
                            label={t("tonies.addNewCustomTonieModal.model")}
                            name="model"
                            rules={[{ required: true, message: t("tonies.addNewCustomTonieModal.modelRequired") }]}
                        >
                            <Input disabled={disablePerFieldInMultiSelect.model} style={changedInputStyle(isFieldChanged("model"))} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label={t("tonies.addNewCustomTonieModal.series")}
                            name="series"
                            rules={[{ required: true, message: t("tonies.addNewCustomTonieModal.seriesRequired") }]}
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
                <Collapse defaultActiveKey={["media", "metadata"]} size="small" style={{ marginBottom: 8 }}>
                    <Collapse.Panel
                        key="media"
                        header={t("tonies.customEditor.sections.media")}
                    >
                        <Row gutter={12}>
                            <Col span={24}>
                                <Form.Item
                                    label={
                                        <>
                                            {t("tonies.addNewCustomTonieModal.pic")}
                                            <Tooltip
                                                title={t("tonies.customEditor.picHint")}
                                            >
                                                <InfoCircleOutlined style={{ marginLeft: 6 }} />
                                            </Tooltip>
                                        </>
                                    }
                                    name="pic"
                                >
                                    <Input
                                        placeholder={t("tonies.addNewCustomTonieModal.picPlaceholder")}
                                        addonAfter={
                                            <Button
                                                type="link"
                                                size="small"
                                                icon={<FolderOpenOutlined />}
                                                onClick={() => setImageManagerOpen(true)}
                                            >
                                                {t("tonies.customEditor.actions.browse")}
                                            </Button>
                                        }
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={12}>
                            <Col span={24}>
                                <Form.Item
                                    label={t("tonies.customEditor.sections.audioAssignment")}
                                    tooltip={{
                                        title: t("tonies.customEditor.coinHint.description"),
                                    }}
                                >
                                    <Form.List name="audioPairs">
                                        {(fields, { add, remove }) => (
                                            <>
                                                {fields.map(({ key, name, ...restField }) => (
                                                    <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                                                        <Col flex="auto">
                                                            <Form.Item {...restField} name={[name, "audio_id"]} label={name === 0 ? t("tonies.addNewCustomTonieModal.audioId") : ""}>
                                                                <Input placeholder="431165001" />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col flex="auto">
                                                            <Form.Item {...restField} name={[name, "hash"]} label={name === 0 ? t("tonies.addNewCustomTonieModal.hash") : ""}>
                                                                <Input placeholder="65f6b9f4..." />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col>
                                                            <Button
                                                                type="text"
                                                                icon={<FolderOpenOutlined />}
                                                                onClick={() => {
                                                                    setTargetAudioPairIndex(name);
                                                                    setKeySelectAudioFileBrowser((k) => k + 1);
                                                                    setSelectAudioModalOpen(true);
                                                                }}
                                                            />
                                                        </Col>
                                                        <Col>
                                                            <Button type="text" icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                                        </Col>
                                                    </Row>
                                                ))}
                                                <Button type="dashed" onClick={() => add({ audio_id: "", hash: "", path: "" })} block>
                                                    {t("tonies.addNewCustomTonieModal.addAudioIdHash")}
                                                </Button>
                                            </>
                                        )}
                                    </Form.List>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Collapse.Panel>
                    <Collapse.Panel key="metadata" header={t("tonies.customEditor.sections.metadata")}>
                        <Form.Item label={t("tonies.addNewCustomTonieModal.no")} name="no">
                            <Input />
                        </Form.Item>
                        <Form.Item label={t("tonies.addNewCustomTonieModal.formfieldTitle")} name="title">
                            <Input />
                        </Form.Item>
                        <Form.Item label={t("tonies.addNewCustomTonieModal.release")} name="release">
                            <Input />
                        </Form.Item>
                        <Form.Item label={t("tonies.addNewCustomTonieModal.language")} name="language">
                            <Input />
                        </Form.Item>
                        <Form.Item label={t("tonies.addNewCustomTonieModal.category")} name="category">
                            <Input />
                        </Form.Item>
                    </Collapse.Panel>
                    <Collapse.Panel key="tracks" header={t("tonies.customEditor.sections.tracks")}>
                        <Form.List name="tracks">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                                            <Col flex="auto">
                                                <Form.Item {...restField} name={[name, "track"]} label={name === 0 ? t("tonies.addNewCustomTonieModal.track") : ""}>
                                                    <Input placeholder="0:00" />
                                                </Form.Item>
                                            </Col>
                                            <Col>
                                                <Button type="text" icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                            </Col>
                                        </Row>
                                    ))}
                                    <Button type="dashed" onClick={() => add({ track: "" })} block>
                                        {t("tonies.addNewCustomTonieModal.addTrack")}
                                    </Button>
                                </>
                            )}
                        </Form.List>
                    </Collapse.Panel>
                </Collapse>
            </Form>
        </EditCustomModelModal>
    );

    return (
        <>
            {createOnly ? (
                editModalContent
            ) : embedded ? (
                <div style={{ marginTop: 8 }}>
                    {editorBody}
                </div>
            ) : (
                <Modal
                    title={t("tonies.customToniesEditorJsonEntry")}
                    open={open}
                    onCancel={onClose}
                    width={Math.max(Math.min(window.innerWidth * 0.92, 1500), 900)}
                    footer={null}
                    destroyOnClose
                >
                    {editorBody}
                </Modal>
            )}

            <SelectImageModal
                open={imageManagerOpen}
                onClose={() => setImageManagerOpen(false)}
                title={t("tonies.imageManager.titleSelect")}
                initialSelection={form.getFieldValue("pic") || ""}
                onSelectImage={(path) => {
                    form.setFieldValue("pic", path);
                    void collectImagePaths();
                }}
            />

            <SelectAudioModal
                open={selectAudioModalOpen}
                onClose={() => {
                    setSelectAudioModalOpen(false);
                    setTargetAudioPairIndex(null);
                }}
                onSelect={(result) => {
                    if (targetAudioPairIndex !== null && result.audioId != null && result.hash != null) {
                        form.setFieldValue(["audioPairs", targetAudioPairIndex, "audio_id"], result.audioId);
                        form.setFieldValue(["audioPairs", targetAudioPairIndex, "hash"], result.hash);
                        form.setFieldValue(["audioPairs", targetAudioPairIndex, "path"], result.path);
                    }
                    setSelectAudioModalOpen(false);
                    setTargetAudioPairIndex(null);
                }}
                keySelectFileFileBrowser={keySelectAudioFileBrowser}
                requireTafHeader
            />

            <Modal
                title={t("tonies.customEditor.previewTitle")}
                open={previewOpen}
                onCancel={() => setPreviewOpen(false)}
                footer={null}
            >
                {previewUrl ? <img src={previewUrl} alt="preview" referrerPolicy="no-referrer" style={{ width: "100%" }} /> : null}
            </Modal>
            <Modal
                title={t("tonies.customEditor.renameConfirm.title")}
                open={renameConfirmOpen}
                onCancel={() => {
                    setRenameConfirmOpen(false);
                    setPendingRenameSave(null);
                }}
                onOk={() => void handleRenameConfirmOk()}
                okText={t("tonies.customEditor.renameConfirm.confirm")}
                cancelText={t("tonies.customEditor.renameConfirm.abort")}
                confirmLoading={saving}
            >
                <Space direction="vertical" style={{ width: "100%" }}>
                    <Typography.Text>
                        {t("tonies.customEditor.renameConfirm.description", {
                            from: pendingRenameSave?.fromModel ?? "",
                            to: pendingRenameSave?.toModel ?? "",
                        })}
                    </Typography.Text>
                    <Checkbox
                        checked={renameConfirmSkipUpdate}
                        onChange={(e) => setRenameConfirmSkipUpdate(e.target.checked)}
                    >
                        {t("tonies.customEditor.renameConfirm.skipUpdate")}
                    </Checkbox>
                </Space>
            </Modal>
        </>
    );
};

export default ToniesCustomJsonEditor;
