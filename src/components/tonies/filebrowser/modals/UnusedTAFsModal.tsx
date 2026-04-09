import React, { Key, useEffect, useMemo, useRef, useState } from "react";
import { Button, Empty, Flex, Modal, Table, Tooltip, theme } from "antd";
import type { ColumnsType, SortOrder } from "antd/es/table/interface";
import { DeleteOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { RecordWithPath, fetchUnusedTAFsInLibrary } from "../../../../utils/teddycloud/fetchTAFsInLibrary";
import { LoadingSpinnerAsOverlay } from "../../../common/elements/LoadingSpinner";
import { useTonies } from "../../../../hooks/useTonies";
import { canHover } from "../../../../utils/browser/browserUtils";
import { toImageSrc } from "../../common/utils/imagePathUtils";
import DeleteFilesModal from "./DeleteFilesModal";

const { useToken } = theme;

interface UnusedTAFsModalProps {
    open: boolean;
    onCancel: () => void;
    onOk: () => void;
    setRebuildList: React.Dispatch<React.SetStateAction<boolean>>;
    rebuildList: boolean;
}

export const UnusedTAFsModal: React.FC<UnusedTAFsModalProps> = ({
    open,
    onCancel,
    onOk,
    setRebuildList,
    rebuildList,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const parentRef = useRef<HTMLDivElement | null>(null);

    const { tonies, loading: loadingTonies } = useTonies({ merged: true, shuffle: true });

    const [records, setRecords] = useState<RecordWithPath[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
    const [isConfirmMultipleDeleteModalOpen, setIsConfirmMultipleDeleteModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);
    const [deletePath, setDeletePath] = useState("");
    const [deleteApiCall, setDeleteApiCall] = useState("");

    const reload = async () => {
        if (loadingTonies || !tonies) return;

        setLoading(true);
        try {
            const unusedFiles = await fetchUnusedTAFsInLibrary(tonies, {});
            setRecords(unusedFiles);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Failed to load TAFs:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        void reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, tonies, rebuildList]);

    const noData = useMemo(() => {
        return records.length === 0 && !loading ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : null;
    }, [records.length, loading]);

    const showDeleteConfirmDialog = (fileName: string, pathWithFile: string, apiCall: string) => {
        setFileToDelete(fileName);
        setDeletePath(decodeURIComponent(pathWithFile));
        setDeleteApiCall(apiCall);
        setIsConfirmDeleteModalOpen(true);
    };

    const columns: ColumnsType<RecordWithPath> = useMemo(
        () => [
            {
                dataIndex: ["tonieInfo", "picture"],
                key: "picture",
                width: 10,
                render: (_picture: string, record: RecordWithPath) =>
                    record?.tonieInfo?.picture ? (
                        <img
                            src={toImageSrc(record.tonieInfo.picture)}
                            alt={t("tonies.content.toniePicture")}
                            style={{
                                height: 40,
                                width: 40,
                                objectFit: "contain",
                                cursor: "pointer",
                                marginRight: 8,
                            }}
                        />
                    ) : null,
            },
            {
                title: t("fileBrowser.unusedTafsModal.name"),
                dataIndex: "name",
                key: "name",
                sorter: (a, b) => {
                    if (a.isDir === b.isDir) return a.name.localeCompare(b.name);
                    return a.isDir ? -1 : 1;
                },
                defaultSortOrder: "ascend" as SortOrder,
                render: (name: string, record: RecordWithPath) => (
                    <div style={{ wordBreak: record.isDir ? "normal" : "break-word" }}>
                        <div className="showSmallDevicesOnly">lib://{record.fullPath}</div>
                        <div className="showBigDevicesOnly showMediumDevicesOnly">{name}</div>
                    </div>
                ),
            },
            {
                title: t("fileBrowser.unusedTafsModal.fullPath"),
                dataIndex: "fullPath",
                key: "fullPath",
                sorter: (a, b) => {
                    if (a.isDir === b.isDir) return a.fullPath.localeCompare(b.fullPath);
                    return a.isDir ? -1 : 1;
                },
                defaultSortOrder: "ascend" as SortOrder,
                render: (_: string, record: RecordWithPath) => {
                    const lastSlash = record.fullPath?.lastIndexOf("/") ?? -1;
                    const dir = lastSlash >= 0 ? record.fullPath.slice(0, lastSlash + 1) : "";
                    return <div style={{ wordBreak: record.isDir ? "normal" : "break-word" }}>lib://{dir}</div>;
                },
                responsive: ["md", "lg", "xl", "xxl"],
            },
            {
                title: t("fileBrowser.unusedTafsModal.actions"),
                key: "actions",
                render: (_: any, record: RecordWithPath) => (
                    <Tooltip open={!canHover ? false : undefined} title={t("fileBrowser.delete")}>
                        <DeleteOutlined
                            onClick={() =>
                                showDeleteConfirmDialog(record.fullPath, record.fullPath, "?special=library")
                            }
                            style={{ margin: "4px 8px 4px 0", padding: 4 }}
                        />
                    </Tooltip>
                ),
            },
        ],
        [t],
    );

    const footer = (
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
            {selectedRowKeys.length > 0 && (
                <Button icon={<DeleteOutlined />} onClick={() => setIsConfirmMultipleDeleteModalOpen(true)}>
                    {t("fileBrowser.delete")}
                </Button>
            )}
            <Button type="primary" onClick={onOk}>
                {t("fileBrowser.unusedTafsModal.ok")}
            </Button>
        </div>
    );

    return (
        <Modal
            className="sticky-footer"
            title={t("fileBrowser.unusedTafsModal.title")}
            open={open}
            onOk={onOk}
            onCancel={onCancel}
            width="auto"
            footer={footer}
            destroyOnHidden
        >
            <DeleteFilesModal
                special="library"
                path=""
                files={records}
                setRebuildList={setRebuildList}
                selectedRowKeys={selectedRowKeys}
                setSelectedRowKeys={setSelectedRowKeys}
                singleOpen={isConfirmDeleteModalOpen}
                fileToDelete={fileToDelete}
                deletePath={deletePath}
                deleteApiCall={deleteApiCall}
                onCloseSingle={() => setIsConfirmDeleteModalOpen(false)}
                multipleOpen={isConfirmMultipleDeleteModalOpen}
                onCloseMultiple={() => setIsConfirmMultipleDeleteModalOpen(false)}
            />

            <div className="filesTable" style={{ position: "relative" }} ref={parentRef}>
                {loading ? <LoadingSpinnerAsOverlay parentRef={parentRef} /> : null}

                <Table<RecordWithPath>
                    dataSource={records}
                    columns={columns}
                    rowKey={(record) => record.fullPath}
                    pagination={false}
                    rowSelection={{
                        columnTitle: (checkbox) => (
                            <Flex gap="small">
                                {checkbox}
                                {selectedRowKeys.length > 0 && <>({selectedRowKeys.length})</>}
                            </Flex>
                        ),
                        selectedRowKeys,
                        onChange: (keys: Key[]) => setSelectedRowKeys(keys),
                        getCheckboxProps: (record: RecordWithPath) => ({ disabled: record.name === ".." }),
                        onSelectAll: (selected: boolean, selectedRows: RecordWithPath[]) => {
                            setSelectedRowKeys(
                                selected ? selectedRows.filter((r) => r.name !== "..").map((r) => r.fullPath) : [],
                            );
                        },
                    }}
                    locale={{ emptyText: noData }}
                />
            </div>
        </Modal>
    );
};
