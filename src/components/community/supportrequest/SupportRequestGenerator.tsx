import React, { useState } from "react";
import { Alert, Button, Modal } from "antd";
import { formatSupportRequest, SupportRequestFormValues } from "./helper/supportRequestFormatter";
import { SupportRequestModal } from "./modals/SupportRequestModal";
import { useTranslation } from "react-i18next";
import CodeSnippet from "../../common/elements/CodeSnippet";

export const SupportRequestGenerator: React.FC = () => {
    const { t } = useTranslation();

    const [modalOpen, setModalOpen] = useState(false);
    const [resultOpen, setResultOpen] = useState(false);
    const [formattedText, setFormattedText] = useState("");

    const handleSubmit = (values: SupportRequestFormValues) => {
        const text = formatSupportRequest(values);
        setFormattedText(text);
        setModalOpen(false);
        setResultOpen(true);
    };

    return (
        <>
            <Button type="primary" onClick={() => setModalOpen(true)}>
                {t("community.supportRequestGuide.createSupportRequest")}
            </Button>

            <SupportRequestModal open={modalOpen} onCancel={() => setModalOpen(false)} onSubmit={handleSubmit} />

            <Modal
                title={t("community.supportRequestGuide.formattedRequest")}
                open={resultOpen}
                onCancel={() => setResultOpen(false)}
                footer={null}
                width="90%"
                style={{ maxWidth: 900 }}
            >
                <Alert type="info" description={t("community.supportRequestGuide.hintSendingSupportRequest")} />

                <CodeSnippet language="text" code={formattedText} showLineNumbers={false} />
            </Modal>
        </>
    );
};
