// SelectFileFileBrowser.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Table, Input, theme } from "antd";
import { Key } from "antd/es/table/interface";
import { CloseOutlined } from "@ant-design/icons";

import { Record } from "../../../types/fileBrowserTypes";

import { LoadingSpinnerAsOverlay } from "../../common/LoadingSpinner";
import TonieInformationModal from "../common/TonieInformationModal";
import { useAudioContext } from "../../audio/AudioContext";
import { useTeddyCloud } from "../../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../../types/teddyCloudNotificationTypes";
import { useFileBrowserCore } from "./hooks/useFileBrowserCore";
import { createColumns } from "./helper/FileBrowserColumns";

const { useToken } = theme;

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
    const { addNotification } = useTeddyCloud();

    const navigate = useNavigate();

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const [isInformationModalOpen, setIsInformationModalOpen] = useState<boolean>(false);
    const [currentRecord, setCurrentRecord] = useState<Record>();
    const [currentAudioUrl, setCurrentAudioUrl] = useState<string>("");

    const {
        path,
        setPath,
        files,
        rebuildList,
        loading,
        filterText,
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
    });

    useEffect(() => {
        setSelectedRowKeys([]);
    }, [rebuildList]);

    // information modal
    const showInformationModal = (record: any) => {
        if (!record.isDir && record.tonieInfo?.tracks) {
            setCurrentRecord(record);
            setCurrentAudioUrl(buildContentUrl(record.name, { ogg: true }));
            setIsInformationModalOpen(true);
        }
    };

    // table helpers
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
        const newPath = buildDirPath(dirPath);
        if (trackUrl) {
            navigate(`?path=${newPath}`);
        }
        handleFilterFieldInputBlur();
        setSelectedRowKeys([]);
        setPath(newPath);
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
    });

    return (
        <>
            {currentRecord && isInformationModalOpen && (
                <TonieInformationModal
                    open={isInformationModalOpen}
                    tonieCardOrTAFRecord={{ ...currentRecord, audioUrl: currentAudioUrl }}
                    onClose={() => setIsInformationModalOpen(false)}
                    overlay={overlay}
                />
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "row", marginBottom: 8 }}>
                    <div style={{ lineHeight: 1.5, marginRight: 16 }}>{t("tonies.currentPath")}</div>
                    {generateBreadcrumbs(path)}
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
                                      disabled: record.name === "..",
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
                                                    ref={inputFilterRef}
                                                    style={{ width: "100%" }}
                                                    autoFocus={filterFieldAutoFocus}
                                                    suffix={
                                                        <CloseOutlined
                                                            onMouseDown={(e) => e.preventDefault()}
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
