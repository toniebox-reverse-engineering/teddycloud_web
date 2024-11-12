import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Table, Tooltip, Input, Breadcrumb, InputRef, theme, Empty } from "antd";
import { Key } from "antd/es/table/interface";
import { SortOrder } from "antd/es/table/interface";
import { CloseOutlined, FolderOutlined, PlayCircleOutlined } from "@ant-design/icons";

import { Record } from "../../types/fileBrowserTypes";

import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

import { LoadingSpinnerAsOverlay } from "./LoadingSpinner";
import TonieInformationModal from "./TonieInformationModal";
import { useAudioContext } from "../audio/AudioContext";
import { humanFileSize } from "../../utils/humanFileSize";
import { supportedAudioExtensionsFFMPG } from "../../utils/supportedAudioExtensionsFFMPG";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

const { useToken } = theme;

const supportedAudioExtensionsForEncoding = supportedAudioExtensionsFFMPG;

export const SelectFileFileBrowser: React.FC<{
    special: string;
    filetypeFilter?: string[];
    overlay?: string;
    maxSelectedRows?: number;
    trackUrl?: boolean;
    showDirOnly?: boolean;
    showColumns?: string[];
    onFileSelectChange?: (files: any[], path: string, special: string) => void;
}> = ({
    special,
    filetypeFilter = [],
    overlay = "",
    maxSelectedRows = 0,
    trackUrl = true,
    showDirOnly = false,
    showColumns = undefined,
    onFileSelectChange,
}) => {
    const { t } = useTranslation();
    const { playAudio } = useAudioContext();
    const { token } = useToken();
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();

    const location = useLocation();
    const navigate = useNavigate();
    const inputRefFilter = useRef<InputRef>(null);
    const cursorPositionFilterRef = useRef<number | null>(null);

    const [files, setFiles] = useState<any[]>([]);
    const [path, setPath] = useState("");
    const [rebuildList, setRebuildList] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const [isInformationModalOpen, setInformationModalOpen] = useState<boolean>(false);
    const [currentRecord, setCurrentRecord] = useState<Record>();
    const [currentAudioUrl, setCurrentAudioUrl] = useState<string>("");

    const [filterText, setFilterText] = useState("");
    const [filterFieldAutoFocus, setFilterFieldAutoFocus] = useState(false);

    const [loading, setLoading] = useState<boolean>(true);
    const parentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSelectedRowKeys([]);
    }, []);

    useEffect(() => {
        if (overlay) {
            const queryParams = new URLSearchParams(location.search);
            queryParams.set("path", "");
            setPath("");
            const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
            window.history.replaceState(null, "", newUrl);
            setRebuildList((prev) => !prev);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [overlay]);

    useEffect(() => {
        setLoading(true);
        api.apiGetTeddyCloudApiRaw(
            `/api/fileIndexV2?path=${path}&special=${special}` + (overlay ? `&overlay=${overlay}` : "")
        )
            .then((response) => response.json())
            .then((data) => {
                var list: never[] = data.files;

                if (showDirOnly) list = list.filter((file: any) => file.isDir);
                if (filetypeFilter.length > 0)
                    list = list.filter(
                        (file: any) =>
                            file.isDir || filetypeFilter.some((filetypeFilter) => file.name.endsWith(filetypeFilter))
                    );
                setFiles(list);
            })
            .catch((error) =>
                addNotification(
                    NotificationTypeEnum.Error,
                    t("fileBrowser.messages.errorFetchingDirContent"),
                    t("fileBrowser.messages.errorFetchingDirContentDetails", { path: path || "/" }) + error,
                    t("fileBrowser.title")
                )
            )
            .finally(() => {
                setLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, special, showDirOnly, rebuildList]);

    useEffect(() => {
        if (cursorPositionFilterRef.current !== null && inputRefFilter.current) {
            inputRefFilter.current.setSelectionRange(cursorPositionFilterRef.current, cursorPositionFilterRef.current);
        }
    }, [filterText]);

    // information model functions
    const showInformationModal = (record: any) => {
        if (!record.isDir && record.tonieInfo?.tracks) {
            setCurrentRecord(record);
            setCurrentAudioUrl(
                encodeURI("/content" + path + "/" + record.name) +
                    "?ogg=true&special=" +
                    special +
                    (overlay ? `&overlay=${overlay}` : "")
            );
            setInformationModalOpen(true);
        }
    };

    // breadcrumb functions
    const handleBreadcrumbClick = (dirPath: string) => {
        if (trackUrl) {
            navigate(`?path=${dirPath}`);
        }
        if (path === dirPath) {
            setRebuildList((prev) => !prev);
        }
        setFilterFieldAutoFocus(false);
        setPath(dirPath);
    };

    const generateBreadcrumbs = (path: string, handleBreadcrumbClick: { (dirPath: string): void }) => {
        const pathArray = path.split("/").filter((segment) => segment);

        const breadcrumbItems = [
            {
                title: (
                    <span style={{ cursor: "pointer" }} onClick={() => handleBreadcrumbClick("")}>
                        {t("fileBrowser.root")}
                    </span>
                ),
                key: "/",
            },
        ];

        pathArray.forEach((segment, index) => {
            const segmentPath = `/${pathArray.slice(0, index + 1).join("/")}`;
            breadcrumbItems.push({
                title: (
                    <span style={{ cursor: "pointer" }} onClick={() => handleBreadcrumbClick(segmentPath)}>
                        {segment}
                    </span>
                ),
                key: segmentPath,
            });
        });

        return <Breadcrumb items={breadcrumbItems} />;
    };

    // filter functions
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterText(e.target.value);
        cursorPositionFilterRef.current = e.target.selectionStart;
        setFilterFieldAutoFocus(true);
    };

    const clearFilterField = () => {
        setFilterText("");
        cursorPositionFilterRef.current = 0;
    };

    const handleFilterFieldInputFocus = () => {
        setFilterFieldAutoFocus(true);
    };
    const handleFilterFieldInputBlur = () => {
        setFilterFieldAutoFocus(false);
    };

    // table functions
    const rowClassName = (record: any) => {
        return selectedRowKeys.includes(record.key) ? "highlight-row" : "";
    };

    const onSelectChange = (newSelectedRowKeys: Key[]) => {
        if (maxSelectedRows > 0) {
            if (filetypeFilter) {
                const rowCount = newSelectedRowKeys.length;
                newSelectedRowKeys = newSelectedRowKeys.filter((key) => {
                    const file = files.find((f: any) => f.name === key) as any;
                    return (
                        (file && file.tafHeader !== undefined) ||
                        (file && filetypeFilter.some((ext) => file.name.toLowerCase().endsWith(ext)))
                    );
                });
                if (rowCount !== newSelectedRowKeys.length) {
                    addNotification(
                        NotificationTypeEnum.Warning,
                        t("fileBrowser.fileTypesWarning"),
                        t("fileBrowser.selectAllowedFileTypesOnly", { fileTypes: filetypeFilter.join(", ") }),
                        t("fileBrowser.title")
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
                    t("fileBrowser.title")
                );
            } else {
                setSelectedRowKeys(newSelectedRowKeys);
            }
        } else {
            setSelectedRowKeys(newSelectedRowKeys);
        }
        const selectedFiles = files?.filter((file: any) => newSelectedRowKeys.includes(file.name)) || [];
        if (onFileSelectChange !== undefined) onFileSelectChange(selectedFiles, path, special);
    };

    const handleDirClick = (dirPath: string) => {
        setLoading(true);
        const newPath = dirPath === ".." ? path.split("/").slice(0, -1).join("/") : `${path}/${dirPath}`;
        if (trackUrl) {
            navigate(`?path=${newPath}`);
        }
        setFilterFieldAutoFocus(false);
        setSelectedRowKeys([]);
        setPath(newPath);
    };

    const getFieldValue = (obj: any, keys: string[]) => {
        return keys.reduce((acc, currentKey) => {
            if (acc && acc[currentKey] !== undefined) {
                return acc[currentKey];
            }
            return undefined;
        }, obj);
    };

    const defaultSorter = (a: any, b: any, dataIndex: string | string[]) => {
        // Get the values of the fields
        const fieldA = Array.isArray(dataIndex) ? getFieldValue(a, dataIndex) : a[dataIndex];
        const fieldB = Array.isArray(dataIndex) ? getFieldValue(b, dataIndex) : b[dataIndex];

        if (fieldA === undefined && fieldB === undefined) {
            return 0; // Both values are undefined, consider them equal
        } else if (fieldA === undefined) {
            return 1; // Field A is undefined, consider it greater than B
        } else if (fieldB === undefined) {
            return -1; // Field B is undefined, consider it greater than A
        }

        if (typeof fieldA === "string" && typeof fieldB === "string") {
            return fieldA.localeCompare(fieldB);
        } else if (typeof fieldA === "number" && typeof fieldB === "number") {
            return fieldA - fieldB;
        } else {
            console.log("Unsupported types for sorting:", a, b);
            console.log("Unsupported types for sorting field:", dataIndex, fieldA, fieldB);
            return 0;
        }
    };

    const dirNameSorter = (a: any, b: any) => {
        if (a.isDir === b.isDir) {
            return defaultSorter(a, b, "name");
        }
        return a.isDir ? -1 : 1;
    };

    var columns: any[] = [
        {
            title: "",
            dataIndex: ["tonieInfo", "picture"],
            key: "picture",
            sorter: undefined,
            width: 10,
            render: (picture: string, record: any) =>
                record && record.tonieInfo?.picture ? (
                    <img
                        key={`picture-${record.name}`}
                        src={record.tonieInfo.picture}
                        alt={t("tonies.content.toniePicture")}
                        onClick={() => showInformationModal(record)}
                        style={{
                            width: 100,
                            cursor: !record.isDir && record?.tonieInfo?.tracks ? "help" : "default",
                        }}
                    />
                ) : (
                    <></>
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
                                <div>{record.tonieInfo?.model}</div>
                                <div style={{ wordBreak: record.isDir ? "normal" : "break-word" }}>
                                    {(record.tonieInfo?.series ? record.tonieInfo?.series : "") +
                                        (record.tonieInfo?.episode ? " - " + record.tonieInfo?.episode : "")}
                                </div>
                            </div>
                        </div>
                        <div className="showMediumDevicesOnly">
                            <div style={{ display: "flex" }}>
                                {record.isDir ? <FolderOutlined style={{ marginRight: 8 }} /> : ""}
                                <div style={{ wordBreak: record.isDir ? "normal" : "break-word" }}>
                                    {record.isDir ? <>{record.name}</> : record.name}
                                </div>
                            </div>
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
                    ("tonieInfo" in record && record.tonieInfo?.episode.toLowerCase().includes(text))
                );
            },
            showOnDirOnly: true,
        },
        {
            title: t("fileBrowser.model"),
            dataIndex: ["tonieInfo", "model"],
            key: "model",
            showOnDirOnly: false,
            responsive: ["xl"],
            render: (model: string, record: any) => <div key={`model-${record.name}`}>{record.tonieInfo?.model}</div>,
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
            title: <div className="showMediumDevicesOnly showBigDevicesOnly">{t("fileBrowser.actions")}</div>,
            dataIndex: "controls",
            key: "controls",
            sorter: undefined,
            render: (name: string, record: any) => {
                let actions = [];

                // taf file
                if (record.tafHeader) {
                    actions.push(
                        <Tooltip key={`action-play-${record.name}`} title={t("fileBrowser.playFile")}>
                            <PlayCircleOutlined
                                style={{ margin: "0 8px 0 0" }}
                                onClick={() =>
                                    playAudio(
                                        encodeURI(
                                            import.meta.env.VITE_APP_TEDDYCLOUD_API_URL +
                                                "/content" +
                                                path +
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
                                                encodeURI("/content" + path + "/" + record.name) +
                                                "?ogg=true&special=" +
                                                special +
                                                (overlay ? `&overlay=${overlay}` : ""),
                                        }
                                    )
                                }
                            />
                        </Tooltip>
                    );
                } else if (supportedAudioExtensionsForEncoding.some((ending) => record.name.endsWith(ending))) {
                    actions.push(
                        <Tooltip key={`action-play-${record.name}`} title={t("fileBrowser.playFile")}>
                            <PlayCircleOutlined
                                style={{ margin: "0 8px 0 0" }}
                                onClick={() =>
                                    playAudio(
                                        encodeURI(
                                            import.meta.env.VITE_APP_TEDDYCLOUD_API_URL +
                                                "/content" +
                                                path +
                                                "/" +
                                                record.name
                                        ) +
                                            "?special=" +
                                            special +
                                            (overlay ? `&overlay=${overlay}` : ""),
                                        record.tonieInfo
                                    )
                                }
                            />
                        </Tooltip>
                    );
                }
                return actions;
            },
            showOnDirOnly: false,
        },
    ];

    columns.forEach((column) => {
        if (!column.hasOwnProperty("sorter")) {
            (column as any).sorter = (a: any, b: any) => defaultSorter(a, b, column.dataIndex);
        }
    });

    if (showDirOnly) columns = columns.filter((column) => column.showOnDirOnly);

    if (showColumns) {
        columns = columns.filter((column) => {
            if (typeof column.key === "string") {
                // Check if the column's dataIndex matches any of the specified dataIndex values
                return showColumns.includes(column.key);
            }
            return false;
        });
    }
    const noData = loading ? "" : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;

    return (
        <>
            {currentRecord ? (
                <TonieInformationModal
                    open={isInformationModalOpen}
                    tonieCardOrTAFRecord={{ ...currentRecord, audioUrl: currentAudioUrl }}
                    onClose={() => setInformationModalOpen(false)}
                    overlay={overlay}
                />
            ) : (
                ""
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "row", marginBottom: 8 }}>
                    <div style={{ lineHeight: 1.5, marginRight: 16 }}>{t("tonies.currentPath")}</div>
                    {generateBreadcrumbs(path, handleBreadcrumbClick)}
                </div>
            </div>
            <div className="test" style={{ position: "relative" }} ref={parentRef}>
                {loading ? <LoadingSpinnerAsOverlay parentRef={parentRef} /> : ""}
                <Table
                    dataSource={files}
                    columns={columns}
                    rowKey={(record) => record.name}
                    pagination={false}
                    onRow={(record) => ({
                        onDoubleClick: () => {
                            if (record.isDir) {
                                handleDirClick(record.name);
                            } else {
                                const newSelectedKeys = selectedRowKeys.includes(record.name)
                                    ? selectedRowKeys.filter((key) => key !== record.name)
                                    : [...selectedRowKeys, record.name];

                                onSelectChange(newSelectedKeys);
                            }
                        },
                        style: { cursor: record.isDir ? "context-menu" : "unset" },
                    })}
                    rowClassName={rowClassName}
                    rowSelection={
                        maxSelectedRows > 0
                            ? {
                                  selectedRowKeys,
                                  onChange: onSelectChange,
                              }
                            : {
                                  selectedRowKeys,
                                  onChange: onSelectChange,
                                  getCheckboxProps: (record: Record) => ({
                                      disabled: record.name === "..", // Disable checkbox for rows with name '..'
                                  }),
                                  onSelectAll: (selected: boolean, selectedRows: any[]) => {
                                      const selectedKeys = selected
                                          ? selectedRows.filter((row) => row.name !== "..").map((row) => row.name)
                                          : [];
                                      setSelectedRowKeys(selectedKeys);
                                  },
                              }
                    }
                    components={{
                        // Override the header to include custom search row
                        header: {
                            wrapper: (props: any) => {
                                return <thead {...props} />;
                            },
                            row: (props: any) => {
                                return (
                                    <>
                                        <tr {...props} />
                                        <tr>
                                            <th style={{ padding: "10px 8px" }} colSpan={columns.length + 1}>
                                                <Input
                                                    placeholder={t("fileBrowser.filter")}
                                                    value={filterText}
                                                    onChange={handleFilterChange}
                                                    onFocus={handleFilterFieldInputFocus}
                                                    onBlur={handleFilterFieldInputBlur}
                                                    ref={inputRefFilter} // Assign ref to input element
                                                    style={{ width: "100%" }}
                                                    autoFocus={filterFieldAutoFocus}
                                                    addonAfter={
                                                        <CloseOutlined
                                                            onClick={clearFilterField}
                                                            disabled={filterText.length === 0}
                                                            style={{
                                                                color:
                                                                    filterText.length === 0
                                                                        ? token.colorTextDisabled
                                                                        : token.colorText,
                                                                cursor: filterText.length === 0 ? "default" : "pointer",
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
                    }}
                    locale={{ emptyText: noData }}
                />
            </div>
        </>
    );
};
