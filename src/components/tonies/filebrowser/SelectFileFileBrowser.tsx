import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Table, Input, theme, Modal, Upload } from "antd";
import type { UploadProps } from "antd";
import { Key } from "antd/es/table/interface";
import { CloseOutlined } from "@ant-design/icons";

import { Record } from "../../../types/fileBrowserTypes";

import { LoadingSpinnerAsOverlay } from "../../common/elements/LoadingSpinner";
import TonieInformationModal from "../common/modals/TonieInformationModal";
import { useTeddyCloud } from "../../../provider/TeddyCloudProvider";
import { NotificationTypeEnum } from "../../../types/teddyCloudNotificationTypes";
import { useFileBrowserCore } from "./hooks/useFileBrowserCore";
import { createColumns } from "./helper/Columns";
import { useAudioContext } from "../../../provider/AudioProvider";
import { renderSelectImageSelectionCell } from "../../../utils/formatting/renderSelectImageTableLayout";
import { SELECT_IMAGE_CHECKBOX_COL_WIDTH } from "../../../constants/selectImageTableLayoutSizes";

const { useToken } = theme;

/** Drag & Drop nur auf Filter+Tabelle; Toolbar (pathActions) bleibt außerhalb. */
export type CustomImgTableDropZoneProps = {
    uploadDraggerProps: UploadProps;
    uploadDraggerRef: React.RefObject<React.ComponentRef<typeof Upload.Dragger> | null>;
    /** Expliziter Drop (rc-upload sieht Drops über virtualisierte Tabellen nicht zuverlässig). */
    onDropFiles: (files: FileList) => void;
};

