import React, { useEffect, useState } from "react";
import { Alert, Button, Modal, Spin } from "antd";
import { useTranslation } from "react-i18next";

import CodeSnippet from "../../../common/elements/CodeSnippet";
import { Record } from "../../../../types/fileBrowserTypes";

interface CustomJsonSnippetModalProps {
    open: boolean;
    onClose: () => void;
    files: Record[];
    selectedRowKeys: React.Key[];
}

const createCustomJsonSnippet = (files: Record[], selectedRowKeys: React.Key[]) => {
    return files
        .filter((file) => selectedRowKeys.length === 0 || selectedRowKeys.includes(file.name))
        .filter((file) => !file.isDir && file.tafHeader?.audioId && file.tafHeader?.sha1Hash)
        .map((file, index, arr) => {
            const line = JSON.stringify({
                no: String(index + 1),
                model: file.tonieInfo?.model || "CUST-",
                audio_id: [String(file.tafHeader?.audioId)],
                hash: [String(file.tafHeader?.sha1Hash)],
                title: file.name.replace(/\.taf$/i, ""),
                series: file.tonieInfo?.series || "",
                episodes: file.tonieInfo?.episode || "",
                tracks: file.tonieInfo?.tracks || [],
                release: "",
                language: file.tonieInfo?.language || "",
                category: "",
                pic: file.tonieInfo?.picture || "",
            });

            return index < arr.length - 1 ? `${line},` : line;
        })
        .join("\n");
};

const CustomJsonSnippetModal: React.FC<CustomJsonSnippetModalProps> = ({
    open,
    onClose,
    files,
    selectedRowKeys,
}) => {
    const { t } = useTranslation();

    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        setLoading(true);
        setContent("");

        const timeout = window.setTimeout(() => {
            setContent(createCustomJsonSnippet(files, selectedRowKeys));
            setLoading(false);
        }, 0);

        return () => window.clearTimeout(timeout);
    }, [open, files, selectedRowKeys]);

    return (
        <Modal
            className="custom-json-snippet-viewer"
            footer={
                <Button type="primary" onClick={onClose}>
                    {t("fileBrowser.customJsonSnippetModal.ok")}
                </Button>
            }
            title={t("fileBrowser.customJsonSnippetModal.title")}
            open={open}
            onCancel={onClose}
            width={900}
        >
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
                    <Spin />
                </div>
            ) : content ? (
                <>
                    <Alert
                        showIcon
                        type="info"
                        title={
                            <div style={{ fontSize: "small" }}>
                                {selectedRowKeys.length > 0
                                    ? t("fileBrowser.customJsonSnippetModal.selectedFiles")
                                    : t("fileBrowser.customJsonSnippetModal.allFiles")}
                            </div>
                        }
                    />
                    <CodeSnippet
                        language="json"
                        code={content}
                        showLineNumbers={false}
                        wrapLines={false}
                    />
                </>
            ) : (
                t("fileBrowser.customJsonSnippetModal.noValidHeaders")
            )}
        </Modal>
    );
};

export default CustomJsonSnippetModal;
