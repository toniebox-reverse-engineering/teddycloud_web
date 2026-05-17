import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Button,
    Checkbox,
    Col,
    Collapse,
    Flex,
    Form,
    Grid,
    Modal,
    Row,
    Space,
    theme,
    Typography,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";

import { TonieCardProps } from "../../../types/tonieTypes";
import { TeddyCloudApi } from "../../../api";
import { defaultAPIConfig } from "../../../config/defaultApiConfig";
import { useTeddyCloud } from "../../../provider/TeddyCloudProvider";
import { NotificationTypeEnum } from "../../../types/teddyCloudNotificationTypes";
import SelectImageModal from "../common/modals/SelectImageModal";
import { CustomModelEditModal } from "./modals/CustomModelEditModal";
import { SelectAudioModal } from "../common/modals/SelectAudioModal";
import { CustomModelFilters } from "./CustomModelFilters";
import { CustomModelList } from "./CustomModelList";
import { CustomModelForm } from "./CustomModelForm";
import type {
    CustomEntry,
    FormValues,
    SortColumnKey,
    SortOrder,
    FilterFieldKey,
    PendingRenameSave,
} from "./types/customModelEditorTypes";
import {
    TABLE_SETTINGS_STORAGE_KEY,
    CUSTOM_EDITOR_PAGE_SIZE_KEY,
    ALLOWED_SORT_COLUMNS,
    ALLOWED_FILTER_FIELDS,
} from "./types/customModelEditorTypes";
import {
    cloneEntry,
    normalizeText,
    normalizeEntryFromApi,
    normalizeAudioPairs,
    normalizeTracks,
    areStringArraysEqual,
    toModelKey,
    toFormValues,
    toEntry,
    buildSuggestedModel,
    isImageFile,
} from "./utils/customModelEditorUtils";
import { toCustomImgWebPath } from "../common/utils/imagePathUtils";
import { AudioLibraryPathInput } from "./input/AudioLibraryPathInput";
import { useCustomModelEditorTable } from "./hooks/useCustomModelEditorTable";

const api = new TeddyCloudApi(defaultAPIConfig());

type CustomModelEditorMode = "full" | "create-single" | "edit-single";
const CHANGED_TEXT_FIELDS: ReadonlySet<keyof CustomEntry> = new Set([
    "no",
    "model",
    "title",
    "series",
    "episodes",
    "release",
    "language",
    "category",
    "pic",
]);

interface CustomModelEditorProps {
    open: boolean;
    onClose: () => void;
    setValue?: (value: any) => void;
    props?: any;
    tonieCardProps?: TonieCardProps;
    audioId?: number;
    hash?: string;
    mode?: CustomModelEditorMode;
    initialModel?: string;
    onCreated?: (model: string, selectionText: string) => void;
    /** Called when model is saved/updated. */
    onUpdated?: (model: string, selectionText: string) => void;
    /** Overlay for library path resolution (e.g. toniebox content dir). */
    overlay?: string;
}

