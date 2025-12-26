import { useEffect, useRef, useState } from "react";
import type { InputRef } from "antd";
import { useTranslation } from "react-i18next";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { isInputValid } from "../../../../utils/validation/fieldInputValidator";
import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { DirectoryTreeApi } from "../hooks/useDirectoryTree";

const api = new TeddyCloudApi(defaultAPIConfig());

export interface UseDirectoryCreateOptions {
    path?: string;
    directoryTree: DirectoryTreeApi;
    selectNewNode: boolean;
    setRebuildList?: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface UseDirectoryCreateResult {
    // State
    open: boolean;
    createDirectoryPath: string;
    createDirectoryInputKey: number;
    hasNewDirectoryInvalidChars: boolean;
    isCreateDirectoryButtonDisabled: boolean;

    // Input-Ref
    inputCreateDirectoryRef: React.RefObject<InputRef | null>;

    // Actions
    openCreateDirectoryModal: (parentPath?: string) => void;
    closeCreateDirectoryModal: () => void;
    handleCreateDirectoryInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    createDirectory: () => void;
}

export const useDirectoryCreate = ({
    path,
    directoryTree,
    selectNewNode,
    setRebuildList,
}: UseDirectoryCreateOptions): UseDirectoryCreateResult => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();

    const [open, setIsOpen] = useState<boolean>(false);
    const [createDirectoryPath, setCreateDirectoryPath] = useState<string>(path || "");

    const inputCreateDirectoryRef = useRef<InputRef>(null);
    const [createDirectoryInputKey, setCreateDirectoryInputKey] = useState<number>(1);
    const [isUnchangedOrEmpty, setIsUnchangedOrEmpty] = useState<boolean>(true);
    const [hasNewDirectoryInvalidChars, setHasNewDirectoryInvalidChars] = useState<boolean>(false);

    const isCreateDirectoryButtonDisabled = isUnchangedOrEmpty || hasNewDirectoryInvalidChars;

    useEffect(() => {
        if (!open && path) {
            setCreateDirectoryPath(path);
        }
    }, [path, open]);

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
        setIsUnchangedOrEmpty(value.trim() === "");
    };

    const closeCreateDirectoryModal = () => {
        setIsOpen(false);
    };

    const openCreateDirectoryModal = (parentPath?: string) => {
        setCreateDirectoryPath(parentPath ?? "");
        setIsOpen(true);
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
                        selectNewNode: selectNewNode,
                    });

                    addNotification(
                        NotificationTypeEnum.Success,
                        t("fileBrowser.createDirectory.directoryCreated"),
                        t("fileBrowser.createDirectory.directoryCreatedDetails", {
                            directory: dirFullPath,
                        }),
                        t("fileBrowser.title")
                    );

                    setRebuildList && setRebuildList((prev) => !prev);
                    setCreateDirectoryPath(inputValueCreateDirectory);
                    closeCreateDirectoryModal();
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

    return {
        open,
        createDirectoryPath,
        createDirectoryInputKey,
        hasNewDirectoryInvalidChars,
        isCreateDirectoryButtonDisabled,
        inputCreateDirectoryRef,
        openCreateDirectoryModal,
        closeCreateDirectoryModal,
        handleCreateDirectoryInputChange,
        createDirectory,
    };
};
