import React, { useState } from "react";
import { Modal, Button, theme } from "antd";
import { useTranslation } from "react-i18next";

import { SelectFileFileBrowser } from "../SelectFileFileBrowser";
import { FileObject } from "../../../../types/fileBrowserTypes";
import { ffmpegSupportedExtensions } from "../../../../utils/files/ffmpegSupportedExtensions";
import { generateUUID } from "../../../../utils/ids/generateUUID";

const { useToken } = theme;

interface SelectFilesForEncodingModalProps {
    open: boolean;
    onClose: () => void;

    maxSelectable: number;

    onConfirm: (files: FileObject[]) => void;

    browserKey: number;
}

const SelectFilesForEncodingModal: React.FC<SelectFilesForEncodingModalProps> = ({
    open,
    onClose,
    maxSelectable,
    onConfirm,
    browserKey,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();

    const [selectedNewFiles, setSelectedNewFiles] = useState<FileObject[]>([]);

    const handleFileSelectChange = (files: any[], path: string, special: string) => {
        const newEncodedFiles: FileObject[] = [];

        if (files.length > 0) {
            for (const selectedFile of files) {
                const file = files.find(
                    (file) =>
                        file.name === selectedFile.name &&
                        ffmpegSupportedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
                );

                if (file) {
                    newEncodedFiles.push({
                        uid: generateUUID(),
                        name: file.name,
                        path: path,
                    });
                }
            }
        }
        setSelectedNewFiles(newEncodedFiles);
    };

    const handleCancel = () => {
        setSelectedNewFiles([]);
        onClose();
    };

    const handleOk = () => {
        onConfirm(selectedNewFiles);
        setSelectedNewFiles([]);
        onClose();
    };

    const footer = (
        <div
            style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                padding: "16px 0",
                margin: "-24px -24px -12px -24px",
                background: token.colorBgElevated,
            }}
        >
            <Button onClick={handleCancel}>{t("tonies.selectFileModal.cancel")}</Button>
            <Button type="primary" onClick={handleOk} disabled={selectedNewFiles.length === 0}>
                {t("tonies.selectFileModal.ok")}
            </Button>
        </div>
    );

    return (
        <Modal
            className="sticky-footer"
            title={t("tonies.selectFileModal.selectFile")}
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            width="auto"
            footer={footer}
        >
            <SelectFileFileBrowser
                key={browserKey}
                special="library"
                maxSelectedRows={maxSelectable}
                trackUrl={false}
                filetypeFilter={ffmpegSupportedExtensions}
                onFileSelectChange={handleFileSelectChange}
            />
        </Modal>
    );
};

export default SelectFilesForEncodingModal;
