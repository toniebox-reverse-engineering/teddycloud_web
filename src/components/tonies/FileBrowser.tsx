import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useTranslation } from "react-i18next";
import { Modal, Table, Tooltip, message } from "antd";
import { Key } from "antd/es/table/interface"; // Import Key type from Ant Design
import { SortOrder } from "antd/es/table/interface";

import { useAudioContext } from "../audio/AudioContext";

import {
    CloudServerOutlined,
    CopyOutlined,
    DeleteOutlined,
    EditOutlined,
    PlayCircleOutlined,
    TruckOutlined,
} from "@ant-design/icons";
import { humanFileSize } from "../../util/humanFileSize";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { darcula, dracula, oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { materialLight } from "react-syntax-highlighter/dist/cjs/styles/prism";

export const FileBrowser: React.FC<{
    special: string;
    filetypeFilter?: string[];
    isTapList?: boolean;
    overlay?: string;
    maxSelectedRows?: number;
    trackUrl?: boolean;
    selectTafOnly?: boolean;
    showDirOnly?: boolean;
    showColumns?: string[];
    onFileSelectChange?: (files: any[], path: string, special: string) => void;
}> = ({
    special,
    filetypeFilter = [],
    isTapList = false,
    overlay = "",
    maxSelectedRows = 0,
    selectTafOnly = true,
    trackUrl = true,
    showDirOnly = false,
    showColumns = undefined,
    onFileSelectChange,
}) => {
    const { t } = useTranslation();

    const { playAudio } = useAudioContext();
    const [messageApi, contextHolder] = message.useMessage();
    const [files, setFiles] = useState([]);
    const [path, setPath] = useState("");
    const [rebuildList, setRebuildList] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const [currentFile, setCurrentFile] = useState("");

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const [jsonData, setJsonData] = useState(null);
    const [jsonViewerModalOpened, setJsonViewerModalOpened] = useState(false);

    const fetchJsonData = async (url: string) => {
        try {
            const response = await fetch(url);
            const data = await response.json();
            setJsonData(data);
        } catch (error) {
            console.error("Error fetching JSON data:", error);
        }
    };

    const showJsonViewer = (file: string) => {
        const folder = special === "library" ? "/library" : "/content";
        fetchJsonData(process.env.REACT_APP_TEDDYCLOUD_API_URL + folder + file);
        setCurrentFile(file);
        setJsonViewerModalOpened(true);
    };

    const handleJsonViewerModalClose = () => {
        setJsonViewerModalOpened(false);
    };
    const rowClassName = (record: any) => {
        return selectedRowKeys.includes(record.key) ? "highlight-row" : "";
    };
    const onSelectChange = (newSelectedRowKeys: Key[]) => {
        if (selectTafOnly) {
            const rowCount = newSelectedRowKeys.length;
            newSelectedRowKeys = newSelectedRowKeys.filter((key) => {
                const file = files.find((f: any) => f.name === key) as any;
                return file && file.tafHeader !== undefined;
            });
            if (rowCount !== newSelectedRowKeys.length) {
                message.warning(t("fileBrowser.selectTafOnly"));
            }
        }
        if (newSelectedRowKeys.length > maxSelectedRows) {
            message.warning(
                t("fileBrowser.maxSelectedRows", {
                    maxSelectedRows: maxSelectedRows,
                })
            );
        } else {
            setSelectedRowKeys(newSelectedRowKeys);
        }

        const selectedFiles = files?.filter((file: any) => newSelectedRowKeys.includes(file.name)) || [];
        if (onFileSelectChange !== undefined) onFileSelectChange(selectedFiles, path, special);
    };

    useEffect(() => {
        // Function to parse the query parameters from the URL
        const queryParams = new URLSearchParams(location.search);
        const initialPath = queryParams.get("path") || ""; // Get the 'path' parameter from the URL, default to empty string if not present

        setPath(initialPath); // Set the initial path
    }, [location]);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        queryParams.set("path", "");
        setPath("");
        const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
        window.history.replaceState(null, "", newUrl);
        setRebuildList(!rebuildList);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [overlay]);

    useEffect(() => {
        // TODO: fetch option value with API Client generator
        fetch(
            `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/fileIndexV2?path=${path}&special=${special}` +
                (overlay ? `&overlay=${overlay}` : "")
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
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, special, showDirOnly, rebuildList]);

    const handleDirClick = (dirPath: string) => {
        const newPath = dirPath === ".." ? path.split("/").slice(0, -1).join("/") : `${path}/${dirPath}`;
        if (trackUrl) {
            navigate(`?path=${newPath}`); // Update the URL with the new path using navigate
        }
        setPath(newPath); // Update the path state
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

    const migrateContent2Lib = (ruid: string, libroot: boolean, overlay?: string) => {
        try {
            messageApi.open({
                type: "loading",
                content: t("fileBrowser.messages.migrationOngoing"),
                duration: 0,
            });

            const body = `ruid=${ruid}&libroot=${libroot}`;
            fetch(
                process.env.REACT_APP_TEDDYCLOUD_API_URL +
                    "/api/migrateContent2Lib" +
                    (overlay ? "?overlay=" + overlay : ""),
                {
                    method: "POST",
                    body: body,
                    headers: {
                        "Content-Type": "text/plain",
                    },
                }
            )
                /* prepared handling with response if response is added in backend
            .then((response) => response.text())
                .then((data) => {
                    messageApi.destroy();

                    if (data === "OK") {
                        messageApi.open({
                            type: "success",
                            content: t("fileBrowser.messages.migrationSuccessful"),
                        });

                        // now the page shall reload
                        setRebuildList(!rebuildList);
                    } else {
                        messageApi.open({
                            type: "error",
                            content: t("fileBrowser.messages.migrationFailed") + ": " + data,
                        });
                    }
                })
            */
                .then(() => {
                    messageApi.destroy();
                    messageApi.open({
                        type: "success",
                        content: t("fileBrowser.messages.migrationSuccessful"),
                    });

                    // now the page shall reload
                    setRebuildList(!rebuildList);
                })
                .catch((error) => {
                    messageApi.destroy();
                    messageApi.open({
                        type: "error",
                        content: t("fileBrowser.messages.migrationFailed") + ": " + error,
                    });
                });
        } catch (error) {
            messageApi.destroy();
            messageApi.open({
                type: "error",
                content: t("fileBrowser.messages.migrationFailed") + ": " + error,
            });
        }
    };

    const deleteFile = (path: string, apiCall: string) => {
        try {
            messageApi.open({
                type: "loading",
                content: t("fileBrowser.messages.deleting"),
                duration: 0,
            });

            const body = path;
            fetch(process.env.REACT_APP_TEDDYCLOUD_API_URL + "/api/fileDelete" + apiCall, {
                method: "POST",
                body: body,
                headers: {
                    "Content-Type": "text/plain",
                },
            })
                .then((response) => response.text())
                .then((data) => {
                    messageApi.destroy();
                    if (data === "OK") {
                        messageApi.open({
                            type: "success",
                            content: t("fileBrowser.messages.deleteSuccessful"),
                        });
                        // now the page shall reload
                        setRebuildList(!rebuildList);
                    } else {
                        messageApi.open({
                            type: "error",
                            content: t("fileBrowser.messages.deleteFailed") + ": " + data,
                        });
                    }
                })
                .catch((error) => {
                    messageApi.destroy();
                    messageApi.open({
                        type: "error",
                        content: t("fileBrowser.messages.deleteFailed") + ": " + error,
                    });
                });
        } catch (error) {
            messageApi.destroy();
            messageApi.open({
                type: "error",
                content: t("fileBrowser.messages.deleteFailed") + ": " + error,
            });
        }
    };

    var columns = [
        {
            title: "",
            dataIndex: ["tonieInfo", "picture"],
            key: "picture",
            sorter: undefined,
            render: (picture: string) =>
                picture && <img src={picture} alt={t("tonies.content.toniePicture")} style={{ width: 100 }} />,
            showOnDirOnly: false,
        },
        {
            title: t("fileBrowser.name"),
            dataIndex: "name",
            key: "name",
            sorter: dirNameSorter,
            defaultSortOrder: "ascend" as SortOrder,
            render: (name: string, record: any) => (record.isDir ? "[" + name + "]" : name),
            showOnDirOnly: true,
        },
        {
            title: t("fileBrowser.size"),
            dataIndex: "size",
            key: "size",
            render: (size: number, record: any) => (record.isDir ? "<DIR>" : humanFileSize(size)),
            showOnDirOnly: false,
        },
        {
            title: t("fileBrowser.model"),
            dataIndex: ["tonieInfo", "model"],
            key: "model",
            showOnDirOnly: false,
        },
        {
            title: t("fileBrowser.series"),
            dataIndex: ["tonieInfo", "series"],
            key: "series",
            showOnDirOnly: false,
        },
        {
            title: t("fileBrowser.episode"),
            dataIndex: ["tonieInfo", "episode"],
            key: "episode",
            showOnDirOnly: false,
        },
        {
            title: t("fileBrowser.date"),
            dataIndex: "date",
            key: "date",
            render: (timestamp: number) => new Date(timestamp * 1000).toLocaleString(),
            showOnDirOnly: true,
        },
        {
            title: t("fileBrowser.actions"),
            dataIndex: "name",
            key: "controls",
            sorter: undefined,
            render: (name: string, record: any) => {
                let actions = [];

                // taf file
                if (record.tafHeader) {
                    // migration to lib possible
                    if (special !== "library") {
                        actions.push(
                            <Tooltip title={t("fileBrowser.migrateContentToLib")}>
                                <CloudServerOutlined
                                    onClick={() => migrateContent2Lib(path.replace("/", "") + name, false, overlay)}
                                    style={{ margin: "0 16px 0 0" }}
                                />
                            </Tooltip>
                        );
                        actions.push(
                            <Tooltip title={t("fileBrowser.migrateContentToLibRoot")}>
                                <TruckOutlined
                                    onClick={() => migrateContent2Lib(path.replace("/", "") + name, true, overlay)}
                                    style={{ margin: "0 16px 0 0" }}
                                />
                            </Tooltip>
                        );
                    }
                    actions.push(
                        <Tooltip title={t("fileBrowser.playFile")}>
                            <PlayCircleOutlined
                                style={{ margin: "0 16px 0 0" }}
                                onClick={() =>
                                    playAudio(
                                        process.env.REACT_APP_TEDDYCLOUD_API_URL +
                                            "/content" +
                                            path +
                                            "/" +
                                            name +
                                            "?ogg=true&special=" +
                                            special +
                                            (overlay ? `&overlay=${overlay}` : ""),
                                        record.tonieInfo
                                    )
                                }
                            />
                        </Tooltip>
                    );
                }
                // tap file
                if (isTapList && record.name.includes(".tap")) {
                    actions.push(
                        <Tooltip title={t("fileBrowser.tap.edit")}>
                            <EditOutlined style={{ margin: "0 16px 0 0" }} />
                        </Tooltip>
                    );
                    actions.push(
                        <Tooltip title={t("fileBrowser.tap.copy")}>
                            <CopyOutlined style={{ margin: "0 16px 0 0" }} />
                        </Tooltip>
                    );
                }
                // include the delete action
                if (record.name !== ".." && maxSelectedRows === 0) {
                    actions.push(
                        <Tooltip title={t("fileBrowser.delete")}>
                            <DeleteOutlined
                                onClick={() =>
                                    deleteFile(
                                        path + "/" + name,
                                        "?special=" + special + (overlay ? `&overlay=${overlay}` : "")
                                    )
                                }
                                style={{ margin: "0 16px 0 0" }}
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
            if (typeof column.dataIndex === "string") {
                // Check if the column's dataIndex matches any of the specified dataIndex values
                return showColumns.includes(column.dataIndex);
            }
            return false;
        });
    }

    function detectColorScheme() {
        const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const storedTheme = localStorage.getItem("theme");

        if (storedTheme === "auto") {
            return prefersDarkMode ? "dark" : "light";
        } else {
            return storedTheme;
        }
    }

    return (
        <>
            {contextHolder}
            <Modal
                width={700}
                title={"File: " + currentFile}
                open={jsonViewerModalOpened}
                onCancel={handleJsonViewerModalClose}
                onOk={handleJsonViewerModalClose}
            >
                {jsonData ? (
                    <SyntaxHighlighter
                        language="json"
                        style={detectColorScheme() === "dark" ? oneDark : oneLight}
                        customStyle={{
                            padding: 0,
                            borderRadius: 0,
                            margin: 0,
                            border: "none",
                        }}
                    >
                        {JSON.stringify(jsonData, null, 2)}
                    </SyntaxHighlighter>
                ) : (
                    "Loading..."
                )}
            </Modal>
            <Table
                dataSource={files}
                columns={columns}
                rowKey="name"
                pagination={false}
                onRow={(record) => ({
                    onDoubleClick: () => {
                        if (record.isDir) {
                            handleDirClick(record.name);
                        } else if (record.name.includes(".json") || record.name.includes(".tap")) {
                            showJsonViewer(path + "/" + record.name);
                        }
                    },
                })}
                rowClassName={rowClassName}
                rowSelection={
                    maxSelectedRows > 0
                        ? {
                              selectedRowKeys,
                              onChange: onSelectChange,
                          }
                        : undefined
                }
            />
        </>
    );
};
