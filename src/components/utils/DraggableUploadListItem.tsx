import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Typography } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { humanFileSize } from "../../utils/humanFileSize";
import { MyUploadFile } from "../../utils/encoder";

const { Text } = Typography;

interface DraggableUploadListItemProps {
    originNode: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
    fileList: MyUploadFile<any>[];
    file: MyUploadFile<any>;
    onRemove: (file: MyUploadFile) => void;
    disabled: boolean;
}

export const DraggableUploadListItem = ({
    originNode,
    fileList,
    file,
    onRemove,
    disabled,
}: DraggableUploadListItemProps) => {
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
            <div className="ant-upload-list-item ant-upload-list-item-undefined">
                <div className="ant-upload-list-item-thumbnail ant-upload-list-item-file">
                    <span role="img" aria-label="file" className="anticon anticon-file">
                        {fileList.indexOf(file) + 1}.
                    </span>
                </div>
                <span className="ant-upload-list-item-name" title={file.name}>
                    <span className="">{file.name}</span>
                    <br />
                    <Text type="secondary">{humanFileSize(file.size ? file.size : -1)}</Text>
                </span>
                <span className="ant-upload-list-item-actions picture">
                    <Button
                        title={t("tonies.encoder.removeFile")}
                        onClick={() => onRemove(file)}
                        disabled={disabled}
                        icon={<DeleteOutlined />}
                    />
                </span>
            </div>
        </div>
    );
};
