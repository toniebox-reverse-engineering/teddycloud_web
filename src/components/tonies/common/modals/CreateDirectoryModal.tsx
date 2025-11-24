import React, { useEffect, useRef, useState } from "react";
import { Modal, Form, Input, Typography } from "antd";
import type { InputRef } from "antd";
import { useTranslation } from "react-i18next";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import {
    INVALID_NAME_CHARS_DISPLAY as invalidCharactersAsString,
    isInputValid,
} from "../../../../utils/validation/fieldInputValidator";
import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { DirectoryTreeApi } from "../hooks/useDirectoryTree";

const api = new TeddyCloudApi(defaultAPIConfig());

interface CreateDirectoryModalProps {
    open: boolean;
    onClose: () => void;

    createDirectoryPath: string;
    setCreateDirectoryPath: (path: string) => void;
    path: string;

    directoryTree: DirectoryTreeApi;

    isMoveFileModalOpen: boolean;
    isEncodeFilesModalOpen: boolean;

    setRebuildList: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreateDirectoryModal: React.FC<CreateDirectoryModalProps> = ({
    open,
    onClose,
    createDirectoryPath,
    setCreateDirectoryPath,
    path,
    directoryTree,
    isMoveFileModalOpen,
    isEncodeFilesModalOpen,
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

        const dirFullPath = `${decodeURIComponent(createDirectoryPath)}/${inputValueCreateDirectory}`;

        try {
            api.apiPostTeddyCloudRaw(`/api/dirCreate?special=library`, dirFullPath)
                .then((response) => response.text())
                .then((text) => {
                    if (text !== "OK") {
                        throw new Error(text);
                    }

                    directoryTree.addDirectory({
                        parentPath: createDirectoryPath,
                        directoryName: inputValueCreateDirectory,
                        selectNewNode: isMoveFileModalOpen || isEncodeFilesModalOpen,
                    });

                    addNotification(
                        NotificationTypeEnum.Success,
                        t("fileBrowser.createDirectory.directoryCreated"),
                        t("fileBrowser.createDirectory.directoryCreatedDetails", {
                            directory: dirFullPath,
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
                            directory: dirFullPath,
                        }) + error,
                        t("fileBrowser.title")
                    );
                });
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("fileBrowser.createDirectory.directoryCreateFailed"),
                t("fileBrowser.createDirectory.directoryCreateFailedDetails", {
                    directory: dirFullPath,
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
                    createDirectoryPath
                        .split("/")
                        .filter((x) => x.length > 0)
                        .map(decodeURIComponent)
                        .join("/") +
                    "/"}
            </Typography>
            <Form.Item
                validateStatus={hasNewDirectoryInvalidChars ? "error" : ""}
                help={
                    hasNewDirectoryInvalidChars
                        ? t("inputValidator.invalidCharactersDetected", {
                              invalidChar: invalidCharactersAsString,
                          })
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
