import React from "react";
import { Modal } from "antd";
import { SettingsPanel, SettingsPanelProps } from "../settingspanel/SettingsPanel";

export interface SettingsModalProps extends SettingsPanelProps {
    open: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose, ...settingsPanelProps }) => {
    return (
        <Modal open={open} onCancel={onClose} footer={null} width={900} destroyOnHidden>
            <SettingsPanel {...settingsPanelProps} onClose={onClose} inModal />
        </Modal>
    );
};
