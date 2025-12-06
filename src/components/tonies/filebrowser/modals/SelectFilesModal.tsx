import React, { useEffect, useState } from "react";
import { Modal, Button, theme } from "antd";
import { useTranslation } from "react-i18next";

import { SelectFileFileBrowser } from "../SelectFileFileBrowser";
import { FileObject } from "../../../../types/fileBrowserTypes";

const { useToken } = theme;

interface SelectFilesModalProps {
    open: boolean;
    maxSelectable: number;
    selectableFileTypes?: string[];
    selectedNewFiles: FileObject[];
    onCancel: () => void;
    onOk: () => void;
    onFileSelectChange: (files: any[], path: string, special: string) => void;
}

export const SelectFilesModal: React.FC<SelectFilesModalProps> = ({
    open,
    maxSelectable,
    selectableFileTypes,
    selectedNewFiles,
    onCancel,
    onOk,
    onFileSelectChange,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();

    const [browserKey, setBrowserKey] = useState<number>(0);

    useEffect(() => {
        if (open) {
            setBrowserKey((prev) => prev + 1);
        }
    }, [open]);

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
            <Button onClick={onCancel}>{t("tonies.selectFileModal.cancel")}</Button>
            <Button type="primary" onClick={onOk} disabled={selectedNewFiles.length === 0}>
                {t("tonies.selectFileModal.ok")}
            </Button>
        </div>
    );

    return (
        <Modal
            className="sticky-footer"
            title={t("tonies.selectFileModal.selectFile")}
            open={open}
            onOk={onOk}
            onCancel={onCancel}
            width="auto"
            footer={footer}
        >
            <SelectFileFileBrowser
                key={browserKey}
                special="library"
                maxSelectedRows={maxSelectable}
                trackUrl={false}
                filetypeFilter={selectableFileTypes}
                onFileSelectChange={onFileSelectChange}
            />
        </Modal>
    );
};
