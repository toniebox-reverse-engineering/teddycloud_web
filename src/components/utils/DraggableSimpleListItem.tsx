import { DeleteOutlined } from "@ant-design/icons";
import { Button, theme, Typography } from "antd";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";

interface DraggableSimpleListItemProps {
    originNode: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
    simpleList: string[];
    file: string;
    onRemove: (file: string) => void;
    disabled: boolean;
}

const { useToken } = theme;

export const DraggableSimpleListItem = ({
    originNode,
    simpleList: simpleList,
    file,
    onRemove,
    disabled,
}: DraggableSimpleListItemProps) => {
    const { token } = useToken();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: file,
    });

    const { t } = useTranslation();

    const draggingStyle: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: "move",
    };

    return (
        <div
            ref={setNodeRef}
            style={draggingStyle}
            className={isDragging ? "is-dragging" : ""}
            {...attributes}
            {...listeners}
        >
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "space-between",
                    alignItems: "center",
                    margin: "8px 0",
                    padding: 8,
                    borderRadius: 8,
                    border: `1px solid ${token.colorBorder}`,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                    }}
                >
                    <span
                        style={{
                            fontSize: 30,
                            width: 48,
                            height: 48,
                            textAlign: "center",
                            color: `${token.colorPrimaryText}`,
                        }}
                    >
                        {simpleList.indexOf(file) + 1}.
                    </span>
                    <span>{file}</span>
                </div>
                <Button
                    title={t("tonies.encoder.removeFile")}
                    onClick={() => onRemove(file)}
                    disabled={disabled}
                    icon={<DeleteOutlined />}
                />
            </div>
        </div>
    );
};
