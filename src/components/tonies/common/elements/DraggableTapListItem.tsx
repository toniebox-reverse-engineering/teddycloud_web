import React from "react";
import { Divider, Form, Input, Space, Tooltip, theme } from "antd";
import { CloseOutlined, FolderOpenOutlined, InfoCircleOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FormInstance } from "antd/es/form";

type FileItem = { uid: string; filepath: string; name: string };

interface DraggableTapListItemProps {
    file: FileItem;
    index: number;
    namePath: number; // "name" from Form.List field
    form: FormInstance;
    t: (k: string, opts?: any) => string;
    disabled: boolean;
    onEditFile: (index: number) => void;
    onRemove: () => void;
}

const { useToken } = theme;

export const DraggableTapListItem: React.FC<DraggableTapListItemProps> = ({
    file,
    index,
    disabled,
    namePath,
    form,
    t,
    onEditFile,
    onRemove,
}) => {
    const { token } = useToken();

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: file.uid,
        disabled,
    });

    const draggingStyle: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? undefined : transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                ...draggingStyle,
                display: "flex",
                alignItems: "center",
                gap: 14,
            }}
            {...attributes}
            {...listeners}
        >
            <div
                style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                    gap: 12,
                    padding: "14px 16px",
                    margin: "4px 0",
                    border: `1px solid ${token.colorBorder}`,
                    borderRadius: 10,
                    background: token.colorBgContainer,
                    opacity: isDragging ? 0.85 : 1,
                    cursor: disabled ? "not-allowed" : "move",
                }}
            >
                <div
                    style={{
                        minWidth: 44,
                        textAlign: "right",
                        fontSize: 40,
                        lineHeight: 1,
                        fontWeight: 700,
                        userSelect: "none",
                        color: token.colorPrimary,
                    }}
                >
                    {index + 1}.
                </div>
                <Form.Item
                    name={[namePath, "filepath"]}
                    label={
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span>{t("tonies.tapEditor.filePathContentFile")}</span>
                            <Tooltip title={t("tonies.tapEditor.filePathContentFileTooltip")}>
                                <InfoCircleOutlined />
                            </Tooltip>
                        </span>
                    }
                    rules={[
                        {
                            required: true,
                            message: t("tonies.tapEditor.filePathContentFileRequired"),
                        },
                    ]}
                    style={{ flex: "1 1 30%", minWidth: 200, marginBottom: 0 }}
                >
                    <Input
                        prefix={[
                            <CloseOutlined
                                key="clear"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    const newValues = [...((form.getFieldValue("files") ?? []) as FileItem[])];
                                    newValues[index] = { ...newValues[index], filepath: "" };
                                    form.setFieldsValue({ files: newValues });
                                }}
                            />,
                            <Divider key="divider-source" orientation="vertical" style={{ margin: "0 4px" }} />,
                        ]}
                        suffix={[
                            <Divider key="divider-source-3" orientation="vertical" style={{ margin: "0 4px" }} />,
                            <FolderOpenOutlined
                                key="open"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => onEditFile(index)}
                            />,
                        ]}
                        disabled={disabled}
                    />
                </Form.Item>

                <Form.Item
                    name={[namePath, "name"]}
                    label={t("tonies.tapEditor.fileNameContentFile")}
                    style={{ marginBottom: 0, flex: "1 1 30%", minWidth: 200 }}
                >
                    <Input placeholder="Name" disabled={disabled} />
                </Form.Item>

                <div style={{ paddingBottom: 6, flex: "0 0 auto" }}>
                    <MinusCircleOutlined onClick={onRemove} />
                </div>
            </div>
        </div>
    );
};
