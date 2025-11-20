// useFileBrowserCore.tsx
import React, { useEffect, useRef, useState } from "react";
import { Breadcrumb, Empty, InputRef } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Record } from "../../../../types/fileBrowserTypes";

import { useTeddyCloud } from "../../../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

type Mode = "fileBrowser" | "select";

interface UseFileBrowserCoreOptions {
    mode: Mode;
    special: string;
    overlay?: string;
    showDirOnly?: boolean;
    filetypeFilter?: string[];
    trackUrl?: boolean;
}

interface UseFileBrowserCoreResult {
    path: string;
    setPath: React.Dispatch<React.SetStateAction<string>>;
    files: Record[];
    rebuildList: boolean;
    setRebuildList: React.Dispatch<React.SetStateAction<boolean>>;
    loading: boolean;

    filterText: string;
    filterFieldAutoFocus: boolean;
    setFilterFieldAutoFocus: React.Dispatch<React.SetStateAction<boolean>>;
    handleFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    clearFilterField: () => void;
    handleFilterFieldInputFocus: () => void;
    handleFilterFieldInputBlur: () => void;
    inputFilterRef: React.RefObject<InputRef | null>;

    generateBreadcrumbs: (currentPath: string) => React.ReactNode;

    buildDirPath: (dirPath: string) => string;
    buildContentUrl: (fileName: string, options?: { ogg?: boolean }) => string;

    defaultSorter: (a: any, b: any, dataIndex: string | string[]) => number;
    dirNameSorter: (a: any, b: any) => number;

    noData: React.ReactNode | null;
    parentRef: React.RefObject<HTMLDivElement | null>;
}

export const useFileBrowserCore = ({
    mode,
    special,
    overlay = "",
    showDirOnly = false,
    filetypeFilter = [],
    trackUrl = true,
}: UseFileBrowserCoreOptions): UseFileBrowserCoreResult => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();

    const location = useLocation();
    const navigate = useNavigate();

    const [files, setFiles] = useState<Record[]>([]);

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
    const parentRef = useRef<HTMLDivElement | null>(null);

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
                const list: Record[] = (data.files || []) as Record[];

                const filteredList = list.filter((entry) => {
                    if (showDirOnly && !entry.isDir) return false;

                    if (filetypeFilter.length > 0 && !entry.isDir) {
                        const lowerName = entry.name.toLowerCase();
                        return filetypeFilter.some((suffix) => lowerName.endsWith(suffix.toLowerCase()));
                    }
                    return true;
                });

                setFiles(filteredList);
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

    const buildDirPath = (dirPath: string): string => {
        if (dirPath === "..") {
            if (!path) return "";
            if (mode === "fileBrowser") {
                return path.split("/").map(decodeURIComponent).slice(0, -1).map(encodeURIComponent).join("/");
            } else {
                return path.split("/").slice(0, -1).join("/");
            }
        }

        if (mode === "fileBrowser") {
            const decodedParts = path ? path.split("/").map(decodeURIComponent) : [];
            return [...decodedParts, dirPath].map(encodeURIComponent).join("/");
        } else {
            return path ? `${path}/${dirPath}` : dirPath;
        }
    };

    const buildContentUrl = (fileName: string, options?: { ogg?: boolean }): string => {
        const { ogg = false } = options || {};

        let encodedPath: string;
        if (mode === "fileBrowser") {
            encodedPath = path || "";
        } else {
            encodedPath = path
                ? path
                      .split("/")
                      .map((segment) => encodeURIComponent(segment))
                      .join("/")
                : "";
        }

        const encodedName = encodeURIComponent(fileName);

        let url = `/content/${encodedPath ? encodedPath + "/" : "/"}${encodedName}`;

        const params = new URLSearchParams();
        if (ogg) params.set("ogg", "true");
        params.set("special", special);
        if (overlay) params.set("overlay", overlay);

        url += `?${params.toString()}`;

        return url;
    };

    const noData = files.length === 0 && !loading ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : null;

    return {
        path,
        setPath,
        files,
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

        buildDirPath,
        buildContentUrl,

        defaultSorter,
        dirNameSorter,

        noData,
        parentRef,
    };
};
