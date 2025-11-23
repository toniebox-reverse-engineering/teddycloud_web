import React from "react";
import { Modal, Button, Alert, Tooltip, theme } from "antd";
import { FolderAddOutlined } from "@ant-design/icons";
import { Key } from "antd/es/table/interface";

import { TeddyCloudApi } from "../../../../api";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { Record } from "../../../../types/fileBrowserTypes";
import { useTranslation } from "react-i18next";
import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";

const { useToken } = theme;
const api = new TeddyCloudApi(defaultAPIConfig());

interface MoveFilesModalProps {
    open: boolean;
    onClose: () => void;

    special: string;
    overlay?: string;

    path: string; // encoded path from FileBrowser-State
    files: Record[];

    // Single vs. Multi
    currentFile: string | null;
    selectedRowKeys: Key[];
    setSelectedRowKeys: React.Dispatch<React.SetStateAction<Key[]>>;

    // Tree
    treeNodeId: string;
    setTreeNodeId: (id: string) => void;
    rootTreeNodeId: string;
    getPathFromNodeId: (id: string) => string;
    folderTreeElement: React.ReactNode;

    // Create Directory Button in modal
    setCreateDirectoryPath: (path: string) => void;
    setFilterFieldAutoFocus: (v: boolean) => void;
    setIsCreateDirectoryModalOpen: (v: boolean) => void;

    // reload list
    setRebuildList: React.Dispatch<React.SetStateAction<boolean>>;
}

const MoveFilesModal: React.FC<MoveFilesModalProps> = ({
    open,
    onClose,
    special,
    overlay,
    path,
    files,
    currentFile,
    selectedRowKeys,
    setSelectedRowKeys,
    treeNodeId,
    setTreeNodeId,
    rootTreeNodeId,
    getPathFromNodeId,
    folderTreeElement,
    setCreateDirectoryPath,
    setFilterFieldAutoFocus,
    setIsCreateDirectoryModalOpen,
    setRebuildList,
}) => {
    const { token } = useToken();
    const { t } = useTranslation();
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();

    const moveRenameFile = async (source: string, target: string, moving: boolean, flagMultiple?: boolean) => {
        const body = "source=" + encodeURIComponent(source) + "&target=" + encodeURIComponent(target);
        const key = moving ? "move-file" : "rename-file";
        addLoadingNotification(
            key,
            moving ? t("fileBrowser.messages.moving") : t("fileBrowser.messages.renaming"),
            moving
                ? t("fileBrowser.messages.movingDetails", { file: source.split("/").slice(-1) })
                : t("fileBrowser.messages.renamingDetails", { file: source.split("/").slice(-1) })
        );

        try {
            const moveUrl = `/api/fileMove${"?special=" + special + (overlay ? `&overlay=${overlay}` : "")}`;
            const response = await api.apiPostTeddyCloudRaw(moveUrl, body);
            const data = await response.text();

            if (!flagMultiple) {
                closeLoadingNotification(key);
            }

            if (data === "OK") {
                addNotification(
                    NotificationTypeEnum.Success,
                    moving ? t("fileBrowser.messages.movingSuccessful") : t("fileBrowser.messages.renamingSuccessful"),
                    moving
                        ? t("fileBrowser.messages.movingSuccessfulDetails", {
                              fileSource: source.split("/").slice(-1),
                              fileTarget: target.split("/").slice(0, -1).join("/") + "/",
                          })
                        : t("fileBrowser.messages.renamingSuccessfulDetails", {
                              fileSource: source.split("/").slice(-1),
                              fileTarget: target.split("/").slice(-1),
                          }),
                    t("fileBrowser.title")
                );
            } else {
                throw data;
            }
        } catch (error) {
            if (!flagMultiple) {
                closeLoadingNotification(key);
            }
            addNotification(
                NotificationTypeEnum.Error,
                moving ? t("fileBrowser.messages.movingFailed") : t("fileBrowser.messages.renamingFailed"),
                (moving
                    ? t("fileBrowser.messages.movingFailedDetails", { fileSource: source, fileTarget: target })
                    : t("fileBrowser.messages.renamingFailedDetails", { fileSource: source, fileTarget: target })) +
                    error,
                t("fileBrowser.title")
            );
        }
    };

    const handleSingleMove = async () => {
        if (!currentFile) return;
        const source = decodeURIComponent(path) + "/" + currentFile;
        const targetDir = getPathFromNodeId(treeNodeId);
        const target = targetDir + "/" + currentFile;

        await moveRenameFile(source, target, true);
        setRebuildList((prev) => !prev);
        setTreeNodeId(rootTreeNodeId);
        onClose();
    };

    const handleMultipleMove = async () => {
        if (selectedRowKeys.length === 0) {
            addNotification(
                NotificationTypeEnum.Warning,
                t("tonies.messages.noRowsSelected"),
                t("tonies.messages.noRowsSelectedForMoving"),
                t("fileBrowser.title")
            );
            return;
        }

        const key = "move-file";
        addLoadingNotification(key, t("fileBrowser.messages.moving"), t("fileBrowser.messages.moving"));

        const targetDir = getPathFromNodeId(treeNodeId);

        for (const rowName of selectedRowKeys) {
            const file = (files as Record[]).find((f) => f.name === rowName);
            if (file && !file.isDir) {
                const source = decodeURIComponent(path) + "/" + file.name;
                const target = targetDir + "/" + file.name;
                await moveRenameFile(source, target, true, true);
            }
        }

        closeLoadingNotification(key);
        setRebuildList((prev) => !prev);
        setSelectedRowKeys([]);
        setTreeNodeId(rootTreeNodeId);
        onClose();
    };

    const isMoveButtonDisabled =
        !treeNodeId || getPathFromNodeId(treeNodeId) === path || (!currentFile && selectedRowKeys.length === 0);

    const handleOk = () => {
        if (currentFile) {
            handleSingleMove();
        } else {
            handleMultipleMove();
        }
    };

    return (
        <Modal
            title={currentFile ? t("fileBrowser.moveFile.modalTitle") : t("fileBrowser.moveFile.modalTitleMultiple")}
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            okText={t("fileBrowser.moveFile.move")}
            cancelText={t("fileBrowser.moveFile.cancel")}
            okButtonProps={{ disabled: isMoveButtonDisabled }}
        >
            <Alert
                message={t("fileBrowser.attention")}
                description={t("fileBrowser.moveFile.attention")}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "space-between" }}>
                <div style={{ marginBottom: 24, padding: 8, background: token.colorBgContainerDisabled }}>
                    <ul style={{ maxHeight: "calc(1.5em * 5)", overflowY: "auto" }}>
                        {currentFile ? (
                            <li key="movFile">{currentFile}</li>
                        ) : (
                            selectedRowKeys.map((key, index) => <li key={index}>{key.toString()}</li>)
                        )}
                    </ul>
                </div>
                <div>{t("fileBrowser.moveFile.moveTo")}</div>

                <div style={{ display: "flex" }}>
                    {folderTreeElement}
                    <Tooltip title={t("fileBrowser.createDirectory.createDirectory")}>
                        <Button
                            icon={<FolderAddOutlined />}
                            onClick={() => {
                                setCreateDirectoryPath(getPathFromNodeId(treeNodeId));
                                setFilterFieldAutoFocus(false);
                                setIsCreateDirectoryModalOpen(true);
                            }}
                            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                        />
                    </Tooltip>
                </div>
            </div>
        </Modal>
    );
};

export default MoveFilesModal;
