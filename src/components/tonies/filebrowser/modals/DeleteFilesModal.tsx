import React from "react";
import { Key } from "antd/es/table/interface";
import { useTranslation } from "react-i18next";

import ConfirmationDialog from "../../../common/modals/ConfirmationModal";
import { TeddyCloudApi } from "../../../../api";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { Record } from "../../../../types/fileBrowserTypes";
import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

interface DeleteFilesModalProps {
    special: string;
    overlay?: string;

    files: Record[];
    path: string;
    setRebuildList: React.Dispatch<React.SetStateAction<boolean>>;

    // multi selection
    selectedRowKeys: Key[];
    setSelectedRowKeys: React.Dispatch<React.SetStateAction<Key[]>>;

    // single delete
    singleOpen: boolean;
    fileToDelete: string | null;
    deletePath: string;
    deleteApiCall: string; // e.g. "?special=library&overlay=..."

    onCloseSingle: () => void;

    // multiple delete
    multipleOpen: boolean;
    onCloseMultiple: () => void;
}

const DeleteFilesModal: React.FC<DeleteFilesModalProps> = ({
    special,
    overlay,
    files,
    path,
    setRebuildList,
    selectedRowKeys,
    setSelectedRowKeys,
    singleOpen,
    fileToDelete,
    deletePath,
    deleteApiCall,
    onCloseSingle,
    multipleOpen,
    onCloseMultiple,
}) => {
    const { t } = useTranslation();
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();

    const deleteFile = async (filePath: string, apiCall: string, flagMultiple?: boolean) => {
        const key = "deletingFiles";

        addLoadingNotification(
            key,
            t("fileBrowser.messages.deleting"),
            t("fileBrowser.messages.deletingDetails", {
                file: filePath,
            })
        );

        try {
            const deleteUrl = `/api/fileDelete${apiCall}`;
            const response = await api.apiPostTeddyCloudRaw(deleteUrl, filePath);
            const data = await response.text();

            if (!flagMultiple) {
                closeLoadingNotification(key);
            }

            if (data === "OK") {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("fileBrowser.messages.deleteSuccessful"),
                    t("fileBrowser.messages.deleteSuccessfulDetails", {
                        file: filePath.split("/").slice(-1),
                    }),
                    t("fileBrowser.title")
                );
            } else {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("fileBrowser.messages.deleteFailed"),
                    `${t("fileBrowser.messages.deleteFailedDetails", {
                        file: filePath.split("/").slice(-1),
                    })}: ${data}`,
                    t("fileBrowser.title")
                );
            }
        } catch (error) {
            if (!flagMultiple) {
                closeLoadingNotification(key);
            }
            addNotification(
                NotificationTypeEnum.Error,
                t("fileBrowser.messages.deleteFailed"),
                `${t("fileBrowser.messages.deleteFailedDetails", {
                    file: filePath.split("/").slice(-1),
                })}: ${error}`,
                t("fileBrowser.title")
            );
        }
    };

    const handleConfirmSingleDelete = async () => {
        if (!deletePath || !deleteApiCall) {
            onCloseSingle();
            return;
        }
        await deleteFile(deletePath, deleteApiCall);
        setRebuildList((prev) => !prev);
        onCloseSingle();
    };

    const handleConfirmMultipleDelete = async () => {
        if (selectedRowKeys.length === 0) {
            addNotification(
                NotificationTypeEnum.Warning,
                t("tonies.messages.noRowsSelected"),
                t("tonies.messages.noRowsSelectedForDeletion"),
                t("fileBrowser.title")
            );
            return;
        }

        const key = "deletingFiles";
        addLoadingNotification(key, t("fileBrowser.messages.deleting"), t("fileBrowser.messages.deleting"));

        for (const rowName of selectedRowKeys) {
            const file = files.find((f) => f.name === rowName);
            if (file) {
                const filePath = decodeURIComponent(path) + "/" + file.name;
                const apiCall = "?special=" + special + (overlay ? `&overlay=${overlay}` : "");
                await deleteFile(filePath, apiCall, true);
            }
        }

        closeLoadingNotification(key);
        setRebuildList((prev) => !prev);
        setSelectedRowKeys([]);
        onCloseMultiple();
    };

    const handleCancelDelete = () => {
        onCloseSingle();
        onCloseMultiple();
    };

    return (
        <>
            <ConfirmationDialog
                title={t("fileBrowser.confirmDeleteModal")}
                open={singleOpen}
                okText={t("fileBrowser.delete")}
                cancelText={t("fileBrowser.cancel")}
                content={t("fileBrowser.confirmDeleteDialog", { fileToDelete })}
                handleOk={handleConfirmSingleDelete}
                handleCancel={handleCancelDelete}
            />
            <ConfirmationDialog
                title={t("fileBrowser.confirmDeleteModal")}
                open={multipleOpen}
                okText={t("fileBrowser.delete")}
                cancelText={t("fileBrowser.cancel")}
                content={t("fileBrowser.confirmMultipleDeleteDialog")}
                contentDetails={
                    <ul style={{ maxHeight: "calc(1.5em * 5)", overflowY: "auto" }}>
                        {selectedRowKeys.map((key, index) => (
                            <li key={index}>{key.toString()}</li>
                        ))}
                    </ul>
                }
                handleOk={handleConfirmMultipleDelete}
                handleCancel={handleCancelDelete}
            />
        </>
    );
};

export default DeleteFilesModal;
