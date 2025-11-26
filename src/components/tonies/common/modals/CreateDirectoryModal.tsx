import React from "react";
import { Form, Input, Modal, Typography } from "antd";
import type { InputRef } from "antd";
import { useTranslation } from "react-i18next";

import { INVALID_NAME_CHARS_DISPLAY as invalidCharactersAsString } from "../../../../utils/validation/fieldInputValidator";

interface CreateDirectoryModalProps {
    open: boolean;
    createDirectoryPath: string;
    createDirectoryInputKey: number;
    hasNewDirectoryInvalidChars: boolean;
    isCreateDirectoryButtonDisabled: boolean;
    inputRef: React.RefObject<InputRef | null>;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClose: () => void;
    onCreate: () => void;
}

const CreateDirectoryModal: React.FC<CreateDirectoryModalProps> = ({
    open,
    createDirectoryPath,
    createDirectoryInputKey,
    hasNewDirectoryInvalidChars,
    isCreateDirectoryButtonDisabled,
    inputRef,
    onInputChange,
    onClose,
    onCreate,
}) => {
    const { t } = useTranslation();

    const parentPathLabel =
        createDirectoryPath
            .split("/")
            .filter((x) => x.length > 0)
            .map(decodeURIComponent)
            .join("/") + "/";

    return (
        <Modal
            title={t("fileBrowser.createDirectory.modalTitle")}
            key={"createDirModal-" + createDirectoryInputKey}
            open={open}
            onCancel={onClose}
            onOk={onCreate}
            okText={t("fileBrowser.createDirectory.create")}
            cancelText={t("fileBrowser.createDirectory.cancel")}
            zIndex={1050}
            okButtonProps={{ disabled: isCreateDirectoryButtonDisabled }}
        >
            <Typography style={{ marginBottom: 8 }}>
                {t("fileBrowser.createDirectory.parentPath") + " " + parentPathLabel}
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
                    ref={inputRef}
                    type="text"
                    placeholder={t("fileBrowser.createDirectory.placeholder")}
                    status={hasNewDirectoryInvalidChars ? "error" : ""}
                    onChange={onInputChange}
                />
            </Form.Item>
        </Modal>
    );
};

export default CreateDirectoryModal;
