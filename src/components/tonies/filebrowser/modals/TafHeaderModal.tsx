import React from "react";
import { Modal, Button, Alert } from "antd";
import { useTranslation } from "react-i18next";
import yaml from "js-yaml";

import CodeSnippet from "../../../common/CodeSnippet";
import { RecordTafHeader } from "../../../../types/fileBrowserTypes";

interface TafHeaderModalProps {
    open: boolean;
    onClose: () => void;
    fileName: string | null;
    recordTafHeader: RecordTafHeader | null;
}

const transformTafHeaderToYaml = (jsonData: RecordTafHeader) => {
    const transformedData = [
        {
            "audio-id": jsonData.audioId,
            hash: jsonData.sha1Hash,
            size: jsonData.size,
            tracks: jsonData.trackSeconds?.length,
            confidence: 0,
        },
    ];
    return yaml.dump(transformedData).trim();
};

const TafHeaderModal: React.FC<TafHeaderModalProps> = ({ open, onClose, fileName, recordTafHeader }) => {
    const { t } = useTranslation();

    let content: string | null = null;

    if (recordTafHeader) {
        if (recordTafHeader.valid) {
            content = transformTafHeaderToYaml(recordTafHeader);
        } else {
            content = t("tonies.tafHeaderInvalid");
        }
    }

    return (
        <Modal
            className="taf-header-viewer"
            footer={
                <Button type="primary" onClick={onClose}>
                    {t("tonies.informationModal.ok")}
                </Button>
            }
            title={t("tonies.tafHeaderOf") + (fileName || "")}
            open={open}
            onCancel={onClose}
            width={700}
        >
            {content ? (
                <>
                    <CodeSnippet language="yaml" code={content} />
                    <Alert
                        showIcon
                        type="warning"
                        message={<div style={{ fontSize: "small" }}>{t("tonies.tafHeaderToniesJsonHint")}</div>}
                    />
                </>
            ) : (
                "Loading..."
            )}
        </Modal>
    );
};

export default TafHeaderModal;
