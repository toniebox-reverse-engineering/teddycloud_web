import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Form, Input, Button, theme, Tooltip } from "antd";
import { FolderAddOutlined, InfoCircleOutlined, PlusOutlined } from "@ant-design/icons";

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";

import { SelectFileFileBrowser } from "../SelectFileFileBrowser";
import { ffmpegSupportedExtensions } from "../../../../utils/files/ffmpegSupportedExtensions";
import { DirectoryTreeSelect } from "../../common/elements/DirectoryTreeSelect";
import { DirectoryTreeApi } from "../../common/hooks/useDirectoryTree";
import { useDirectoryCreate } from "../../common/hooks/useCreateDirectory";
import CreateDirectoryModal from "../../common/modals/CreateDirectoryModal";
import LoadingSpinner from "../../../common/elements/LoadingSpinner";
import { generateUUID } from "../../../../utils/ids/generateUUID";
import { DraggableTapListItem } from "../../common/elements/DraggableTapListItem";

const api = new TeddyCloudApi(defaultAPIConfig());

export interface FileItem {
    uid: string;
    filepath: string;
    name: string;
}

export interface TAPFormValues {
    type: string;
    audio_id: number;
    filepath: string;
    name: string;
    files: FileItem[];
}

export interface TeddyAudioPlaylistEditorProps {
    open: boolean;

    currentPath: string;
    initialValuesPath?: string;

    directoryTree: DirectoryTreeApi;
    onCreate: (values: TAPFormValues) => void;
    onCancel: () => void;
}

const { useToken } = theme;

const ensureLeadingSlash = (p: string) => (p.startsWith("/") ? p : `/${p}`);

const ensureFileUids = (files: any[]): FileItem[] =>
    (files ?? []).map((f: any) => ({
        uid: f?.uid ?? generateUUID(),
        filepath: (f?.filepath ?? "").toString(),
        name: (f?.name ?? "").toString(),
    }));

const normalizeSelectedBrowserFiles = (
    files: any[],
    path: string,
    special: string,
): Omit<FileItem, "uid">[] => {
    const normalizedPath = path === "" || path.endsWith("/") ? path : path + "/";
    const prefix = special === "library" ? "lib://" : "content://";
    return (files ?? []).map((file) => ({
        filepath: prefix + normalizedPath + file.name,
        name: file.name,
    }));
};

