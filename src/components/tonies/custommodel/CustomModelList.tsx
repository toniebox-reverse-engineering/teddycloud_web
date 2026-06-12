import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex, Pagination, theme, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { CustomModelCard } from "./CustomModelCard";
import type { TableRow } from "./types/customModelEditorTypes";
import LoadingSpinner from "../../common/elements/LoadingSpinner";

export type CustomModelListProps = {
    tableRows: TableRow[];
    paginatedRows: TableRow[];
    loading: boolean;
    paginationEnabled: boolean;
    modelListPage: number;
    modelListPageSize: number;
    modelListTotalPages: number;
    gridColumns: number;
    token: ReturnType<typeof theme.useToken>["token"];
    onMergeAndCreateNew: () => void;
    onEdit: (idx: number) => void;
    onDuplicate: (idx: number) => void;
    onDelete: (idx: number) => void;
    onPreviewClick: (url: string) => void;
    onShowAll: () => void;
    onShowPagination: () => void;
    onPageChange: (page: number, size?: number) => void;
};

export const CustomModelList: React.FC<CustomModelListProps> = ({
    tableRows,
    paginatedRows,
    loading,
    paginationEnabled,
    modelListPage,
    modelListPageSize,
    modelListTotalPages,
    gridColumns,
    token,
    onMergeAndCreateNew,
    onEdit,
    onDuplicate,
    onDelete,
    onPreviewClick,
    onShowAll,
    onShowPagination,
    onPageChange,
}) => {
    const { t } = useTranslation();

    const listPagination =
        tableRows.length > 0 ? (
            <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap" }}>
                {!paginationEnabled ? (
                    <Button onClick={onShowPagination}>{t("tonies.tonies.showPagination")}</Button>
                ) : (
                    <>
                        <Pagination
                            current={modelListPage}
                            total={tableRows.length}
                            pageSize={modelListPageSize}
                            onChange={(page, size) => onPageChange(page, size)}
                            showSizeChanger
                            pageSizeOptions={["24", "48", "96", "192"]}
                            locale={{
                                items_per_page: t("tonies.customEditor.pagination.modelsPerPage"),
                            }}
                            style={{ marginBottom: 8 }}
                            showLessItems
                        />
                        <Button onClick={onShowAll} style={{ marginLeft: 16 }}>
                            {t("tonies.tonies.showAll")}
                        </Button>
                    </>
                )}
            </div>
        ) : null;

    return (
        <>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                    flexWrap: "wrap",
                    gap: 8,
                }}
            >
                <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={onMergeAndCreateNew}
                >
                    {t("tonies.customEditor.actions.newModel")}
                </Button>
                {listPagination}
            </div>

            <Flex vertical gap={16}>
                {loading ? (
                    <LoadingSpinner />
                ) : tableRows.length === 0 ? (
                    <div
                        style={{
                            width: "100%",
                            padding: 48,
                            textAlign: "center",
                            background: token.colorFillQuaternary,
                            borderRadius: 8,
                        }}
                    >
                        <Typography.Text
                            type="secondary"
                            style={{ display: "block", marginBottom: 16 }}
                        >
                            {t("tonies.customEditor.emptyState")}
                        </Typography.Text>
                        <Typography.Text
                            type="secondary"
                            style={{ display: "block", marginBottom: 16, fontSize: 12 }}
                        >
                            {t("tonies.customEditor.emptyStateHint")}
                        </Typography.Text>
                    </div>
                ) : (
                    <Flex wrap="wrap" gap={16}>
                        {paginatedRows.map((row) => (
                            <CustomModelCard
                                key={row.idx}
                                idx={row.idx}
                                entry={row.entry}
                                gridColumns={gridColumns}
                                onEdit={onEdit}
                                onDuplicate={onDuplicate}
                                onDelete={onDelete}
                                onPreviewClick={onPreviewClick}
                            />
                        ))}
                    </Flex>
                )}
                {listPagination}
            </Flex>
        </>
    );
};
