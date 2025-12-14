import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Modal, theme } from "antd";

import { SelectFileFileBrowser } from "../../filebrowser/SelectFileFileBrowser";

const { useToken } = theme;

interface SelectFileModalProps {
    open: boolean;
    tempSelectedSource: string;
    selectedSource: string;
    onTempSelectedSourceChange: (value: string) => void;
    onCancel: () => void;
    onConfirm: () => void;

    keySelectFileFileBrowser: number;
    onFileSelectChange: (files: any[], path: string, special: string) => void;
}

export const SelectFileModal: React.FC<SelectFileModalProps> = ({
    open,
    tempSelectedSource,
    selectedSource,
    onCancel,
    onConfirm,
    keySelectFileFileBrowser,
    onFileSelectChange,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();

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
            <Button
                type="primary"
                onClick={() => {
                    onConfirm();
                }}
                disabled={!tempSelectedSource}
            >
                {t("tonies.selectFileModal.ok")}
            </Button>
        </div>
    );

    const workingSource = tempSelectedSource || selectedSource;
    const initialPath = workingSource.startsWith("lib://")
        ? workingSource.replace(/^lib:\/\//, "").replace(/[^/]+$/, "")
        : "";

    return (
        <Modal
            className="sticky-footer"
            title={t("tonies.selectFileModal.selectFile")}
            open={open}
            onCancel={onCancel}
            width="auto"
            footer={footer}
        >
            <SelectFileFileBrowser
                key={keySelectFileFileBrowser}
                initialPath={initialPath}
                special="library"
                maxSelectedRows={1}
                trackUrl={false}
                filetypeFilter={[".taf", ".tap"]}
                onFileSelectChange={(files, path, special) => {
                    onFileSelectChange(files, path, special);
                }}
            />
        </Modal>
    );
};
