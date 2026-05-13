import React from "react";
import { Tooltip, Spin, Tag, theme } from "antd";
import { SortOrder } from "antd/es/table/interface";
import {
    FolderOutlined,
    PlayCircleOutlined,
    DownloadOutlined,
    CloudServerOutlined,
    TruckOutlined,
    EditOutlined,
    FormOutlined,
    NodeExpandOutlined,
    DeleteOutlined,
    LoadingOutlined,
} from "@ant-design/icons";

import { IMAGE_EXTENSIONS } from "../../../../constants/fileTypes";
import { Record } from "../../../../types/fileBrowserTypes";
import { humanFileSize } from "../../../../utils/files/humanFileSize";
import { ffmpegSupportedExtensions } from "../../../../utils/files/ffmpegSupportedExtensions";
import { TonieCardProps } from "../../../../types/tonieTypes";
import { useTranslation } from "react-i18next";
import { canHover } from "../../../../utils/browser/browserUtils";
import { toImageSrc } from "../../common/utils/imagePathUtils";
import ThumbnailCell from "../../common/elements/ThumbnailCell";
import { toModelKey } from "../../utils/modelKey";
import {
    SELECT_IMAGE_THUMB_COL_WIDTH,
    SELECT_IMAGE_CELL_GAP_HALF,
} from "../../../../constants/selectImageTableLayoutSizes";

const { useToken } = theme;

type TonieCardTAFRecord = TonieCardProps | Record;

export type FileBrowserMode = "full" | "select";

export interface CreateColumnsOptions {
    mode: FileBrowserMode;

    path: string;
    special: string;
    overlay?: string;

    filterText: string;
    showDirOnly: boolean;
    showColumns?: string[];

    isTapList?: boolean;
    downloading?: { [key: string]: boolean };

    defaultSorter: (a: any, b: any, dataIndex: string | string[]) => number;
    dirNameSorter: (a: any, b: any) => number;

    withinTafBoundaries?: (numberOfFiles: number) => boolean;
    handleDirClick: (dirName: string) => void;
    showInformationModal: (record: Record) => void;
    playAudio: (
        url: string,
        meta?: any,
        tonieCardOrTAFRecord?: TonieCardTAFRecord,
        startTime?: number,
    ) => void;

    handleFileDownload?: (
        record: Record,
        baseUrl: string,
        path: string,
        special: string,
        overlay?: string,
    ) => void;

    migrateContent2Lib?: (ruid: string, libroot: boolean, overlay?: string) => void;
    handleEditTapClick?: (fullPath: string) => void;
    handleEditTafMetaDataClick?: (path: string, record: Record) => void;
    showRenameDialog?: (fileName: string) => void;
    showMoveDialog?: (fileName: string) => void;
    showDeleteConfirmDialog?: (fileName: string, fullPath: string, query: string) => void;
    buildContentUrl?: (fileName: string, options?: { ogg?: boolean }) => string;
    onImagePreviewClick?: (imageUrl: string) => void;
    onRowSelect?: (record: Record) => void;
    /** compact custom_img: false when single-select (no visible checkbox column). */
    compactSelectHasVisibleSelectionColumn?: boolean;
}

const isImageFileName = (name: string) =>
    IMAGE_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext));