const TeddyAudioPlaylistEditor: React.FC<TeddyAudioPlaylistEditorProps> = ({
    open,
    currentPath,
    initialValuesPath,
    directoryTree,
    onCreate,
    onCancel,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();

    const {
        open: isCreateDirectoryModalOpen,
        createDirectoryPath,
        createDirectoryInputKey,
        hasNewDirectoryInvalidChars,
        isCreateDirectoryButtonDisabled,
        inputCreateDirectoryRef,
        openCreateDirectoryModal,
        closeCreateDirectoryModal,
        handleCreateDirectoryInputChange,
        createDirectory,
    } = useDirectoryCreate({
        path: "/",
        directoryTree,
        selectNewNode: true,
    });

    const [form] = Form.useForm<TAPFormValues>();

    const [selectedFiles, setSelectedFiles] = useState<Array<Omit<FileItem, "uid">>>([]);
    const [isSelectFileModalOpen, setSelectFileModalOpen] = useState(false);
    const [maxSelectableFiles, setMaxSelectableFiles] = useState(99);
    const [filebrowserKey, setFilebrowserKey] = useState(0);
    const [selectedFileIndex, setSelectedFileIndex] = useState<number>(-1);

    const [tafBaseName, setTafBaseName] = useState<string>("");
    const [isInitializing, setIsInitializing] = useState(false);
    const [initialValuesObj, setInitialValuesObj] = useState<Partial<TAPFormValues> | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        }),
    );

    const stripLibPrefix = (p?: string) => {
        const v = (p ?? "").toString().trim();
        if (!v) return "";
        const noPrefix = v.replace(/^lib:\/\//, "");
        return noPrefix.startsWith("/") ? noPrefix : `/${noPrefix}`;
    };

    const getDirFromFilepath = (fp?: string) => {
        const v = (fp ?? "").toString().trim();
        if (!v) return "";
        const idx = v.lastIndexOf("/");
        if (idx <= 0) return "";
        return v.slice(0, idx);
    };

    const normalizeDir = (p?: string) => (p ? (p.endsWith("/") ? p : `${p}/`) : "");
    const stripTafExt = (s?: string) => {
        const v = (s ?? "").trim();
        if (!v) return "";
        return v.toLowerCase().endsWith(".taf") ? v.slice(0, -4) : v;
    };

    const ensureTafExt = (name?: string) => {
        const v = (name ?? "").trim();
        if (!v) return "";
        return v.toLowerCase().endsWith(".taf") ? v : `${v}.taf`;
    };

    const buildFilepath = (dir?: string, filenameBase?: string) => {
        const d = normalizeDir(dir);
        const f = ensureTafExt(filenameBase).replace(/^\/+/, "");
        return `lib:/${d}${f}`;
    };

    const getCurrentDir = () => directoryTree.getPathFromNodeId(directoryTree.treeNodeId);

    const computeAndSetFilepath = () => {
        const fp = buildFilepath(getCurrentDir(), tafBaseName);
        form.setFieldsValue({ filepath: fp });
        return fp;
    };

    useEffect(() => {
        if (!open) return;

        let cancelled = false;

        const load = async () => {
            if (!initialValuesPath) {
                setInitialValuesObj(null);
                return;
            }

            try {
                const normalized = ensureLeadingSlash(initialValuesPath);
                const res = await api.apiGetTeddyCloudApiRaw(normalized);
                const data = (await res.json()) as Partial<TAPFormValues>;
                if (cancelled) return;
                setInitialValuesObj(data);
            } catch (e) {
                if (cancelled) return;
                console.error("Failed to load TAP json:", e);
                setInitialValuesObj(null);
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [open, initialValuesPath]);

    useEffect(() => {
        if (!open) return;

        let cancelled = false;

        const hardResetForCreate = () => {
            form.resetFields();
            form.setFieldsValue({
                type: "tap",
                audio_id: Math.floor(Date.now() / 1000),
                filepath: "",
                name: "",
                files: [],
            } as TAPFormValues);

            setTafBaseName("");
            setSelectedFiles([]);
            setSelectedFileIndex(-1);
            setSelectFileModalOpen(false);

            directoryTree.setTreeNodeId("1");
        };

        const init = async () => {
            setIsInitializing(true);

            if (!initialValuesPath) {
                hardResetForCreate();
                if (!cancelled) setIsInitializing(false);
                return;
            }

            if (!initialValuesObj) {
                if (!cancelled) setIsInitializing(true);
                return;
            }

            try {
                const initialValues = initialValuesObj;

                const fp = stripLibPrefix(initialValues.filepath);

                form.resetFields();
                form.setFieldsValue({
                    type: "tap",
                    audio_id: (initialValues.audio_id as any) ?? undefined,
                    filepath: fp,
                    name: initialValues.name ?? "",
                    files: ensureFileUids((initialValues.files as any) ?? []),
                } as TAPFormValues);

                const base = fp ? (fp.split("/").pop() ?? "") : "";
                setTafBaseName(stripTafExt(base));

                const dirFromJson = getDirFromFilepath(fp);
                if (dirFromJson && directoryTree.selectNodeByFullPath) {
                    await directoryTree.selectNodeByFullPath(dirFromJson);
                }
            } catch (e) {
                console.error("Error applying loaded TAP JSON:", e);
                hardResetForCreate();
            } finally {
                if (!cancelled) setIsInitializing(false);
            }
        };

        void init();

        return () => {
            cancelled = true;
        };
    }, [open, initialValuesPath, initialValuesObj]);

    const resetForm = () => {
        form.resetFields();
        setTafBaseName("");
    };

    const handleFileSelectChange = (files: any[], path: string, special: string) => {
        const incoming = normalizeSelectedBrowserFiles(files, path, special); // [{filepath,name},...]

        if (selectedFileIndex !== -1) {
            setSelectedFiles(incoming.slice(0, 1));
            return;
        }

        setSelectedFiles((prev) => {
            const incomingSet = new Set(incoming.map((f) => f.filepath));

            const kept = prev.filter((p) => incomingSet.has(p.filepath));

            const keptSet = new Set(kept.map((k) => k.filepath));
            const added = incoming.filter((f) => !keptSet.has(f.filepath));

            return [...kept, ...added];
        });
    };

    const showFileSelectModal = () => {
        setSelectedFiles([]);
        setSelectedFileIndex(-1);
        setMaxSelectableFiles(99 - (form.getFieldValue("files")?.length ?? 0));
        setFilebrowserKey((prevKey) => prevKey + 1);
        setSelectFileModalOpen(true);
    };

    const handleEditFile = (index: number) => {
        setFilebrowserKey((prevKey) => prevKey + 1);
        setSelectFileModalOpen(true);
        setSelectedFileIndex(index);
        setMaxSelectableFiles(1);
        const current = (form.getFieldValue("files") ?? []) as FileItem[];
        const item = current[index];
        setSelectedFiles(item ? [{ filepath: item.filepath, name: item.name }] : []);
    };

    const handleOkSelectFile = () => {
        const currentValues = form.getFieldsValue() as TAPFormValues;
        let updatedFiles = [...(currentValues.files ?? [])];

        if (selectedFileIndex !== -1) {
            const old = updatedFiles[selectedFileIndex];
            updatedFiles[selectedFileIndex] = {
                uid: old?.uid ?? generateUUID(),
                filepath: selectedFiles[0]?.filepath ?? "",
                name: selectedFiles[0]?.name ?? "",
            };
        } else {
            const toAdd: FileItem[] = (selectedFiles ?? []).map((f) => ({
                uid: generateUUID(),
                filepath: f.filepath,
                name: f.name,
            }));
            updatedFiles = [...updatedFiles, ...toAdd];
        }

        form.setFieldsValue({
            ...currentValues,
            files: updatedFiles,
        });

        setSelectFileModalOpen(false);
        setSelectedFiles([]);
        setSelectedFileIndex(-1);
    };

    const handleCancelSelectFile = () => {
        setSelectFileModalOpen(false);
        setSelectedFiles([]);
        setSelectedFileIndex(-1);
    };

    const selectModalFooter = (
        <div
            style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                padding: "16px 0",
                margin: "-24px -24px -12px -24px",
                background: token.colorBgElevated,
            }}
        >
            <Button onClick={handleCancelSelectFile}>{t("tonies.selectFileModal.cancel")}</Button>
            <Button type="primary" onClick={handleOkSelectFile}>
                {t("tonies.selectFileModal.ok")}
            </Button>
        </div>
    );

    const isEditMode = !!initialValuesPath;

    return (
        <>
            <Modal
                open={open}
                destroyOnHidden
                title={
                    isEditMode
                        ? t("tonies.tapEditor.titleEdit", {
                              name: form.getFieldValue("name") + ".tap",
                          })
                        : t("tonies.tapEditor.titleCreate", {
                              path: currentPath.startsWith("/") ? currentPath : `/${currentPath}`,
                          })
                }
                width="90%"
                style={{ maxWidth: 900 }}
                okText={isEditMode ? t("tonies.tapEditor.save") : t("tonies.tapEditor.create")}
                cancelText={t("tonies.tapEditor.cancel")}
                onCancel={() => {
                    onCancel();
                    resetForm();
                }}
                onOk={async () => {
                    if (isInitializing) return;

                    if (!tafBaseName.trim()) {
                        form.setFields([
                            { name: "filepath", errors: [t("tonies.tapEditor.filePathRequired")] },
                        ]);
                        return;
                    }

                    computeAndSetFilepath();

                    await form.validateFields();
                    onCreate(form.getFieldsValue() as TAPFormValues);
                    resetForm();
                }}
                okButtonProps={{ disabled: isInitializing }}
                cancelButtonProps={{ disabled: isInitializing }}
            >
                {isInitializing ? (
                    <LoadingSpinner />
                ) : (
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{
                            type: "tap",
                            filepath: "",
                            name: "",
                            files: [],
                        }}
                    >
                        <Form.Item name="type" hidden label="type">
                            <Input type="string" />
                        </Form.Item>

                        <Form.Item
                            name="filepath"
                            hidden
                            rules={[
                                {
                                    validator: async (_, value) => {
                                        const fp = (value ?? "").toString().trim();
                                        if (!fp)
                                            throw new Error(t("tonies.tapEditor.filePathRequired"));
                                        if (!fp.toLowerCase().endsWith(".taf"))
                                            throw new Error(t("tonies.tapEditor.filePathRequired"));
                                    },
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="audio_id"
                            label={
                                <div style={{ display: "flex", gap: 8 }}>
                                    <label>{t("tonies.tapEditor.audioId")}</label>
                                    <Tooltip title={t("tonies.tapEditor.audioIdTooltip")}>
                                        <InfoCircleOutlined />
                                    </Tooltip>
                                </div>
                            }
                        >
                            <Input type="number" />
                        </Form.Item>

                        <Form.Item
                            label={
                                <div style={{ display: "flex", gap: 8 }}>
                                    <label>{t("tonies.tapEditor.filePath")}</label>
                                    <Tooltip title={t("tonies.tapEditor.filePathTooltip")}>
                                        <InfoCircleOutlined />
                                    </Tooltip>
                                </div>
                            }
                            help={
                                !tafBaseName.trim()
                                    ? t("tonies.tapEditor.filePathRequired")
                                    : undefined
                            }
                            validateStatus={!tafBaseName.trim() ? "error" : undefined}
                            required
                        >
                            <div style={{ display: "flex" }}>
                                <DirectoryTreeSelect
                                    directoryTree={directoryTree}
                                    style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                                />
                                <Button
                                    icon={<FolderAddOutlined />}
                                    onClick={() => {
                                        const basePath = getCurrentDir();
                                        openCreateDirectoryModal(basePath);
                                    }}
                                    style={{ borderRadius: 0, padding: "0 16px" }}
                                    disabled={isInitializing}
                                />
                                <Input
                                    value={tafBaseName}
                                    onChange={(e) => setTafBaseName(e.target.value)}
                                    onBlur={() => setTafBaseName(tafBaseName.trim())}
                                    suffix=".taf"
                                    style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                    placeholder="filename"
                                    disabled={isInitializing}
                                />
                            </div>
                        </Form.Item>

                        <Form.Item
                            name="name"
                            label={
                                <div style={{ display: "flex", gap: 8 }}>
                                    <label>{t("tonies.tapEditor.name")}</label>
                                    <Tooltip title={t("tonies.tapEditor.nameTooltip")}>
                                        <InfoCircleOutlined />
                                    </Tooltip>
                                </div>
                            }
                            required
                            rules={[
                                {
                                    validator: (_, value) =>
                                        value && value.trim()
                                            ? Promise.resolve()
                                            : Promise.reject(
                                                  new Error(t("tonies.tapEditor.nameRequired")),
                                              ),
                                },
                            ]}
                        >
                            <Input disabled={isInitializing} />
                        </Form.Item>

                        <Form.List name="files">
                            {(fields, { remove }) => {
                                const currentFiles = ensureFileUids(
                                    (form.getFieldValue("files") ?? []) as any[],
                                );
                                const items = currentFiles.map((f) => f.uid);

                                return (
                                    <>
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={({ active, over }) => {
                                                if (!over || active.id === over.id) return;

                                                const from = currentFiles.findIndex(
                                                    (f) => f.uid === String(active.id),
                                                );
                                                const to = currentFiles.findIndex(
                                                    (f) => f.uid === String(over.id),
                                                );
                                                if (from < 0 || to < 0) return;

                                                form.setFieldsValue({
                                                    files: arrayMove(currentFiles, from, to),
                                                });
                                            }}
                                        >
                                            <SortableContext
                                                items={items}
                                                strategy={verticalListSortingStrategy}
                                                disabled={isInitializing}
                                            >
                                                {fields.map(({ name }, index) => {
                                                    const file = currentFiles[index];
                                                    if (!file?.uid) return null;

                                                    return (
                                                        <DraggableTapListItem
                                                            key={file.uid}
                                                            file={file}
                                                            index={index}
                                                            disabled={isInitializing}
                                                            namePath={name as unknown as number}
                                                            form={form}
                                                            t={t}
                                                            onEditFile={handleEditFile}
                                                            onRemove={() => remove(name)}
                                                        />
                                                    );
                                                })}
                                            </SortableContext>
                                        </DndContext>

                                        <Form.Item>
                                            <Button
                                                type="dashed"
                                                onClick={showFileSelectModal}
                                                block
                                                icon={<PlusOutlined />}
                                                disabled={isInitializing}
                                            >
                                                {t("tonies.tapEditor.addFile")}
                                            </Button>
                                        </Form.Item>
                                    </>
                                );
                            }}
                        </Form.List>
                    </Form>
                )}

                <Modal
                    className="sticky-footer"
                    title={t("tonies.selectFileModal.selectFile")}
                    open={open && !isInitializing && isSelectFileModalOpen}
                    onOk={handleOkSelectFile}
                    onCancel={handleCancelSelectFile}
                    width="auto"
                    footer={selectModalFooter}
                >
                    <SelectFileFileBrowser
                        maxSelectedRows={maxSelectableFiles}
                        special="library"
                        trackUrl={false}
                        filetypeFilter={ffmpegSupportedExtensions}
                        key={filebrowserKey}
                        onFileSelectChange={handleFileSelectChange}
                    />
                </Modal>
            </Modal>

            {isCreateDirectoryModalOpen && (
                <CreateDirectoryModal
                    open={open && !isInitializing && isCreateDirectoryModalOpen}
                    createDirectoryPath={createDirectoryPath}
                    createDirectoryInputKey={createDirectoryInputKey}
                    hasNewDirectoryInvalidChars={hasNewDirectoryInvalidChars}
                    isCreateDirectoryButtonDisabled={isCreateDirectoryButtonDisabled}
                    inputRef={inputCreateDirectoryRef}
                    onInputChange={handleCreateDirectoryInputChange}
                    onClose={closeCreateDirectoryModal}
                    onCreate={createDirectory}
                />
            )}
        </>
    );
};

export default TeddyAudioPlaylistEditor;
