// useFileBrowserCore.tsx
import React, { useEffect, useRef, useState } from "react";
import { Breadcrumb, Empty, InputRef } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useTeddyCloud } from "../../../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";

type Mode = "fileBrowser" | "select";

interface UseFileBrowserCoreOptions {
    mode: Mode;
    special: string;
    api: any;
    overlay?: string;
    showDirOnly?: boolean;
    filetypeFilter?: string[];
    trackUrl?: boolean;
}

interface UseFileBrowserCoreResult {
    path: string;
    setPath: React.Dispatch<React.SetStateAction<string>>;
    files: any[];
    setFiles: React.Dispatch<React.SetStateAction<any[]>>;
    rebuildList: boolean;
    setRebuildList: React.Dispatch<React.SetStateAction<boolean>>;
    loading: boolean;

    filterText: string;
    filterFieldAutoFocus: boolean;
    setFilterFieldAutoFocus: React.Dispatch<React.SetStateAction<boolean>>; // <<< NEU
    handleFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    clearFilterField: () => void;
    handleFilterFieldInputFocus: () => void;
    handleFilterFieldInputBlur: () => void;
    inputFilterRef: React.RefObject<InputRef | null>;

    generateBreadcrumbs: (currentPath: string) => React.ReactNode;
    handleBreadcrumbClick: (dirPath: string) => void;

    getFieldValue: (obj: any, keys: string[]) => any;
    defaultSorter: (a: any, b: any, dataIndex: string | string[]) => number;
    dirNameSorter: (a: any, b: any) => number;

    noData: React.ReactNode;
    parentRef: React.RefObject<HTMLDivElement | null>;
}

export const useFileBrowserCore = ({
    mode,
    special,
    api,
    overlay = "",
    showDirOnly = false,
    filetypeFilter = [],
    trackUrl = true,
}: UseFileBrowserCoreOptions): UseFileBrowserCoreResult => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();

    const location = useLocation();
    const navigate = useNavigate();

    const [files, setFiles] = useState<any[]>([]);

    const queryParams = new URLSearchParams(location.search);
    const initialPathFromUrl = queryParams.get("path") || "";
    const initialPath = mode === "fileBrowser" ? initialPathFromUrl.split("/").map(encodeURIComponent).join("/") : "";

    const [path, setPath] = useState<string>(initialPath);
    const [rebuildList, setRebuildList] = useState<boolean>(false);

    const [filterText, setFilterText] = useState<string>("");
    const [filterFieldAutoFocus, setFilterFieldAutoFocus] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    const inputFilterRef = useRef<InputRef>(null);
    const cursorPositionFilterRef = useRef<number | null>(null);
    const parentRef = useRef<HTMLDivElement>(null);

    // overlay → reset path + URL + force reload
    useEffect(() => {
        if (!overlay) return;

        const queryParams = new URLSearchParams(location.search);
        queryParams.set("path", "");
        setPath("");
        const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
        window.history.replaceState(null, "", newUrl);
        setRebuildList((prev) => !prev);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [overlay]);

    // fetch directory listing
    useEffect(() => {
        setLoading(true);

        const apiPathParam = mode === "fileBrowser" ? path : encodeURIComponent(path);

        api.apiGetTeddyCloudApiRaw(
            `/api/fileIndexV2?path=${apiPathParam}&special=${special}` + (overlay ? `&overlay=${overlay}` : "")
        )
            .then((response: Response) => response.json())
            .then((data: any) => {
                let list: any[] = data.files;

                if (showDirOnly) {
                    list = list.filter((file: any) => file.isDir);
                }

                if (filetypeFilter.length > 0) {
                    list = list.filter(
                        (file: any) =>
                            file.isDir || filetypeFilter.some((filetypeFilter) => file.name.endsWith(filetypeFilter))
                    );
                }

                setFiles(list);
            })
            .catch((error: any) =>
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

    // restore caret position in filter field
    useEffect(() => {
        if (cursorPositionFilterRef.current !== null && inputFilterRef.current) {
            inputFilterRef.current.setSelectionRange(cursorPositionFilterRef.current, cursorPositionFilterRef.current);
        }
    }, [filterText]);

    // filter handlers
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

    // breadcrumbs
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

    const generateBreadcrumbs = (currentPath: string) => {
        const pathArray = currentPath.split("/").filter((segment) => segment);

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
                        {decodeURIComponent(segment)}
                    </span>
                ),
                key: segmentPath,
            });
        });

        return <Breadcrumb items={breadcrumbItems} />;
    };

    // sorting helpers
    const getFieldValue = (obj: any, keys: string[]) => {
        return keys.reduce((acc, currentKey) => {
            if (acc && acc[currentKey] !== undefined) {
                return acc[currentKey];
            }
            return undefined;
        }, obj);
    };

    const defaultSorter = (a: any, b: any, dataIndex: string | string[]) => {
        const fieldA = Array.isArray(dataIndex) ? getFieldValue(a, dataIndex) : a[dataIndex];
        const fieldB = Array.isArray(dataIndex) ? getFieldValue(b, dataIndex) : b[dataIndex];

        if (fieldA === undefined && fieldB === undefined) {
            return 0;
        } else if (fieldA === undefined) {
            return 1;
        } else if (fieldB === undefined) {
            return -1;
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

    const noData = loading ? "" : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;

    return {
        path,
        setPath,
        files,
        setFiles,
        rebuildList,
        setRebuildList,
        loading,

        filterText,
        filterFieldAutoFocus,
        setFilterFieldAutoFocus,
        handleFilterChange,
        clearFilterField,
        handleFilterFieldInputFocus,
        handleFilterFieldInputBlur,
        inputFilterRef,

        generateBreadcrumbs,
        handleBreadcrumbClick,

        getFieldValue,
        defaultSorter,
        dirNameSorter,

        noData,
        parentRef,
    };
};