export const createColumns = (options: CreateColumnsOptions): any[] => {
    const { t } = useTranslation();
    const { token } = useToken();

    const {
        mode,
        path,
        special,
        overlay,
        filterText,
        showDirOnly,
        showColumns,
        isTapList,
        downloading,
        defaultSorter,
        dirNameSorter,
        showInformationModal,
        playAudio,
        handleFileDownload,
        migrateContent2Lib,
        handleEditTapClick,
        handleEditTafMetaDataClick,
        showRenameDialog,
        showMoveDialog,
        showDeleteConfirmDialog,
        buildContentUrl,
        onImagePreviewClick,
        onRowSelect,
        compactSelectHasVisibleSelectionColumn: compactSelectHasVisibleSelectionColumnOpt,
    } = options;

    const isCompactCustomSelect = mode === "select" && special === "custom_img";
    const compactSelectHasVisibleSelectionColumn = isCompactCustomSelect
        ? compactSelectHasVisibleSelectionColumnOpt !== false
        : true;
    const wrapCompactCustomCell = (content: React.ReactNode) =>
        isCompactCustomSelect ? (
            <div style={{ display: "flex", alignItems: "center", minHeight: 40 }}>{content}</div>
        ) : (
            content
        );

    const getPictureSrc = (record: any): string | null => {
        if (!record) return null;
        if (record.tonieInfo?.picture) return toImageSrc(record.tonieInfo.picture);
        if (
            special === "custom_img" &&
            !record.isDir &&
            buildContentUrl &&
            isImageFileName(record.name)
        ) {
            const path = buildContentUrl(record.name);
            return toImageSrc(path.startsWith("/") ? path : `/${path}`);
        }
        return null;
    };

    let columns: any[] = [
        {
            title: mode === "full" ? t("fileBrowser.image") : "",
            dataIndex: ["tonieInfo", "picture"],
            key: "picture",
            sorter: undefined,
            width: isCompactCustomSelect ? SELECT_IMAGE_THUMB_COL_WIDTH : 56,
            onCell: () => ({
                style: isCompactCustomSelect
                    ? {
                          /* Multi: half-gap after checkbox column; single: no fake inset — avoids wide empty strip */
                          paddingLeft: compactSelectHasVisibleSelectionColumn
                              ? SELECT_IMAGE_CELL_GAP_HALF
                              : 0,
                          paddingRight: SELECT_IMAGE_CELL_GAP_HALF,
                      }
                    : {},
            }),
            render: (picture: string, record: any) => {
                const src = getPictureSrc(record);
                const onThumbnailClick =
                    src && onImagePreviewClick
                        ? () => onImagePreviewClick(src)
                        : record?.tonieInfo && src
                          ? () => showInformationModal(record)
                          : undefined;
                return (
                    <>
                        {record && src ? (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: isCompactCustomSelect ? "flex-start" : "center",
                                    alignItems: "center",
                                }}
                            >
                                <ThumbnailCell
                                    src={src}
                                    alt={t("tonies.content.toniePicture")}
                                    onClick={onThumbnailClick}
                                />
                            </div>
                        ) : record?.isDir ? (
                            <FolderOutlined style={{ fontSize: 24, marginRight: 8 }} />
                        ) : null}
                        {mode === "full" && record?.hide ? (
                            <div style={{ textAlign: "center" }}>
                                <Tag style={{ border: 0 }} color="warning">
                                    {t("fileBrowser.hidden")}
                                </Tag>
                            </div>
                        ) : null}
                    </>
                );
            },
            showOnDirOnly: false,
            hideForSpecial: "library",
        },

        {
            title: t("fileBrowser.name"),
            dataIndex: "name",
            key: "name",
            sorter: dirNameSorter,
            defaultSortOrder: "ascend" as SortOrder,
            onCell: isCompactCustomSelect
                ? () => ({
                      style: {
                          paddingLeft: SELECT_IMAGE_CELL_GAP_HALF,
                      },
                  })
                : undefined,
            render: (picture: string, record: any) => {
                const isImagePreviewClickable =
                    special === "custom_img" &&
                    !record?.isDir &&
                    isImageFileName(record?.name) &&
                    onImagePreviewClick;
                const isSelectableFile =
                    mode === "select" && onRowSelect && !record?.isDir && record?.name !== "..";
                const nameContent = isSelectableFile ? (
                    <span
                        role="button"
                        tabIndex={0}
                        style={{ cursor: "pointer", textDecoration: "underline" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onRowSelect(record);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onRowSelect(record);
                            }
                        }}
                    >
                        {record.name}
                    </span>
                ) : isImagePreviewClickable ? (
                    <span
                        role="button"
                        tabIndex={0}
                        style={{ cursor: "pointer", textDecoration: "underline" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            const src = getPictureSrc(record);
                            if (src) onImagePreviewClick(src);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                const src = getPictureSrc(record);
                                if (src) onImagePreviewClick(src);
                            }
                        }}
                    >
                        {record.name}
                    </span>
                ) : record?.isDir ? (
                    <>{record.name}</>
                ) : (
                    record?.name
                );
                if (isCompactCustomSelect) {
                    return wrapCompactCustomCell(
                        <div
                            key={`name-${record.name}`}
                            style={{ display: "flex", alignItems: "center" }}
                        >
                            {record.isDir ? <FolderOutlined style={{ marginRight: 8 }} /> : null}
                            <div style={{ wordBreak: record.isDir ? "normal" : "break-word" }}>
                                {nameContent}
                            </div>
                        </div>,
                    );
                }
                return (
                    record && (
                        <div key={`name-${record.name}`}>
                            <div className="showSmallDevicesOnly">
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <div style={{ display: "flex" }}>
                                        {record.isDir ? (
                                            <FolderOutlined style={{ marginRight: 8 }} />
                                        ) : (
                                            ""
                                        )}
                                        <div
                                            style={{
                                                wordBreak: record.isDir ? "normal" : "break-word",
                                            }}
                                        >
                                            {nameContent}
                                        </div>
                                    </div>
                                    {mode === "full" && !record.isDir && record.size
                                        ? " (" + humanFileSize(record.size) + ")"
                                        : ""}
                                </div>
                                {special !== "custom_img" && (
                                    <>
                                        <div>{record.tonieInfo?.model}</div>
                                        <div
                                            style={{
                                                wordBreak: record.isDir ? "normal" : "break-word",
                                            }}
                                        >
                                            {(record.tonieInfo?.series
                                                ? record.tonieInfo?.series
                                                : "") +
                                                (record.tonieInfo?.episode
                                                    ? " - " + record.tonieInfo?.episode
                                                    : "")}
                                        </div>
                                    </>
                                )}
                                {mode === "full" && (
                                    <div>
                                        {!record.isDir &&
                                            new Date(record.date * 1000).toLocaleString()}
                                    </div>
                                )}
                            </div>
                            <div className="showMediumDevicesOnly">
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <div style={{ display: "flex" }}>
                                        {record.isDir ? (
                                            <FolderOutlined style={{ marginRight: 8 }} />
                                        ) : (
                                            ""
                                        )}
                                        <div
                                            style={{
                                                wordBreak: record.isDir ? "normal" : "break-word",
                                            }}
                                        >
                                            {nameContent}
                                        </div>
                                    </div>
                                    {mode === "full" && !record.isDir && record.size
                                        ? " (" + humanFileSize(record.size) + ")"
                                        : ""}
                                </div>
                                {mode === "full" && (
                                    <div>
                                        {!record.isDir &&
                                            new Date(record.date * 1000).toLocaleString()}
                                    </div>
                                )}
                            </div>
                            <div className="showBigDevicesOnly">
                                <div style={{ display: "flex" }}>
                                    {record.isDir ? (
                                        <FolderOutlined style={{ marginRight: 8 }} />
                                    ) : (
                                        ""
                                    )}
                                    <div
                                        style={{
                                            wordBreak: record.isDir ? "normal" : "break-word",
                                        }}
                                    >
                                        {nameContent}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                );
            },
            filteredValue: [filterText],
            onFilter: (value: string, record: Record) => {
                const text = value.toLowerCase();
                return (
                    record.name === ".." ||
                    record.name.toLowerCase().includes(text) ||
                    (!record.isDir &&
                        "tafHeader" in record &&
                        record.tafHeader.size &&
                        humanFileSize(record.tafHeader.size).toString().includes(text)) ||
                    ("tafHeader" in record &&
                        record.tafHeader.audioId?.toString().includes(text)) ||
                    ("tonieInfo" in record && toModelKey(record.tonieInfo?.model).includes(text)) ||
                    ("tonieInfo" in record &&
                        record.tonieInfo?.series.toLowerCase().includes(text)) ||
                    ("tonieInfo" in record &&
                        record.tonieInfo?.episode.toLowerCase().includes(text)) ||
                    (record.date && new Date(record.date * 1000).toLocaleString().includes(text))
                );
            },
            showOnDirOnly: true,
        },

        {
            title: t("fileBrowser.size"),
            dataIndex: "size",
            key: "size",
            render: (size: number, record: any) =>
                wrapCompactCustomCell(
                    <div key={`size-${record.name}`}>
                        {record.isDir ? "<DIR>" : humanFileSize(size)}
                    </div>,
                ),
            showOnDirOnly: false,
            responsive: ["xl"],
        },

        {
            title: t("fileBrowser.model"),
            dataIndex: ["tonieInfo", "model"],
            key: "model",
            showOnDirOnly: false,
            responsive: ["xl"],
            render: (_model: string, record: any) =>
                wrapCompactCustomCell(
                    <div key={`model-${record.name}`}>{record.tonieInfo?.model}</div>,
                ),
            hideForSpecial: "custom_img",
        },

        {
            title: (
                <>
                    <div className="showMediumDevicesOnly">
                        {t("fileBrowser.model")}/{t("fileBrowser.series")}/
                        {t("fileBrowser.episode")}
                    </div>
                    <div className="showBigDevicesOnly">{t("fileBrowser.series")}</div>
                </>
            ),
            dataIndex: ["tonieInfo", "series"],
            key: "series",
            render: (series: string, record: any) => (
                <div key={`series-${record.name}`}>
                    <div className="showMediumDevicesOnly">
                        <div>{record.tonieInfo?.model}</div>
                        <div style={{ wordBreak: "break-word" }}>
                            {(record.tonieInfo?.series ? record.tonieInfo?.series : "") +
                                (record.tonieInfo?.episode
                                    ? " - " + record.tonieInfo?.episode
                                    : "")}
                        </div>
                    </div>
                    <div className="showBigDevicesOnly">
                        {record.tonieInfo?.series ? record.tonieInfo?.series : ""}
                    </div>
                </div>
            ),
            showOnDirOnly: false,
            responsive: ["md"],
            hideForSpecial: "custom_img",
        },

        {
            title: t("fileBrowser.episode"),
            dataIndex: ["tonieInfo", "episode"],
            key: "episode",
            showOnDirOnly: false,
            responsive: ["xl"],
            render: (episode: string, record: any) =>
                wrapCompactCustomCell(
                    <div key={`episode-${record.name}`}>{record.tonieInfo?.episode}</div>,
                ),
            hideForSpecial: "custom_img",
        },

        {
            title: t("fileBrowser.date"),
            dataIndex: "date",
            key: "date",
            render: (timestamp: number, record: any) =>
                wrapCompactCustomCell(
                    <div key={`date-${record.name}`}>
                        {new Date(timestamp * 1000).toLocaleString()}
                    </div>,
                ),
            showOnDirOnly: true,
            responsive: ["xl"],
        },
    ];

    const actionsColumn = {
        title: (
            <div className="showMediumDevicesOnly showBigDevicesOnly">
                {t("fileBrowser.actions")}
            </div>
        ),
        dataIndex: "controls",
        key: "controls",
        sorter: undefined,
        render: (name: string, record: any) => {
            const actions: React.ReactNode[] = [];

            if (
                !record.isDir &&
                ffmpegSupportedExtensions.some((ending) => record.name.endsWith(ending))
            ) {
                actions.push(
                    <Tooltip
                        open={!canHover ? false : undefined}
                        key={`action-play-${record.name}`}
                        title={t("fileBrowser.playFile")}
                    >
                        <PlayCircleOutlined
                            style={{ margin: "4px 8px 4px 0", padding: 4 }}
                            onClick={() =>
                                playAudio(
                                    encodeURI(
                                        import.meta.env.VITE_APP_TEDDYCLOUD_API_URL +
                                            "/content/" +
                                            decodeURIComponent(path) +
                                            "/" +
                                            record.name,
                                    ) +
                                        "?ogg=true&special=" +
                                        special +
                                        (overlay ? `&overlay=${overlay}` : ""),
                                    record.tonieInfo,
                                    {
                                        ...record,
                                        audioUrl:
                                            encodeURI(
                                                "/content/" +
                                                    decodeURIComponent(path) +
                                                    "/" +
                                                    record.name,
                                            ) +
                                            "?ogg=true&special=" +
                                            special +
                                            (overlay ? `&overlay=${overlay}` : ""),
                                    },
                                )
                            }
                        />
                    </Tooltip>,
                );
            }

            if (mode === "full") {
                if (isTapList && record.name.includes(".tap") && handleEditTapClick) {
                    actions.push(
                        <Tooltip
                            open={!canHover ? false : undefined}
                            key={`action-edit-tap-${record.name}`}
                            title={t("fileBrowser.tap.edit")}
                        >
                            <EditOutlined
                                style={{ margin: "4px 8px 4px 0", padding: 4 }}
                                onClick={() => handleEditTapClick(path + "/" + record.name)}
                            />
                        </Tooltip>,
                    );
                }

                if (record.tafHeader && handleEditTafMetaDataClick) {
                    actions.push(
                        <Tooltip
                            open={!canHover ? false : undefined}
                            key={`action-edit-tafmeta-${record.name}`}
                            title={t("fileBrowser.tafMeta.edit")}
                        >
                            <EditOutlined
                                style={{ margin: "4px 8px 4px 0", padding: 4 }}
                                onClick={() => handleEditTafMetaDataClick(path, record)}
                            />
                        </Tooltip>,
                    );
                }

                if (!record.isDir && handleFileDownload) {
                    const isDownloading = !!downloading?.[record.name];

                    actions.push(
                        isDownloading ? (
                            <Spin
                                key={`action-download-${record.name}`}
                                style={{ margin: "0 6px 0 0", padding: 4 }}
                                size="small"
                                indicator={
                                    <LoadingOutlined
                                        style={{
                                            fontSize: 16,
                                            color: token.colorText,
                                        }}
                                        spin
                                    />
                                }
                            />
                        ) : (
                            <Tooltip
                                open={!canHover ? false : undefined}
                                key={`action-download-${record.name}`}
                                title={
                                    record.name.endsWith(".taf")
                                        ? t("fileBrowser.downloadFileAsOgg")
                                        : t("fileBrowser.downloadFile")
                                }
                            >
                                <DownloadOutlined
                                    style={{ margin: "4px 8px 4px 0", padding: 4 }}
                                    onClick={() =>
                                        handleFileDownload(
                                            record,
                                            import.meta.env.VITE_APP_TEDDYCLOUD_API_URL,
                                            path,
                                            special,
                                            overlay,
                                        )
                                    }
                                />
                            </Tooltip>
                        ),
                    );
                }

                if (
                    record.tafHeader &&
                    !record.isDir &&
                    special !== "library" &&
                    migrateContent2Lib
                ) {
                    actions.push(
                        <Tooltip
                            open={!canHover ? false : undefined}
                            key={`action-migrate-${record.name}`}
                            title={t("fileBrowser.migrateContentToLib")}
                        >
                            <CloudServerOutlined
                                onClick={() =>
                                    migrateContent2Lib(
                                        path.replace("/", "") + record.name,
                                        false,
                                        overlay,
                                    )
                                }
                                style={{ margin: "4px 8px 4px 0", padding: 4 }}
                            />
                        </Tooltip>,
                    );
                    actions.push(
                        <Tooltip
                            open={!canHover ? false : undefined}
                            key={`action-migrate-root-${record.name}`}
                            title={t("fileBrowser.migrateContentToLibRoot")}
                        >
                            <TruckOutlined
                                onClick={() => migrateContent2Lib(record.ruid, true, overlay)}
                                style={{ margin: "4px 8px 4px 0", padding: 4 }}
                            />
                        </Tooltip>,
                    );
                }

                if ((special === "library" || special === "custom_img") && record.name !== "..") {
                    if (!record.isDir && showRenameDialog) {
                        actions.push(
                            <Tooltip
                                open={!canHover ? false : undefined}
                                key={`action-rename-${record.name}`}
                                title={t("fileBrowser.rename")}
                            >
                                <FormOutlined
                                    onClick={() => showRenameDialog(record.name)}
                                    style={{
                                        margin: "4px 8px 4px 0",
                                        padding: 4,
                                    }}
                                />
                            </Tooltip>,
                        );
                    }
                    if (!record.isDir && showMoveDialog) {
                        actions.push(
                            <Tooltip
                                open={!canHover ? false : undefined}
                                key={`action-move-${record.name}`}
                                title={t("fileBrowser.move")}
                            >
                                <NodeExpandOutlined
                                    onClick={() => showMoveDialog(record.name)}
                                    style={{
                                        margin: "4px 8px 4px 0",
                                        padding: 4,
                                    }}
                                />
                            </Tooltip>,
                        );
                    }
                }

                if (record.name !== ".." && showDeleteConfirmDialog) {
                    actions.push(
                        <Tooltip
                            open={!canHover ? false : undefined}
                            key={`action-delete-${record.name}`}
                            title={t("fileBrowser.delete")}
                        >
                            <DeleteOutlined
                                onClick={() =>
                                    showDeleteConfirmDialog(
                                        record.name,
                                        path + "/" + record.name,
                                        "?special=" +
                                            special +
                                            (overlay ? `&overlay=${overlay}` : ""),
                                    )
                                }
                                style={{
                                    margin: "4px 8px 4px 0",
                                    padding: 4,
                                }}
                            />
                        </Tooltip>,
                    );
                }
            }

            return (
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                    {actions}
                </div>
            );
        },
        showOnDirOnly: false,
    };

    columns.push(actionsColumn);

    columns.forEach((column) => {
        if (!column.hasOwnProperty("sorter")) {
            (column as any).sorter = (a: any, b: any) => defaultSorter(a, b, column.dataIndex);
        }
    });

    if (showDirOnly) {
        columns = columns.filter((column) => column.showOnDirOnly);
    }

    if (showColumns) {
        columns = columns.filter((column) => {
            if (typeof column.key === "string") {
                return showColumns.includes(column.key);
            }
            return false;
        });
    }

    columns = columns.filter((column) => {
        const hideFor = (column as any).hideForSpecial;
        return !hideFor || hideFor !== special;
    });

    columns = columns.map((column) => ({
        ...column,
        onCell: (record: any) => {
            const existing = typeof column.onCell === "function" ? column.onCell(record) : {};
            return {
                ...existing,
                style: {
                    verticalAlign: "middle",
                    ...(existing?.style || {}),
                },
            };
        },
    }));

    return columns;
};
