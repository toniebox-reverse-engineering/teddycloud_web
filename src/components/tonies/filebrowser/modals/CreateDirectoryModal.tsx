import React, { useEffect, useRef, useState } from "react";
import { Modal, Form, Input, Typography } from "antd";
import type { InputRef } from "antd";
import { useTranslation } from "react-i18next";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { invalidCharactersAsString, isInputValid } from "../../../../utils/fieldInputValidator";
import { useTeddyCloud } from "../../../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

type TreeNode = {
    id: string;
    pId: string;
    value: string;
    title: string;
    fullPath: string;
};

interface CreateDirectoryModalProps {
    open: boolean;
    onClose: () => void;
    createDirectoryPath: string;
    setCreateDirectoryPath: (path: string) => void;
    path: string;

    treeData: TreeNode[];
    setTreeData: React.Dispatch<React.SetStateAction<TreeNode[]>>;
    rootTreeNode: TreeNode;
    isNodeExpanded: (nodeId: string) => boolean;
    findNodeIdByFullPath: (fullPath: string, nodes: TreeNode[]) => string | null;
    findNodesByParentId: (parentId: string, nodes: TreeNode[]) => string[];

    isMoveFileModalOpen: boolean;
    isEncodeFilesModalOpen: boolean;
    setTreeNodeId: (id: string) => void;
    setRebuildList: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreateDirectoryModal: React.FC<CreateDirectoryModalProps> = ({
    open,
    onClose,
    createDirectoryPath,
    setCreateDirectoryPath,
    path,
    treeData,
    setTreeData,
    rootTreeNode,
    isNodeExpanded,
    findNodeIdByFullPath,
    findNodesByParentId,
    isMoveFileModalOpen,
    isEncodeFilesModalOpen,
    setTreeNodeId,
    setRebuildList,
}) => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();

    const inputCreateDirectoryRef = useRef<InputRef>(null);
    const [createDirectoryInputKey, setCreateDirectoryInputKey] = useState<number>(1);
    const [isUnchangedOrEmpty, setIsUnchangedOrEmpty] = useState<boolean>(true);
    const [hasNewDirectoryInvalidChars, setHasNewDirectoryInvalidChars] = useState<boolean>(false);

    const isCreateDirectoryButtonDisabled = isUnchangedOrEmpty || hasNewDirectoryInvalidChars;

    useEffect(() => {
        if (open) {
            setIsUnchangedOrEmpty(true);
            setHasNewDirectoryInvalidChars(false);
            setCreateDirectoryInputKey((prev) => prev + 1);

            setTimeout(() => {
                if (inputCreateDirectoryRef.current) {
                    inputCreateDirectoryRef.current.focus();
                }
            }, 0);
        }
    }, [open]);

    const handleCreateDirectoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value ?? "";
        const inputInvalid = !isInputValid(value.toString());
        setHasNewDirectoryInvalidChars(inputInvalid);
        setIsUnchangedOrEmpty(value === "");
    };

    const handleClose = () => {
        onClose();
    };

    const createDirectory = () => {
        const inputValueCreateDirectory = inputCreateDirectoryRef.current?.input?.value?.trim() || "";
        if (!inputValueCreateDirectory) {
            return;
        }

        try {
            api.apiPostTeddyCloudRaw(
                `/api/dirCreate?special=library`,
                decodeURIComponent(createDirectoryPath) + "/" + inputValueCreateDirectory
            )
                .then((response) => response.text())
                .then((text) => {
                    if (text !== "OK") {
                        throw new Error(text);
                    }

                    const parentNodeId = findNodeIdByFullPath(createDirectoryPath + "/", treeData) || rootTreeNode.id;
                    const newNodeId = `${parentNodeId}.${treeData.length}`;
                    const nodeExpanded = isNodeExpanded(parentNodeId);
                    const childNodes = findNodesByParentId(parentNodeId, treeData);

                    if (nodeExpanded || childNodes.length > 0) {
                        const newDir: TreeNode = {
                            id: newNodeId,
                            pId: parentNodeId,
                            value: newNodeId,
                            title: inputValueCreateDirectory,
                            fullPath: createDirectoryPath + "/" + inputValueCreateDirectory + "/",
                        };

                        setTreeData(
                            [...treeData, newDir].sort((a, b) =>
                                a.title.toLowerCase() > b.title.toLowerCase()
                                    ? 1
                                    : a.title.toLowerCase() < b.title.toLowerCase()
                                    ? -1
                                    : 0
                            )
                        );

                        if (isMoveFileModalOpen || isEncodeFilesModalOpen) {
                            setTreeNodeId(newNodeId);
                        }
                    }

                    addNotification(
                        NotificationTypeEnum.Success,
                        t("fileBrowser.createDirectory.directoryCreated"),
                        t("fileBrowser.createDirectory.directoryCreatedDetails", {
                            directory: decodeURIComponent(createDirectoryPath) + "/" + inputValueCreateDirectory,
                        }),
                        t("fileBrowser.title")
                    );

                    setRebuildList((prev) => !prev);
                    setCreateDirectoryPath(path);
                    handleClose();
                })
                .catch((error) => {
                    addNotification(
                        NotificationTypeEnum.Error,
                        t("fileBrowser.createDirectory.directoryCreateFailed"),
                        t("fileBrowser.createDirectory.directoryCreateFailedDetails", {
                            directory: decodeURIComponent(createDirectoryPath) + "/" + inputValueCreateDirectory,
                        }) + error,
                        t("fileBrowser.title")
                    );
                });
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("fileBrowser.createDirectory.directoryCreateFailed"),
                t("fileBrowser.createDirectory.directoryCreateFailedDetails", {
                    directory: decodeURIComponent(createDirectoryPath) + "/" + inputValueCreateDirectory,
                }) + error,
                t("fileBrowser.title")
            );
        }
    };

    return (
        <Modal
            title={t("fileBrowser.createDirectory.modalTitle")}
            key={"createDirModal-" + createDirectoryInputKey}
            open={open}
            onCancel={handleClose}
            onOk={createDirectory}
            okText={t("fileBrowser.createDirectory.create")}
            cancelText={t("fileBrowser.createDirectory.cancel")}
            zIndex={1050}
            okButtonProps={{ disabled: isCreateDirectoryButtonDisabled }}
        >
            <Typography style={{ marginBottom: 8 }}>
                {t("fileBrowser.createDirectory.parentPath") +
                    " " +
                    createDirectoryPath.split("/").map(decodeURIComponent).join("/") +
                    "/"}
            </Typography>
            <Form.Item
                validateStatus={hasNewDirectoryInvalidChars ? "error" : ""}
                help={
                    hasNewDirectoryInvalidChars
                        ? t("inputValidator.invalidCharactersDetected", { invalidChar: invalidCharactersAsString })
                        : ""
                }
                required
            >
                <Input
                    ref={inputCreateDirectoryRef}
                    type="text"
                    placeholder={t("fileBrowser.createDirectory.placeholder")}
                    status={hasNewDirectoryInvalidChars ? "error" : ""}
                    onChange={handleCreateDirectoryInputChange}
                />
            </Form.Item>
        </Modal>
    );
};

export default CreateDirectoryModal;
