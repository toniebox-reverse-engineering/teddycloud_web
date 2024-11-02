import React from "react";
import { useTranslation } from "react-i18next";
import { Button, theme } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { FileObject } from "../../types/fileBrowserTypes";

interface DraggableFileObjectListItemProps {
    originNode: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
    fileObjectList: FileObject[];
    file: FileObject;
    onRemove: (file: FileObject) => void;
    disabled: boolean;
}

const { useToken } = theme;

export const DraggableFileObjectListItem = ({
    originNode,
    fileObjectList: fileObjectList,
    file,
    onRemove,
    disabled,
}: DraggableFileObjectListItemProps) => {
    const { token } = useToken();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: file.uid,
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
                        {fileObjectList.indexOf(file) + 1}.
                    </span>
                    <div>
                        <div>{file.name}</div>
                        <div style={{ fontSize: "smaller", color: `${token.colorTextSecondary}` }}>in {file.path}/</div>
                    </div>
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
