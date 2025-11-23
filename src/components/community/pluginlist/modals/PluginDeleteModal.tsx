import { useTranslation } from "react-i18next";
import ConfirmationDialog from "../../../common/modals/ConfirmationModal";

interface PluginDeleteDialogProps {
    open: boolean;
    pluginId: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const PluginDeleteDialog: React.FC<PluginDeleteDialogProps> = ({ open, pluginId, onConfirm, onCancel }) => {
    const { t } = useTranslation();

    return (
        <ConfirmationDialog
            title={t("community.plugins.deletion.confirmDeleteModal")}
            open={open}
            okText={t("community.plugins.deletion.delete")}
            cancelText={t("community.plugins.cancel")}
            content={t("community.plugins.deletion.confirmDeleteDialog", { pluginId })}
            handleOk={onConfirm}
            handleCancel={onCancel}
        />
    );
};
