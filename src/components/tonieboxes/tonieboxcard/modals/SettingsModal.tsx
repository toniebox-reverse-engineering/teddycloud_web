import React from "react";
import { Modal } from "antd";
import { useTranslation } from "react-i18next";

import { Settings } from "../settings/Settings";

interface SettingsModalProps {
    open: boolean;
    overlayId: string;
    tonieboxName: string;
    modalKey: number;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, overlayId, tonieboxName, modalKey, onClose }) => {
    const { t } = useTranslation();

    return (
        <Modal
            title={t("tonieboxes.editTonieboxSettingsModal.editTonieboxSettings", {
                name: tonieboxName,
            })}
            width="auto"
            open={open}
            onCancel={onClose}
            footer={null}
            wrapClassName={"overlay-" + overlayId}
        >
            <Settings onClose={onClose} overlay={overlayId} key={modalKey} />
        </Modal>
    );
};
