import React, { useEffect, useRef, useState } from "react";
import { Modal, Alert, Form, Input } from "antd";
import type { InputRef } from "antd";

import { useTranslation } from "react-i18next";

import { TeddyCloudApi } from "../../../../api";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import {
    INVALID_NAME_CHARS_DISPLAY as invalidCharactersAsString,
    isInputValid,
} from "../../../../utils/validation/fieldInputValidator";
import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

interface RenameFileModalProps {
    open: boolean;
    onClose: () => void;

    special: string;
    overlay?: string;

    path: string; // encoded path
    currentFile: string | null;

    setRebuildList: React.Dispatch<React.SetStateAction<boolean>>;
}

const RenameFileModal: React.FC<RenameFileModalProps> = ({
    open,
    onClose,
    special,
    overlay,
    path,
    currentFile,
    setRebuildList,
}) => {
    const { t } = useTranslation();
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();

    const inputRef = useRef<InputRef>(null);

    const [hasInvalidChars, setHasInvalidChars] = useState<boolean>(false);
    const [hasError, setHasError] = useState<boolean>(true);
    const [isUnchangedOrEmpty, setIsUnchangedOrEmpty] = useState<boolean>(true);

    useEffect(() => {
        if (open) {
            const value = currentFile ?? "";
            const invalid = !isInputValid(value);
            setHasInvalidChars(invalid);
            setHasError(true); // bis User tippt
            setIsUnchangedOrEmpty(true);

            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        }
    }, [open, currentFile]);

    const moveRenameFile = async (source: string, target: string) => {
        const body = "source=" + encodeURIComponent(source) + "&target=" + encodeURIComponent(target);
        const key = "rename-file";

        addLoadingNotification(
            key,
            t("fileBrowser.messages.renaming"),
            t("fileBrowser.messages.renamingDetails", { file: source.split("/").slice(-1) })
        );

        try {
            const moveUrl = `/api/fileMove${"?special=" + special + (overlay ? `&overlay=${overlay}` : "")}`;
            const response = await api.apiPostTeddyCloudRaw(moveUrl, body);
            const data = await response.text();

            closeLoadingNotification(key);

            if (data === "OK") {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("fileBrowser.messages.renamingSuccessful"),
                    t("fileBrowser.messages.renamingSuccessfulDetails", {
                        fileSource: source.split("/").slice(-1),
                        fileTarget: target.split("/").slice(-1),
                    }),
                    t("fileBrowser.title")
                );
            } else {
                throw data;
            }
        } catch (error) {
            closeLoadingNotification(key);
            addNotification(
                NotificationTypeEnum.Error,
                t("fileBrowser.messages.renamingFailed"),
                t("fileBrowser.messages.renamingFailedDetails", {
                    fileSource: source,
                    fileTarget: target,
                }) + error,
                t("fileBrowser.title")
            );
        }
    };

    const handleOk = async () => {
        const newFileName = inputRef.current && inputRef.current.input ? inputRef.current.input.value : currentFile;

        if (!currentFile || !newFileName) {
            onClose();
            return;
        }

        const source = decodeURIComponent(path) + "/" + currentFile;
        const target = decodeURIComponent(path) + "/" + newFileName;

        await moveRenameFile(source, target);
        setRebuildList((prev) => !prev);
        onClose();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value ?? "";
        const invalid = !isInputValid(value.toString());
        const errorDetected = !value.toString() || invalid;

        setHasInvalidChars(invalid);
        setHasError(errorDetected);
        setIsUnchangedOrEmpty(!value || value === currentFile);
    };

    const isRenameButtonDisabled = isUnchangedOrEmpty || hasInvalidChars || hasError;

    return (
        <Modal
            title={t("fileBrowser.renameFile.modalTitle")}
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            okText={t("fileBrowser.renameFile.rename")}
            cancelText={t("fileBrowser.renameFile.cancel")}
            okButtonProps={{ disabled: isRenameButtonDisabled }}
        >
            <Alert
                message={t("fileBrowser.attention")}
                description={t("fileBrowser.renameFile.attention")}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "space-between" }}>
                <Form.Item
                    validateStatus={hasInvalidChars ? "error" : ""}
                    help={
                        hasInvalidChars
                            ? t("inputValidator.invalidCharactersDetected", { invalidChar: invalidCharactersAsString })
                            : ""
                    }
                    required
                >
                    <Input
                        ref={inputRef}
                        type="text"
                        defaultValue={currentFile ?? ""}
                        onChange={handleInputChange}
                        placeholder={currentFile ?? ""}
                        status={hasInvalidChars ? "error" : ""}
                    />
                </Form.Item>
            </div>
        </Modal>
    );
};

export default RenameFileModal;
