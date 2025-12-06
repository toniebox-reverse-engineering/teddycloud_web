import React from "react";
import { useTranslation } from "react-i18next";

import ConfirmationDialog from "../../../common/modals/ConfirmationModal";

interface DeleteModalProps {
    open: boolean;
    tonieboxName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({ open, tonieboxName, onConfirm, onCancel }) => {
    const { t } = useTranslation();

    return (
        <ConfirmationDialog
            title={t("tonieboxes.confirmDeleteModal")}
            open={open}
            okText={t("tonieboxes.delete")}
            cancelText={t("tonieboxes.cancel")}
            content={t("tonieboxes.confirmDeleteDialog", { tonieboxToDelete: tonieboxName })}
            handleOk={onConfirm}
            handleCancel={onCancel}
        />
    );
};
