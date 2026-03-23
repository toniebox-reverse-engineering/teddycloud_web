import React, { useMemo } from "react";
import { CloseOutlined } from "@ant-design/icons";
import { Empty, Input, Spin, Table, theme } from "antd";
import { useTranslation } from "react-i18next";

import ThumbnailCell from "../../elements/ThumbnailCell";
import { toImageSrc } from "../../utils/imagePathUtils";
import { nextSelectionForMode } from "./selectionUtils";
import {
    SELECT_IMAGE_CELL_GAP_HALF,
    SELECT_IMAGE_CHECKBOX_COL_WIDTH,
    SELECT_IMAGE_THUMB_COL_WIDTH,
    renderSelectImageSelectionCell,
} from "../../../../../constants/selectImageTableLayout";

type OriginalTableRow = { url: string };

interface OriginalImagesPanelProps {
    allowMultiple: boolean;
    originalImagesLoading: boolean;
    originalImages: string[];
    originalSearchInput: string;
    setOriginalSearchInput: (value: string) => void;
    originalSelections: string[];
    setOriginalSelections: React.Dispatch<React.SetStateAction<string[]>>;
    originalTableData: OriginalTableRow[];
    originalTableScrollY: number;
    onConfirmSingle: (url: string) => void;
    onImagePreview: (imageUrl: string) => void;
}

const { useToken } = theme;

export const OriginalImagesPanel: React.FC<OriginalImagesPanelProps> = ({
    allowMultiple,
    originalImagesLoading,
    originalImages,
    originalSearchInput,
    setOriginalSearchInput,
    originalSelections,
    setOriginalSelections,
    originalTableData,
    originalTableScrollY,
    onConfirmSingle,
    onImagePreview,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();

    const columns = useMemo(
        () => [
            {
                title: "",
                key: "thumb",
                width: SELECT_IMAGE_THUMB_COL_WIDTH,
                align: "left" as const,
                onCell: () => ({
                    style: {
                        verticalAlign: "middle" as const,
                        overflow: "hidden",
                        maxWidth: SELECT_IMAGE_THUMB_COL_WIDTH,
                        paddingLeft: allowMultiple ? SELECT_IMAGE_CELL_GAP_HALF : 0,
                        paddingRight: SELECT_IMAGE_CELL_GAP_HALF,
                    },
                }),
                render: (_: unknown, row: OriginalTableRow) => (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            minHeight: 40,
                            minWidth: 0,
                            maxWidth: "100%",
                            overflow: "hidden",
                        }}
                    >
                        <ThumbnailCell
                            src={toImageSrc(row.url)}
                            onClick={() => onImagePreview(toImageSrc(row.url))}
                        />
                    </div>
                ),
            },
            {
                title: t("tonies.imageManager.originalUrlColumn"),
                dataIndex: "url",
                key: "url",
                ellipsis: true,
                onCell: () => ({
                    style: {
                        verticalAlign: "middle" as const,
                        overflow: "hidden",
                        minWidth: 0,
                        paddingLeft: SELECT_IMAGE_CELL_GAP_HALF,
                    },
                }),
                render: (url: string) => (
                    <span title={url} style={{ wordBreak: "break-all" }}>
                        {url}
                    </span>
                ),
            },
        ],
        [t, allowMultiple, onImagePreview]
    );

    return (
        <div
            style={{
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 8,
                padding: 8,
            }}
        >
            {originalImagesLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
                    <Spin tip={t("tonies.imageManager.originalImagesLoading")} />
                </div>
            ) : originalImages.length === 0 ? (
                <Empty style={{ margin: "40px 0" }} description={t("tonies.imageManager.noOriginalImages")} />
            ) : (
                <>
                    <Input
                        allowClear
                        placeholder={t("tonies.imageManager.originalUrlSearchPlaceholder")}
                        value={originalSearchInput}
                        onChange={(e) => setOriginalSearchInput(e.target.value)}
                        style={{ marginBottom: 8 }}
                        suffix={
                            originalSearchInput ? (
                                <CloseOutlined
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setOriginalSearchInput("")}
                                    style={{ cursor: "pointer", color: token.colorTextSecondary }}
                                />
                            ) : null
                        }
                    />
                    {originalTableData.length === 0 ? (
                        <Empty style={{ margin: "24px 0" }} description={t("tonies.imageManager.noOriginalSearchResults")} />
                    ) : (
                        <Table<OriginalTableRow>
                            className="select-image-table"
                            rowKey={(r) => r.url}
                            dataSource={originalTableData}
                            columns={columns}
                            pagination={false}
                            tableLayout="fixed"
                            virtual
                            scroll={{ y: originalTableScrollY }}
                            rowSelection={
                                allowMultiple
                                    ? {
                                          selectedRowKeys: originalSelections,
                                          onChange: (keys) => setOriginalSelections(keys.map(String)),
                                          columnWidth: SELECT_IMAGE_CHECKBOX_COL_WIDTH,
                                          align: "center",
                                          renderCell: (_: boolean, __: OriginalTableRow, ___: number, originNode: React.ReactNode) =>
                                              renderSelectImageSelectionCell(originNode),
                                      }
                                    : undefined
                            }
                            onRow={(record) => ({
                                onClick: () =>
                                    setOriginalSelections((prev) =>
                                        nextSelectionForMode(prev, record.url, allowMultiple)
                                    ),
                                onDoubleClick: () => {
                                    if (allowMultiple) {
                                        setOriginalSelections((prev) => nextSelectionForMode(prev, record.url, true));
                                        return;
                                    }
                                    onConfirmSingle(record.url);
                                },
                                style: { cursor: "pointer" },
                            })}
                            rowClassName={(record) => (originalSelections.includes(record.url) ? "ant-table-row-selected" : "")}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default OriginalImagesPanel;
