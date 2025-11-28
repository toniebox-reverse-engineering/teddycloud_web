import React, { useEffect, useState } from "react";
import { Modal, Button } from "antd";
import { useTranslation } from "react-i18next";

import CodeSnippet from "../../../common/elements/CodeSnippet";
import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

interface JsonViewerModalProps {
    open: boolean;
    onClose: () => void;
    special: string; // "library" or something else -> "/content"
    file: string | null; // e.g path + "/" + record.name
}

const JsonViewerModal: React.FC<JsonViewerModalProps> = ({ open, onClose, special, file }) => {
    const { t } = useTranslation();
    const [jsonData, setJsonData] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!open || !file) return;

        const fetchJsonData = async () => {
            setLoading(true);
            setJsonData(null);
            try {
                const folder = special === "library" ? "/library/" : "/content/";
                const response = await api.apiGetTeddyCloudApiRaw(folder + file);
                const data = await response.json();
                setJsonData(data);
            } catch (error) {
                console.error("Error fetching JSON data:", error);
                setJsonData({ error: "Error fetching JSON data" });
            } finally {
                setLoading(false);
            }
        };

        fetchJsonData();
    }, [open, file, special]);

    const fileName = file ? file.split("/").slice(-1)[0] : "";

    return (
        <Modal
            className="json-viewer"
            width={800}
            title={"File: " + fileName}
            open={open}
            onCancel={onClose}
            footer={
                <Button type="primary" onClick={onClose}>
                    {t("tonies.informationModal.ok")}
                </Button>
            }
        >
            {loading && "Loading..."}
            {!loading && jsonData && <CodeSnippet language="json" code={JSON.stringify(jsonData, null, 2)} />}
        </Modal>
    );
};

export default JsonViewerModal;