export const CustomModelEditor: React.FC<CustomModelEditorProps> = ({
    open,
    onClose,
    setValue,
    props,
    tonieCardProps,
    audioId,
    hash,
    mode = "full",
    initialModel = "",
    onCreated,
    onUpdated,
    overlay = "",
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const { addNotification, invalidateTonies } = useTeddyCloud();
    const [form] = Form.useForm<FormValues>();

    const [saving, setSaving] = useState(false);
    const [listLoading, setListLoading] = useState(false);

    const [customEntries, setCustomEntries] = useState<CustomEntry[]>([]);
    const [persistedEntries, setPersistedEntries] = useState<CustomEntry[]>([]);
    const [baseEntries, setBaseEntries] = useState<CustomEntry[]>([]);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("edit");

    const [imageManagerOpen, setImageManagerOpen] = useState(false);
    const [selectAudioModalOpen, setSelectAudioModalOpen] = useState(false);
    const [keySelectAudioFileBrowser, setKeySelectAudioFileBrowser] = useState(0);
    const [targetAudioPairIndex, setTargetAudioPairIndex] = useState<number | null>(null);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");

    const [imagePathOptions, setImagePathOptions] = useState<string[]>([]);
    const imagePathsCollectedRef = useRef(false);
    const [tableSortColumn, setTableSortColumn] = useState<SortColumnKey>("series");
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
            const modelKey = toModelKey(entry.model);
            if (modelMap.has(modelKey)) {
                return {
                    error:
                        t("tonies.addNewCustomTonieModal.modelRequired") +
                        " (" +
                        t("tonies.customEditor.errors.duplicateModel", { model: entry.model }) +
                        ")",
                    baseWarning: "",
                };
            }
            modelMap.set(modelKey, i);

            const audioIds = entry.audio_id || [];
            const hashes = entry.hash || [];
            for (let j = 0; j < Math.min(audioIds.length, hashes.length); j++) {
                const pair = `${normalizeText(audioIds[j])}::${normalizeText(hashes[j]).toLowerCase()}`;
                if (pairMap.has(pair)) {
                    return {
                        error: t("tonies.customEditor.errors.duplicateAudioHash", {
                            audioId: audioIds[j],
                        }),
                        baseWarning: "",
                    };
                }
                pairMap.set(pair, entry.model);
            }
        }

        const baseModelSet = new Set(baseEntries.map((entry) => toModelKey(entry.model)));
        const baseWarningModels = entries
            .filter((entry) => baseModelSet.has(toModelKey(entry.model)))
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

    const categoryOptions = useMemo(() => {
        const counts = new Map<string, number>();
        const addCategory = (value?: unknown) => {
            const normalized = normalizeText(value);
            if (!normalized) return;
            counts.set(normalized, (counts.get(normalized) || 0) + 1);
        };

        for (const entry of customEntries) addCategory(entry?.category);
        for (const entry of baseEntries) addCategory(entry?.category);

        return Array.from(counts.entries())
            .sort((a, b) => {
                if (b[1] !== a[1]) return b[1] - a[1];
                return a[0].localeCompare(b[0]);
            })
            .map(([category]) => category);
    }, [customEntries, baseEntries]);

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
        setModalMode("create");
        setEditModalOpen(true);
        return nextEntries;
    };

    const handleOpenEditModal = (idx: number) => {
        if (idx < 0 || idx >= customEntries.length) return;
        const nextEntries = mergeCurrentFormIntoEntries(customEntries);
        setCustomEntries(nextEntries);
        setEditIndex(idx);
        form.setFieldsValue(toFormValues(nextEntries[idx]));
        setModalMode("edit");
        setEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        if (editIndex === null || editIndex < 0 || editIndex >= customEntries.length) {
            setEditIndex(null);
            setEditModalOpen(false);
            if (mode !== "full") onClose();
            return;
        }
        const currentEntry = customEntries[editIndex];
        const isNewEntry =
            currentEntry &&
            !persistedEntries.some((e) => toModelKey(e.model) === toModelKey(currentEntry.model));
        if (isNewEntry) {
            setCustomEntries(customEntries.filter((_, i) => i !== editIndex));
        } else {
            const next = customEntries.map((entry, i) =>
                i === editIndex ? cloneEntry(persistedEntries[editIndex]) : cloneEntry(entry),
            );
            setCustomEntries(next);
        }
        setEditIndex(null);
        setEditModalOpen(false);
        if (mode !== "full") onClose();
    };

    const postJson = async (path: string, payload: unknown) => {
        const response = await api.apiPostTeddyCloudRaw(
            path,
            JSON.stringify(payload),
            undefined,
            undefined,
            {
                "Content-Type": "application/json",
            },
        );
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

        const validation = validateEntryList(
            customEntries.map((e, i) => (i === editIndex ? draft : e)),
        );
        if (validation.error) {
            setValidationMessages([validation.error]);
            return;
        }

        const originalEntry = customEntries[editIndex];
        const isNewEntry = !persistedEntries.some(
            (e) => toModelKey(e.model) === toModelKey(originalEntry.model),
        );
        const isRename =
            !isNewEntry &&
            originalEntry &&
            normalizeText(originalEntry.model) !== normalizeText(draft.model);

        if (isRename && originalEntry) {
            setPendingRenameSave({
                fromModel: originalEntry.model,
                toModel: draft.model,
                draft,
                silent,
            });
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
                    t("tonies.customEditor.modelSavedSuccessful", {
                        title: draft.series || draft.model,
                    }),
                    t("tonies.customEditor.modelSavedSuccessful", {
                        title: draft.series || draft.model,
                    }),
                    t("tonies.customEditor.title"),
                    undefined,
                    false,
                );
            }
            // In create-model flow (opened from Tonie edit), avoid refreshing the Tonie list
            // to keep the parent edit modal/state stable until the user explicitly saves there.
            if (mode !== "create-single") {
                invalidateTonies();
            }
            setValue?.(draft.model);
            if (props?.onChange) props.onChange(draft.model);
            const selectionText =
                `[${draft.model}] ${draft.series || ""}${draft.episodes ? ` - ${draft.episodes}` : ""}`.trim();
            onCreated?.(draft.model, selectionText);
            onUpdated?.(draft.model, selectionText);
            setEditModalOpen(false);
            setEditIndex(null);
            if (mode !== "full") onClose();
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.addNewCustomTonieModal.failedToCreate"),
                formatApiError(error),
                t("tonies.customToniesEditorJsonEntry"),
            );
        } finally {
            setSaving(false);
        }
    };

    const handleRenameConfirmOk = async () => {
        if (!pendingRenameSave) return;
        setSaving(true);
        try {
            const payload = {
                fromModel: pendingRenameSave.fromModel,
                toModel: pendingRenameSave.toModel,
                updateContentJson: !renameConfirmSkipUpdate,
            };
            await postJson("/api/toniesCustomJsonRename", payload);
            await performSaveFromModal(pendingRenameSave.draft, pendingRenameSave.silent);
            addNotification(
                NotificationTypeEnum.Success,
                t("tonies.addNewCustomTonieModal.successfullyCreated"),
                t("tonies.customEditor.saveSuccessWithCount", {
                    count: customEntries.length,
                }),
                t("tonies.customToniesEditorJsonEntry"),
            );
            setRenameConfirmOpen(false);
            setPendingRenameSave(null);
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.customEditor.renameFailed"),
                formatApiError(error),
                t("tonies.customToniesEditorJsonEntry"),
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
        setListLoading(true);
        try {
            const [customResponse, baseResponse] = await Promise.all([
                api.apiGetTeddyCloudApiRaw("/api/toniesCustomJson"),
                api.apiGetTeddyCloudApiRaw("/api/toniesJson"),
            ]);

            const [customData, baseData] = await Promise.all([
                customResponse.json(),
                baseResponse.json(),
            ]);
            const normalizedCustom = Array.isArray(customData)
                ? customData.map((entry) => normalizeEntryFromApi(entry))
                : [];
            const normalizedBase = Array.isArray(baseData)
                ? baseData.map((entry) => normalizeEntryFromApi(entry))
                : [];
            setCustomEntries(normalizedCustom);
            setPersistedEntries(normalizedCustom);
            setBaseEntries(normalizedBase);

            if (mode === "create-single") {
                void createAndSelectNewEntry(normalizedCustom);
                return;
            }

            const initialModelKey = toModelKey(initialModel);
            if (normalizedCustom.length > 0 && initialModelKey) {
                const selectedIdx = normalizedCustom.findIndex(
                    (entry) => toModelKey(entry.model) === initialModelKey,
                );
                if (selectedIdx >= 0) {
                    setEditIndex(selectedIdx);
                    form.setFieldsValue(toFormValues(normalizedCustom[selectedIdx]));
                    setModalMode("edit");
                    setEditModalOpen(true);
                    return;
                }
            }

            if (normalizedCustom.length === 0) {
                void createAndSelectNewEntry(normalizedCustom);
            }
            // When just loading the page (no initialModel): keep editIndex null so the list
            // shows correct data without any draft merge. User opens edit via card click.
        } catch (error) {
            const maybeErrorFields = (error as any)?.errorFields as
                | Array<{ errors?: string[] }>
                | undefined;
            if (Array.isArray(maybeErrorFields) && maybeErrorFields.length > 0) {
                const issues = maybeErrorFields
                    .flatMap((item) => item.errors || [])
                    .filter(Boolean);
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
                t("tonies.customToniesEditorJsonEntry"),
            );
        } finally {
            setListLoading(false);
        }
    };

    const collectImagePaths = async () => {
        const discovered: string[] = [];
        const fetchDir = async (current: string): Promise<string[]> => {
            const subdirs: string[] = [];
            try {
                const response = await api.apiGetTeddyCloudApiRaw(
                    `/api/fileIndexV2?path=${encodeURIComponent(current)}&special=custom_img`,
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

    const isVisible = open;

    useEffect(() => {
        if (!isVisible) return;
        void loadJsonData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialModel, isVisible, mode]);

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
            if (
                parsed.tableSortOrder === "ascend" ||
                parsed.tableSortOrder === "descend" ||
                parsed.tableSortOrder === null
            ) {
                setTableSortOrder(parsed.tableSortOrder);
            }
            if (Array.isArray(parsed.filterFields)) {
                const nextFilterFields = parsed.filterFields.filter(
                    (value): value is FilterFieldKey =>
                        ALLOWED_FILTER_FIELDS.includes(value as FilterFieldKey),
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
                }),
            );
        } catch {
            // ignore storage write errors
        }
    }, [filterCollapsed, filterFields, tableSortColumn, tableSortOrder]);

    const watchedValues = Form.useWatch([], form) as FormValues | undefined;

    const selectedIsDeleted = false;

    const currentDraft = useMemo(
        () => toEntry((watchedValues || {}) as FormValues),
        [watchedValues],
    );

    const persistedByModel = useMemo(
        () =>
            new Map(
                persistedEntries.map(
                    (entry) => [toModelKey(entry.model), cloneEntry(entry)] as const,
                ),
            ),
        [persistedEntries],
    );

    const currentBaselineEntry = useMemo(() => {
        const originalEntry =
            editIndex !== null && editIndex >= 0 && editIndex < customEntries.length
                ? customEntries[editIndex]
                : null;
        const lookupModel = originalEntry ? originalEntry.model : currentDraft.model;
        const modelKey = toModelKey(lookupModel);
        return persistedByModel.get(modelKey) || null;
    }, [currentDraft.model, customEntries, editIndex, persistedByModel]);

    const isFieldChanged = (field: PropertyKey) => {
        if (!currentBaselineEntry) return false;
        if (typeof field !== "string") return false;
        if (!CHANGED_TEXT_FIELDS.has(field as keyof CustomEntry)) return false;
        const typedField = field as keyof CustomEntry;
        const draftValue = normalizeText(currentDraft[typedField] as string | undefined);
        const baseValue = normalizeText(currentBaselineEntry[typedField] as string | undefined);
        return draftValue !== baseValue;
    };

    const areAudioPairsChanged = useMemo(() => {
        if (!currentBaselineEntry) return false;
        const currentPairs = normalizeAudioPairs(currentDraft);
        return !areStringArraysEqual(currentPairs, normalizeAudioPairs(currentBaselineEntry));
    }, [currentBaselineEntry, currentDraft]);

    const areTracksChanged = useMemo(() => {
        if (!currentBaselineEntry) return false;
        const currentTracks = normalizeTracks(currentDraft);
        return !areStringArraysEqual(currentTracks, normalizeTracks(currentBaselineEntry));
    }, [currentBaselineEntry, currentDraft]);

    const changedInputStyle = (changed: boolean) =>
        changed
            ? ({
                  backgroundColor: token.colorWarningBg,
                  borderColor: token.colorWarningBorder,
              } as const)
            : undefined;

    const modelDraftStatusByIndex = useMemo(() => {
        const status = new Map<number, "clean" | "changed" | "new" | "deleted">();
        customEntries.forEach((entry, index) => {
            const effectiveEntry =
                editIndex !== null && index === editIndex
                    ? ({ ...entry, ...currentDraft } as CustomEntry)
                    : entry;
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
                !areStringArraysEqual(
                    normalizeAudioPairs(effectiveEntry),
                    normalizeAudioPairs(persisted),
                ) ||
                !areStringArraysEqual(normalizeTracks(effectiveEntry), normalizeTracks(persisted));
            status.set(index, entryChanged ? "changed" : "clean");
        });
        return status;
    }, [customEntries, currentDraft, persistedByModel, editIndex]);

    const { tableRows, paginatedRows, modelListTotalPages } = useCustomModelEditorTable({
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
    });

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
            invalidateTonies();
            addNotification(
                NotificationTypeEnum.Success,
                t("tonies.customEditor.actions.delete"),
                t("tonies.customEditor.deleteConfirm.deleted", {
                    model: entry.model,
                }),
                t("tonies.customToniesEditorJsonEntry"),
            );
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.addNewCustomTonieModal.failedToCreate"),
                String(error),
                t("tonies.customToniesEditorJsonEntry"),
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
    const gridColumns = screens.xxl
        ? 6
        : screens.xl
          ? 4
          : screens.lg
            ? 3
            : screens.md
              ? 2
              : screens.sm
                ? 2
                : 1;

    const singleFormMode = mode === "create-single" || mode === "edit-single";
    const inlineMode = mode === "full" || singleFormMode;
    const editModalVisible = singleFormMode ? open : editModalOpen;
    const hasEditChanges = () => {
        if (editIndex === null) return false;
        const draft = toEntry((form.getFieldsValue(true) as FormValues) || {});
        const entry = customEntries[editIndex];
        if (!entry) return true;
        return (
            normalizeText(draft.model) !== normalizeText(entry.model) ||
            normalizeText(draft.title) !== normalizeText(entry.title) ||
            normalizeText(draft.series) !== normalizeText(entry.series) ||
            normalizeText(draft.episodes) !== normalizeText(entry.episodes) ||
            normalizeText(draft.release) !== normalizeText(entry.release) ||
            normalizeText(draft.language) !== normalizeText(entry.language) ||
            normalizeText(draft.category) !== normalizeText(entry.category) ||
            normalizeText(draft.no) !== normalizeText(entry.no) ||
            normalizeText(draft.pic) !== normalizeText(entry.pic) ||
            !areStringArraysEqual(normalizeAudioPairs(draft), normalizeAudioPairs(entry)) ||
            !areStringArraysEqual(normalizeTracks(draft), normalizeTracks(entry))
        );
    };

    const editModelFormContent = (
        <CustomModelForm
            form={form}
            selectedIsDeleted={selectedIsDeleted}
            disablePerFieldInMultiSelect={disablePerFieldInMultiSelect}
            changedInputStyle={changedInputStyle}
            isFieldChanged={isFieldChanged}
            runCollectImagePathsWhenNeeded={runCollectImagePathsWhenNeeded}
            imagePathOptions={imagePathOptions}
            categoryOptions={categoryOptions}
            selectedPic={selectedPic ?? ""}
            setImageManagerOpen={setImageManagerOpen}
            setPreviewUrl={setPreviewUrl}
            setPreviewOpen={setPreviewOpen}
            areAudioPairsChanged={areAudioPairsChanged}
            areTracksChanged={areTracksChanged}
            warningBorderColor={token.colorWarningBorder}
            currentBaselineEntry={currentBaselineEntry}
            overlay={overlay}
            setTargetAudioPairIndex={setTargetAudioPairIndex}
            setKeySelectAudioFileBrowser={setKeySelectAudioFileBrowser}
            setSelectAudioModalOpen={setSelectAudioModalOpen}
            AudioLibraryPathInputComponent={AudioLibraryPathInput}
        />
    );

    const editorBody = (
        <Row gutter={16}>
            <Col span={24}>
                {!singleFormMode ? (
                    <>
                        <CustomModelFilters
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
                            loading={listLoading}
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
                                    localStorage.setItem(
                                        CUSTOM_EDITOR_PAGE_SIZE_KEY,
                                        String(newSize),
                                    );
                                    setModelListPage(1);
                                }
                            }}
                        />
                        {validationMessages.length > 0 ? (
                            <Alert
                                type="error"
                                showIcon
                                style={{ marginBottom: 8 }}
                                title={t("tonies.customEditor.validation.title")}
                                description={
                                    <Space direction="vertical">
                                        {validationMessages.map((issue) => (
                                            <Typography.Text key={issue} type="danger">
                                                - {issue}
                                            </Typography.Text>
                                        ))}
                                        <Space>
                                            <Button
                                                size="small"
                                                onClick={() => form.scrollToField("series")}
                                            >
                                                {t("tonies.addNewCustomTonieModal.series")}
                                            </Button>
                                            <Button
                                                size="small"
                                                onClick={() => form.scrollToField("model")}
                                            >
                                                {t("tonies.addNewCustomTonieModal.model")}
                                            </Button>
                                            <Button
                                                size="small"
                                                onClick={() => form.scrollToField("audioPairs")}
                                            >
                                                {t("tonies.addNewCustomTonieModal.audioId")}
                                            </Button>
                                        </Space>
                                    </Space>
                                }
                            />
                        ) : null}
                    </>
                ) : null}

                <CustomModelEditModal
                    open={editModalVisible}
                    onCancel={handleCloseEditModal}
                    onSave={() => handleSaveFromModal(false)}
                    onSaveForNavigate={() => handleSaveFromModal(true)}
                    onPrev={handlePrevInModal}
                    onNext={handleNextInModal}
                    canGoPrev={!singleFormMode && editIndex !== null && editIndex > 0}
                    canGoNext={
                        !singleFormMode &&
                        editIndex !== null &&
                        editIndex < customEntries.length - 1
                    }
                    currentIndex={editIndex ?? 0}
                    totalItems={singleFormMode ? 1 : customEntries.length}
                    title={
                        singleFormMode
                            ? mode === "create-single" || modalMode === "create"
                                ? t("tonies.customEditor.actions.newModel")
                                : t("tonies.customEditor.editModalTitleEdit")
                            : modalMode === "create"
                              ? t("tonies.customEditor.actions.newModel")
                              : t("tonies.customEditor.editModalTitleEdit")
                    }
                    hideNavigationControls={singleFormMode || modalMode === "create"}
                    hasChanges={hasEditChanges}
                    zIndex={singleFormMode ? 1100 : undefined}
                >
                    {editModelFormContent}
                </CustomModelEditModal>
            </Col>
        </Row>
    );

    if (singleFormMode && !open) {
        return null;
    }

    return (
        <>
            {inlineMode ? (
                <div style={{ marginTop: 8 }}>{editorBody}</div>
            ) : (
                <Modal
                    title={t("tonies.customToniesEditorJsonEntry")}
                    open={open}
                    onCancel={onClose}
                    width={Math.max(Math.min(window.innerWidth * 0.92, 1500), 900)}
                    footer={null}
                    destroyOnHidden
                >
                    {editorBody}
                </Modal>
            )}

            <SelectImageModal
                open={imageManagerOpen}
                onClose={() => setImageManagerOpen(false)}
                title={t("tonies.imageManager.titleSelect")}
                initialSelection={form.getFieldValue("pic") || ""}
                zIndex={1200}
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
                    if (
                        targetAudioPairIndex !== null &&
                        result.audioId != null &&
                        result.hash != null
                    ) {
                        form.setFieldValue(
                            ["audioPairs", targetAudioPairIndex, "audio_id"],
                            result.audioId,
                        );
                        form.setFieldValue(
                            ["audioPairs", targetAudioPairIndex, "hash"],
                            result.hash,
                        );
                        form.setFieldValue(
                            ["audioPairs", targetAudioPairIndex, "path"],
                            result.path,
                        );
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
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt="preview"
                        referrerPolicy="no-referrer"
                        style={{ width: "100%" }}
                    />
                ) : null}
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
