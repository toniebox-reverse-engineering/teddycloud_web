import React from "react";
import { Modal, Button, Alert, Tooltip, theme } from "antd";
import { FolderAddOutlined } from "@ant-design/icons";
import { Key } from "antd/es/table/interface";
import { useTranslation } from "react-i18next";

import { TeddyCloudApi } from "../../../../api";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { Record } from "../../../../types/fileBrowserTypes";
import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { DirectoryTreeApi } from "../../common/hooks/useDirectoryTree";
import { DirectoryTreeSelect } from "../../common/elements/DirectoryTreeSelect";
import { useDirectoryCreate } from "../../common/hooks/useCreateDirectory";
import CreateDirectoryModal from "../../common/modals/CreateDirectoryModal";

const { useToken } = theme;
const api = new TeddyCloudApi(defaultAPIConfig());

interface MoveFilesModalProps {
    open: boolean;
    onClose: () => void;

    special: string;
    overlay?: string;

    path: string;
    files: Record[];

    // Single vs. Multi
    currentFile: string | null;
    selectedRowKeys: Key[];
    setSelectedRowKeys: React.Dispatch<React.SetStateAction<Key[]>>;

    // Directory tree
    directoryTree: DirectoryTreeApi;
    setFilterFieldAutoFocus: (v: boolean) => void;

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
    directoryTree,
    setFilterFieldAutoFocus,
    setRebuildList,
}) => {
    const { token } = useToken();
    const { t } = useTranslation();
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();

    const {
        open: isCreateDirectoryModalOpen,
        createDirectoryPath,
        createDirectoryInputKey,
        hasNewDirectoryInvalidChars,
        isCreateDirectoryButtonDisabled,
        inputCreateDirectoryRef,
        openCreateDirectoryModal,
        closeCreateDirectoryModal,
        handleCreateDirectoryInputChange,
        createDirectory,
    } = useDirectoryCreate({
        path,
        directoryTree,
        selectNewNode: true,
        setRebuildList,
    });

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
        const targetDir = directoryTree.getPathFromNodeId(directoryTree.treeNodeId);
        const target = targetDir + "/" + currentFile;

        await moveRenameFile(source, target, true);
        setRebuildList((prev) => !prev);
        directoryTree.setTreeNodeId(directoryTree.rootTreeNode.id);
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

        const targetDir = directoryTree.getPathFromNodeId(directoryTree.treeNodeId);

        for (const rowName of selectedRowKeys) {
            const file = files.find((f) => f.name === rowName);
            if (file && !file.isDir) {
                const source = decodeURIComponent(path) + "/" + file.name;
                const target = targetDir + "/" + file.name;
                await moveRenameFile(source, target, true, true);
            }
        }

        closeLoadingNotification(key);
        setRebuildList((prev) => !prev);
        setSelectedRowKeys([]);
        directoryTree.setTreeNodeId(directoryTree.rootTreeNode.id);
        onClose();
    };

    const currentTargetDir = directoryTree.getPathFromNodeId(directoryTree.treeNodeId);
    const isMoveButtonDisabled =
        !directoryTree.treeNodeId || currentTargetDir === path || (!currentFile && selectedRowKeys.length === 0);

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
                title={t("fileBrowser.attention")}
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
                    <DirectoryTreeSelect
                        directoryTree={directoryTree}
                        placeholder={t("fileBrowser.moveFile.destinationPlaceholder")}
                        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                    />
                    <Tooltip title={t("fileBrowser.createDirectory.createDirectory")}>
                        <Button
                            icon={<FolderAddOutlined />}
                            onClick={() => {
                                const basePath = directoryTree.getPathFromNodeId(directoryTree.treeNodeId);
                                openCreateDirectoryModal(basePath);
                                setFilterFieldAutoFocus(false);
                            }}
                            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                        />
                    </Tooltip>
                </div>
            </div>
            {isCreateDirectoryModalOpen && (
                <CreateDirectoryModal
                    open={isCreateDirectoryModalOpen}
                    createDirectoryPath={createDirectoryPath}
                    createDirectoryInputKey={createDirectoryInputKey}
                    hasNewDirectoryInvalidChars={hasNewDirectoryInvalidChars}
                    isCreateDirectoryButtonDisabled={isCreateDirectoryButtonDisabled}
                    inputRef={inputCreateDirectoryRef}
                    onInputChange={handleCreateDirectoryInputChange}
                    onClose={closeCreateDirectoryModal}
                    onCreate={createDirectory}
                />
            )}
        </Modal>
    );
};

export default MoveFilesModal;
