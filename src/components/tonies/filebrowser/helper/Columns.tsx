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
    CopyOutlined,
    FormOutlined,
    NodeExpandOutlined,
    DeleteOutlined,
    LoadingOutlined,
} from "@ant-design/icons";

import { Record } from "../../../../types/fileBrowserTypes";
import { humanFileSize } from "../../../../utils/files/humanFileSize";
import { ffmpegSupportedExtensions } from "../../../../utils/files/ffmpegSupportedExtensions";
import { TonieCardProps } from "../../../../types/tonieTypes";
import { useTranslation } from "react-i18next";

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
    playAudio: (url: string, meta?: any, tonieCardOrTAFRecord?: TonieCardTAFRecord, startTime?: number) => void;

    handleFileDownload?: (record: Record, baseUrl: string, path: string, special: string, overlay?: string) => void;

    migrateContent2Lib?: (ruid: string, libroot: boolean, overlay?: string) => void;
    handleEditTapClick?: (fullPath: string) => void;
    handleEditTafMetaDataClick?: (path: string, record: Record) => void;
    showRenameDialog?: (fileName: string) => void;
    showMoveDialog?: (fileName: string) => void;
    showDeleteConfirmDialog?: (fileName: string, fullPath: string, query: string) => void;
}

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
    } = options;

    let columns: any[] = [
        {
            title: mode === "full" ? <div style={{ minHeight: 32 }}></div> : "",
            dataIndex: ["tonieInfo", "picture"],
            key: "picture",
            sorter: undefined,
            width: 10,
            render: (picture: string, record: any) => (
                <>
                    {record && record.tonieInfo?.picture ? (
                        <img
                            key={`picture-${record.name}`}
                            src={record.tonieInfo.picture}
                            alt={t("tonies.content.toniePicture")}
                            onClick={() => showInformationModal(record)}
                            style={{
                                height: 40,
                                width: 40,
                                objectFit: "contain",
                                cursor: "pointer",
                                marginRight: 8,
                            }}
                        />
                    ) : (
                        <></>
                    )}
                    {mode === "full" && record.hide ? (
                        <div style={{ textAlign: "center" }}>
                            <Tag style={{ border: 0 }} color="warning">
                                {t("fileBrowser.hidden")}
                            </Tag>
                        </div>
                    ) : (
                        ""
                    )}
                </>
            ),
            showOnDirOnly: false,
        },

        {
            title: t("fileBrowser.name"),
            dataIndex: "name",
            key: "name",
            sorter: dirNameSorter,
            defaultSortOrder: "ascend" as SortOrder,
            render: (picture: string, record: any) =>
                record && (
                    <div key={`name-${record.name}`}>
                        <div className="showSmallDevicesOnly">
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex" }}>
                                    {record.isDir ? <FolderOutlined style={{ marginRight: 8 }} /> : ""}
                                    <div style={{ wordBreak: record.isDir ? "normal" : "break-word" }}>
                                        {record.isDir ? <>{record.name}</> : record.name}
                                    </div>
                                </div>
                                {mode === "full" && !record.isDir && record.size
                                    ? " (" + humanFileSize(record.size) + ")"
                                    : ""}
                            </div>
                            <div>{record.tonieInfo?.model}</div>
                            <div style={{ wordBreak: record.isDir ? "normal" : "break-word" }}>
                                {(record.tonieInfo?.series ? record.tonieInfo?.series : "") +
                                    (record.tonieInfo?.episode ? " - " + record.tonieInfo?.episode : "")}
                            </div>
                            {mode === "full" && (
                                <div>{!record.isDir && new Date(record.date * 1000).toLocaleString()}</div>
                            )}
                        </div>
                        <div className="showMediumDevicesOnly">
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex" }}>
                                    {record.isDir ? <FolderOutlined style={{ marginRight: 8 }} /> : ""}
                                    <div style={{ wordBreak: record.isDir ? "normal" : "break-word" }}>
                                        {record.isDir ? <>{record.name}</> : record.name}
                                    </div>
                                </div>
                                {mode === "full" && !record.isDir && record.size
                                    ? " (" + humanFileSize(record.size) + ")"
                                    : ""}
                            </div>
                            {mode === "full" && (
                                <div>{!record.isDir && new Date(record.date * 1000).toLocaleString()}</div>
                            )}
                        </div>
                        <div className="showBigDevicesOnly">
                            <div style={{ display: "flex" }}>
                                {record.isDir ? <FolderOutlined style={{ marginRight: 8 }} /> : ""}
                                <div style={{ wordBreak: record.isDir ? "normal" : "break-word" }}>
                                    {record.isDir ? <>{record.name}</> : record.name}
                                </div>
                            </div>
                        </div>
                    </div>
                ),
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
                    ("tafHeader" in record && record.tafHeader.audioId?.toString().includes(text)) ||
                    ("tonieInfo" in record && record.tonieInfo?.model.toLowerCase().includes(text)) ||
                    ("tonieInfo" in record && record.tonieInfo?.series.toLowerCase().includes(text)) ||
                    ("tonieInfo" in record && record.tonieInfo?.episode.toLowerCase().includes(text)) ||
                    (record.date && new Date(record.date * 1000).toLocaleString().includes(text))
                );
            },
            showOnDirOnly: true,
        },

        {
            title: t("fileBrowser.size"),
            dataIndex: "size",
            key: "size",
            render: (size: number, record: any) => (
                <div key={`size-${record.name}`}>{record.isDir ? "<DIR>" : humanFileSize(size)}</div>
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
            render: (_model: string, record: any) => <div key={`model-${record.name}`}>{record.tonieInfo?.model}</div>,
        },

        {
            title: (
                <>
                    <div className="showMediumDevicesOnly">
                        {t("fileBrowser.model")}/{t("fileBrowser.series")}/{t("fileBrowser.episode")}
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
                                (record.tonieInfo?.episode ? " - " + record.tonieInfo?.episode : "")}
                        </div>
                    </div>
                    <div className="showBigDevicesOnly">{record.tonieInfo?.series ? record.tonieInfo?.series : ""}</div>
                </div>
            ),
            showOnDirOnly: false,
            responsive: ["md"],
        },

        {
            title: t("fileBrowser.episode"),
            dataIndex: ["tonieInfo", "episode"],
            key: "episode",
            showOnDirOnly: false,
            responsive: ["xl"],
            render: (episode: string, record: any) => (
                <div key={`episode-${record.name}`}>{record.tonieInfo?.episode}</div>
            ),
        },

        {
            title: t("fileBrowser.date"),
            dataIndex: "date",
            key: "date",
            render: (timestamp: number, record: any) => (
                <div key={`date-${record.name}`}>{new Date(timestamp * 1000).toLocaleString()}</div>
            ),
            showOnDirOnly: true,
            responsive: ["xl"],
        },
    ];

    const actionsColumn = {
        title: <div className="showMediumDevicesOnly showBigDevicesOnly">{t("fileBrowser.actions")}</div>,
        dataIndex: "controls",
        key: "controls",
        sorter: undefined,
        render: (name: string, record: any) => {
            const actions: React.ReactNode[] = [];

            if (!record.isDir && ffmpegSupportedExtensions.some((ending) => record.name.endsWith(ending))) {
                actions.push(
                    <Tooltip key={`action-play-${record.name}`} title={t("fileBrowser.playFile")}>
                        <PlayCircleOutlined
                            style={{ margin: "4px 8px 4px 0", padding: 4 }}
                            onClick={() =>
                                playAudio(
                                    encodeURI(
                                        import.meta.env.VITE_APP_TEDDYCLOUD_API_URL +
                                            "/content/" +
                                            decodeURIComponent(path) +
                                            "/" +
                                            record.name
                                    ) +
                                        "?ogg=true&special=" +
                                        special +
                                        (overlay ? `&overlay=${overlay}` : ""),
                                    record.tonieInfo,
                                    {
                                        ...record,
                                        audioUrl:
                                            encodeURI("/content/" + decodeURIComponent(path) + "/" + record.name) +
                                            "?ogg=true&special=" +
                                            special +
                                            (overlay ? `&overlay=${overlay}` : ""),
                                    }
                                )
                            }
                        />
                    </Tooltip>
                );
            }

            if (mode === "full") {
                if (isTapList && record.name.includes(".tap") && handleEditTapClick) {
                    actions.push(
                        <Tooltip key={`action-edit-tap-${record.name}`} title={t("fileBrowser.tap.edit")}>
                            <EditOutlined
                                style={{ margin: "4px 8px 4px 0", padding: 4 }}
                                onClick={() => handleEditTapClick(path + "/" + record.name)}
                            />
                        </Tooltip>
                    );
                    actions.push(
                        <Tooltip key={`action-copy-tap-${record.name}`} title={t("fileBrowser.tap.copy")}>
                            <CopyOutlined style={{ margin: "4px 8px 4px 0", padding: 4 }} />
                        </Tooltip>
                    );
                }

                if (record.tafHeader && handleEditTafMetaDataClick) {
                    actions.push(
                        <Tooltip key={`action-edit-tafmeta-${record.name}`} title={t("fileBrowser.tafMeta.edit")}>
                            <EditOutlined
                                style={{ margin: "4px 8px 4px 0", padding: 4 }}
                                onClick={() => handleEditTafMetaDataClick(path, record)}
                            />
                        </Tooltip>
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
                                            overlay
                                        )
                                    }
                                />
                            </Tooltip>
                        )
                    );
                }

                if (record.tafHeader && !record.isDir && special !== "library" && migrateContent2Lib) {
                    actions.push(
                        <Tooltip key={`action-migrate-${record.name}`} title={t("fileBrowser.migrateContentToLib")}>
                            <CloudServerOutlined
                                onClick={() => migrateContent2Lib(path.replace("/", "") + record.name, false, overlay)}
                                style={{ margin: "4px 8px 4px 0", padding: 4 }}
                            />
                        </Tooltip>
                    );
                    actions.push(
                        <Tooltip
                            key={`action-migrate-root-${record.name}`}
                            title={t("fileBrowser.migrateContentToLibRoot")}
                        >
                            <TruckOutlined
                                onClick={() => migrateContent2Lib(record.ruid, true, overlay)}
                                style={{ margin: "4px 8px 4px 0", padding: 4 }}
                            />
                        </Tooltip>
                    );
                }

                if (special === "library" && record.name !== "..") {
                    if (!record.isDir && showRenameDialog) {
                        actions.push(
                            <Tooltip key={`action-rename-${record.name}`} title={t("fileBrowser.rename")}>
                                <FormOutlined
                                    onClick={() => showRenameDialog(record.name)}
                                    style={{
                                        margin: "4px 8px 4px 0",
                                        padding: 4,
                                    }}
                                />
                            </Tooltip>
                        );
                    }
                    if (!record.isDir && showMoveDialog) {
                        actions.push(
                            <Tooltip key={`action-move-${record.name}`} title={t("fileBrowser.move")}>
                                <NodeExpandOutlined
                                    onClick={() => showMoveDialog(record.name)}
                                    style={{
                                        margin: "4px 8px 4px 0",
                                        padding: 4,
                                    }}
                                />
                            </Tooltip>
                        );
                    }
                }

                if (record.name !== ".." && showDeleteConfirmDialog) {
                    actions.push(
                        <Tooltip key={`action-delete-${record.name}`} title={t("fileBrowser.delete")}>
                            <DeleteOutlined
                                onClick={() =>
                                    showDeleteConfirmDialog(
                                        record.name,
                                        path + "/" + record.name,
                                        "?special=" + special + (overlay ? `&overlay=${overlay}` : "")
                                    )
                                }
                                style={{
                                    margin: "4px 8px 4px 0",
                                    padding: 4,
                                }}
                            />
                        </Tooltip>
                    );
                }
            }

            return actions;
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

    return columns;
};