const SelectFileFileBrowserComponent: React.FC<{
    special: string;
    initialPath?: string;
    filetypeFilter?: string[];
    overlay?: string;
    maxSelectedRows?: number;
    trackUrl?: boolean;
    showDirOnly?: boolean;
    showColumns?: string[];
    rebuildTrigger?: number;
    active?: boolean;
    tableScrollY?: number;
    pathActions?: React.ReactNode;
    onFileSelectChange?: (files: any[], path: string, special: string) => void;
    onFileDoubleClick?: (file: any, path: string, special: string) => void;
    /** When set (e.g. SelectImageModal), image preview is handled by the parent instead of the built-in modal. */
    onImagePreview?: (imageUrl: string) => void;
    /** Nur bei custom_img: Drop-Zone nur um Filter+Tabelle, nicht um die Button-Zeile. */
    customImgTableDropZone?: CustomImgTableDropZoneProps;
}> = ({
    special,
    initialPath = "",
    filetypeFilter = [],
    overlay = "",
    maxSelectedRows = 0,
    trackUrl = true,
    showDirOnly = false,
    showColumns = undefined,
    rebuildTrigger,
    active = true,
    tableScrollY,
    pathActions,
    onFileSelectChange,
    onFileDoubleClick,
    onImagePreview,
    customImgTableDropZone,
}) => {
    const { t } = useTranslation();
    const { playAudio } = useAudioContext();
    const { token } = useToken();
    const { addNotification } = useTeddyCloud();

    const navigate = useNavigate();

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const [isInformationModalOpen, setIsInformationModalOpen] = useState<boolean>(false);

    const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [imagePreviewUrl, setImagePreviewUrl] = useState("");
    const [currentRecord, setCurrentRecord] = useState<Record>();
    const [currentAudioUrl, setCurrentAudioUrl] = useState<string>("");
    const compactTableViewportRef = useRef<HTMLDivElement | null>(null);
    const [measuredCompactTableScrollY, setMeasuredCompactTableScrollY] = useState<number>(120);
    const isCompactCustomSelect = special === "custom_img";

    const {
        path,
        setPath,
        files,
        rebuildList,
        setRebuildList,
        loading,
        filterText,
        filterInputText,
        filterFieldAutoFocus,
        handleFilterChange,
        clearFilterField,
        handleFilterFieldInputFocus,
        handleFilterFieldInputBlur,
        inputFilterRef,
        generateBreadcrumbs,
        buildDirPath,
        buildContentUrl,
        defaultSorter,
        dirNameSorter,
        noData,
        parentRef,
    } = useFileBrowserCore({
        mode: "select",
        special,
        overlay,
        showDirOnly,
        filetypeFilter,
        trackUrl,
        initialPath,
        active,
    });

    useEffect(() => {
        setSelectedRowKeys([]);
    }, [rebuildList]);

    useEffect(() => {
        if (rebuildTrigger !== undefined) {
            setRebuildList((prev) => !prev);
        }
    }, [rebuildTrigger, setRebuildList]);

    const showInformationModal = (record: any) => {
        if (!record.isDir && record.tonieInfo?.tracks) {
            setCurrentRecord(record);
            setCurrentAudioUrl(buildContentUrl(record.name, { ogg: true }));
            setIsInformationModalOpen(true);
        }
    };

    // table helpers
    const rowClassName = (record: any) => {
        return selectedRowKeys.includes(record.name) ? "ant-table-row-selected" : "";
    };

    const onSelectChange = (newSelectedRowKeys: Key[]) => {
        if (maxSelectedRows > 0) {
            if (filetypeFilter) {
                const rowCount = newSelectedRowKeys.length;
                newSelectedRowKeys = newSelectedRowKeys.filter((key) => {
                    const file = files.find((f: any) => f.name === key) as any;
                    return (
                        (file && file.tafHeader !== undefined) ||
                        (file &&
                            filetypeFilter.some((ext) => file.name.toLowerCase().endsWith(ext)))
                    );
                });
                if (rowCount !== newSelectedRowKeys.length) {
                    addNotification(
                        NotificationTypeEnum.Warning,
                        t("fileBrowser.fileTypesWarning"),
                        t("fileBrowser.selectAllowedFileTypesOnly", {
                            fileTypes: filetypeFilter.join(", "),
                        }),
                        t("fileBrowser.title"),
                    );
                }
            }
            if (newSelectedRowKeys.length > maxSelectedRows) {
                addNotification(
                    NotificationTypeEnum.Warning,
                    t("fileBrowser.maxSelectedRowsWarning"),
                    t("fileBrowser.maxSelectedRows", {
                        maxSelectedRows: maxSelectedRows,
                    }),
                    t("fileBrowser.title"),
                );
            } else {
                setSelectedRowKeys(newSelectedRowKeys);
            }
        } else {
            setSelectedRowKeys(newSelectedRowKeys);
        }
        const selectedFiles =
            files?.filter((file: any) => newSelectedRowKeys.includes(file.name)) || [];
        if (onFileSelectChange !== undefined) onFileSelectChange(selectedFiles, path, special);
    };

    const handleDirClick = (dirPath: string) => {
        const newPath = buildDirPath(dirPath);
        if (trackUrl) {
            navigate(`?path=${newPath}`);
        }
        handleFilterFieldInputBlur();
        setSelectedRowKeys([]);
        setPath(newPath);
    };

    const handleRowSelect = (record: Record) => {
        if (record.isDir || record.name === "..") return;
        const newSelectedKeys = selectedRowKeys.includes(record.name)
            ? selectedRowKeys.filter((key) => key !== record.name)
            : [...selectedRowKeys, record.name];
        onSelectChange(newSelectedKeys);
    };

    const isSingleSelect = maxSelectedRows === 1;
    /** No Ant selection column: avoids empty gutter; selection via row click + rowClassName only. */
    const omitSelectionColumn = isSingleSelect && isCompactCustomSelect;
    const compactSelectHasVisibleSelectionColumn = isCompactCustomSelect && !isSingleSelect;

    const openImagePreview = (url: string) => {
        const handler =
            onImagePreview ??
            ((u: string) => {
                setImagePreviewUrl(u);
                setImagePreviewOpen(true);
            });
        handler(url);
    };

    const compactCustomRowSelectionProps =
        isCompactCustomSelect && !isSingleSelect
            ? {
                  columnWidth: SELECT_IMAGE_CHECKBOX_COL_WIDTH,
                  align: "center" as const,
                  renderCell: (_: boolean, __: Record, ___: number, originNode: React.ReactNode) =>
                      renderSelectImageSelectionCell(originNode),
              }
            : undefined;

    const recomputeCompactTableScrollY = useCallback(() => {
        const element = compactTableViewportRef.current;
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const maxByViewport = Math.floor(window.innerHeight - rect.top - 24);
        setMeasuredCompactTableScrollY(Math.max(120, maxByViewport));
    }, []);

    useEffect(() => {
        if (!isCompactCustomSelect || typeof tableScrollY === "number") return;
        const element = compactTableViewportRef.current;
        if (!element || typeof ResizeObserver === "undefined") return;

        recomputeCompactTableScrollY();

        const observer = new ResizeObserver(() => recomputeCompactTableScrollY());
        observer.observe(element);
        window.addEventListener("resize", recomputeCompactTableScrollY);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", recomputeCompactTableScrollY);
        };
    }, [isCompactCustomSelect, tableScrollY, recomputeCompactTableScrollY]);

    useEffect(() => {
        if (!isCompactCustomSelect || typeof tableScrollY === "number" || !active) return;
        recomputeCompactTableScrollY();
        const frameId = window.requestAnimationFrame(() => recomputeCompactTableScrollY());
        return () => window.cancelAnimationFrame(frameId);
    }, [active, isCompactCustomSelect, tableScrollY, recomputeCompactTableScrollY]);

    const effectiveTableScrollY =
        typeof tableScrollY === "number"
            ? tableScrollY
            : isCompactCustomSelect && measuredCompactTableScrollY > 0
              ? measuredCompactTableScrollY
              : undefined;

    const handleRowClick = (record: Record) => {
        if (record.isDir || record.name === "..") return;
        if (isSingleSelect) {
            onSelectChange([record.name]);
            return;
        }
        const newSelectedKeys = selectedRowKeys.includes(record.name)
            ? selectedRowKeys.filter((key) => key !== record.name)
            : [...selectedRowKeys, record.name];
        onSelectChange(newSelectedKeys);
    };

    // columns
    const columns = createColumns({
        mode: "select",
        path,
        special,
        overlay,
        filterText,
        showDirOnly,
        showColumns,
        defaultSorter,
        dirNameSorter,
        handleDirClick,
        showInformationModal,
        playAudio,
        buildContentUrl: special === "custom_img" ? buildContentUrl : undefined,
        onImagePreviewClick: special === "custom_img" ? openImagePreview : undefined,
        onRowSelect: handleRowSelect,
        compactSelectHasVisibleSelectionColumn,
    });

    const filterInTableHeaderComponents = {
        header: {
            wrapper: (props: any) => {
                return <thead {...props} />;
            },
            row: (props: any) => {
                return (
                    <>
                        <tr {...props} />
                        <tr>
                            <th
                                style={{ padding: "10px 8px" }}
                                colSpan={columns.length + (omitSelectionColumn ? 0 : 1)}
                            >
                                <Input
                                    placeholder={t("fileBrowser.filter")}
                                    value={filterInputText}
                                    onChange={handleFilterChange}
                                    onFocus={handleFilterFieldInputFocus}
                                    onBlur={handleFilterFieldInputBlur}
                                    ref={inputFilterRef}
                                    style={{ width: "100%" }}
                                    autoFocus={filterFieldAutoFocus}
                                    suffix={
                                        <CloseOutlined
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={clearFilterField}
                                            disabled={filterInputText.length === 0}
                                            style={{
                                                color:
                                                    filterInputText.length === 0
                                                        ? token.colorTextDisabled
                                                        : token.colorText,
                                                cursor:
                                                    filterInputText.length === 0
                                                        ? "default"
                                                        : "pointer",
                                            }}
                                        />
                                    }
                                />
                            </th>
                        </tr>
                    </>
                );
            },
            cell: (props: any) => {
                return <th {...props} style={{ position: "sticky", top: 0, zIndex: 8 }} />;
            },
        },
    };

    const selectImageTableFrameStyle: React.CSSProperties = {
        border: `1px solid ${token.colorBorder}`,
        borderRadius: 8,
        padding: 8,
    };

    /** Ant Upload.Dragger applies padding on the inner `.ant-upload` node (theme `padding`); bleed out so the frame aligns with the toolbar without global CSS. */
    const uploadDragContentBleedStyle: React.CSSProperties = (() => {
        const pad =
            typeof token.padding === "number"
                ? token.padding
                : typeof token.padding === "string"
                  ? Number.parseInt(token.padding, 10) || 16
                  : 16;
        return {
            display: "block",
            marginLeft: -pad,
            marginRight: -pad,
            width: `calc(100% + ${pad * 2}px)`,
            boxSizing: "border-box",
        };
    })();

    const tableElement = (
        <Table
            className={special === "custom_img" ? "select-image-table" : undefined}
            tableLayout={special === "custom_img" ? "fixed" : undefined}
            dataSource={files}
            columns={columns}
            rowKey={(record) => record.name}
            pagination={false}
            virtual={typeof effectiveTableScrollY === "number"}
            scroll={
                typeof effectiveTableScrollY === "number" ? { y: effectiveTableScrollY } : undefined
            }
            onRow={(record) => ({
                onClick: () => {
                    handleRowClick(record);
                },
                onDoubleClick: () => {
                    if (record.isDir) {
                        handleDirClick(record.name);
                    } else if (isSingleSelect) {
                        onSelectChange([record.name]);
                        onFileDoubleClick?.(record, path, special);
                    } else {
                        const newSelectedKeys = selectedRowKeys.includes(record.name)
                            ? selectedRowKeys.filter((key) => key !== record.name)
                            : [...selectedRowKeys, record.name];
                        onSelectChange(newSelectedKeys);
                    }
                },
                style: {
                    cursor: record.isDir ? "context-menu" : "pointer",
                },
            })}
            rowClassName={rowClassName}
            rowSelection={
                omitSelectionColumn
                    ? undefined
                    : isSingleSelect
                      ? {
                            type: "radio" as const,
                            selectedRowKeys,
                            onChange: onSelectChange,
                            columnWidth: 0,
                            renderCell: () => null,
                            hideSelectAll: true,
                        }
                      : maxSelectedRows > 0
                        ? {
                              selectedRowKeys,
                              onChange: onSelectChange,
                              ...(compactCustomRowSelectionProps ?? {}),
                          }
                        : {
                              selectedRowKeys,
                              onChange: onSelectChange,
                              ...(compactCustomRowSelectionProps ?? {}),
                              getCheckboxProps: (record: Record) => ({
                                  disabled: record.name === "..",
                              }),
                              onSelectAll: (selected: boolean, selectedRows: any[]) => {
                                  const selectedKeys = selected
                                      ? selectedRows
                                            .filter((row) => row.name !== "..")
                                            .map((row) => row.name)
                                      : [];
                                  setSelectedRowKeys(selectedKeys);
                              },
                          }
            }
            components={isCompactCustomSelect ? undefined : filterInTableHeaderComponents}
            locale={{ emptyText: noData }}
        />
    );

    return (
        <>
            {special === "custom_img" && onImagePreview === undefined && (
                <Modal
                    title={t("tonies.customEditor.previewTitle")}
                    open={imagePreviewOpen}
                    onCancel={() => setImagePreviewOpen(false)}
                    footer={null}
                >
                    {imagePreviewUrl ? (
                        <img
                            src={imagePreviewUrl}
                            alt="preview"
                            referrerPolicy="no-referrer"
                            style={{ width: "100%" }}
                        />
                    ) : null}
                </Modal>
            )}
            {currentRecord && isInformationModalOpen && (
                <TonieInformationModal
                    open={isInformationModalOpen}
                    tonieCardOrTAFRecord={{ ...currentRecord, audioUrl: currentAudioUrl }}
                    onClose={() => setIsInformationModalOpen(false)}
                    overlay={overlay}
                />
            )}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    flex: 1,
                    minHeight: 0,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginBottom: 8,
                        gap: 8,
                        width: "100%",
                    }}
                >
                    {pathActions ?? null}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 8,
                            minWidth: 0,
                        }}
                    >
                        <span style={{ lineHeight: 1.5 }}>{t("tonies.currentPath")}</span>
                        {generateBreadcrumbs(path)}
                    </div>
                </div>
            </div>
            {isCompactCustomSelect ? (
                (() => {
                    const compactTableFrame = (
                        <div
                            style={{
                                ...selectImageTableFrameStyle,
                                display: "flex",
                                flexDirection: "column",
                                minHeight: 0,
                                flex: 1,
                            }}
                        >
                            <Input
                                allowClear
                                placeholder={t("fileBrowser.filter")}
                                value={filterInputText}
                                onChange={handleFilterChange}
                                onFocus={handleFilterFieldInputFocus}
                                onBlur={handleFilterFieldInputBlur}
                                ref={inputFilterRef}
                                style={{ width: "100%", marginBottom: 8 }}
                                autoFocus={filterFieldAutoFocus}
                                suffix={
                                    filterInputText ? (
                                        <CloseOutlined
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={clearFilterField}
                                            style={{
                                                cursor: "pointer",
                                                color: token.colorTextSecondary,
                                            }}
                                        />
                                    ) : null
                                }
                            />
                            <div
                                style={{ position: "relative", flex: 1, minHeight: 0 }}
                                ref={compactTableViewportRef}
                            >
                                <div style={{ position: "relative" }} ref={parentRef}>
                                    {loading ? (
                                        <LoadingSpinnerAsOverlay parentRef={parentRef} />
                                    ) : (
                                        ""
                                    )}
                                    {tableElement}
                                </div>
                            </div>
                        </div>
                    );
                    if (customImgTableDropZone) {
                        return (
                            <Upload.Dragger
                                ref={customImgTableDropZone.uploadDraggerRef}
                                {...customImgTableDropZone.uploadDraggerProps}
                                openFileDialogOnClick={false}
                                showUploadList={false}
                                styles={{
                                    root: { overflow: "visible" },
                                    trigger: { overflow: "visible" },
                                }}
                                style={{
                                    padding: 0,
                                    border: "none",
                                    background: "transparent",
                                    width: "100%",
                                    minHeight: 0,
                                    textAlign: "start",
                                }}
                            >
                                <div
                                    style={uploadDragContentBleedStyle}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const { files } = e.dataTransfer;
                                        if (files?.length) {
                                            customImgTableDropZone.onDropFiles(files);
                                        }
                                    }}
                                >
                                    {compactTableFrame}
                                </div>
                            </Upload.Dragger>
                        );
                    }
                    return compactTableFrame;
                })()
            ) : (
                <div style={{ position: "relative" }} ref={parentRef}>
                    {loading ? <LoadingSpinnerAsOverlay parentRef={parentRef} /> : ""}
                    {tableElement}
                </div>
            )}
        </>
    );
};

export const SelectFileFileBrowser = React.memo(SelectFileFileBrowserComponent);
