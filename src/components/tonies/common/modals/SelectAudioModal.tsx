import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Modal, theme } from "antd";

import { SelectFileFileBrowser } from "../../filebrowser/SelectFileFileBrowser";

const { useToken } = theme;

export interface SelectAudioFileResult {
    path: string;
    audioId?: string;
    hash?: string;
}

/**
 * Select audio files (.taf, .tap) from library (lib://).
 * Used by TonieCard and CustomModelEditor. Kept separate from image selection.
 */
interface SelectAudioModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (result: SelectAudioFileResult) => void;
    keySelectFileFileBrowser: number;
    /** When true, OK is only enabled when file has valid TAF header. For tonies.custom.json. */
    requireTafHeader?: boolean;
    /** Initial path. E.g. lib://path or path. */
    initialPath?: string;
    /** Optional title override */
    title?: string;
}

export const SelectAudioModal: React.FC<SelectAudioModalProps> = ({
    open,
    onClose,
    onSelect,
    keySelectFileFileBrowser,
    requireTafHeader = false,
    initialPath = "",
    title: titleProp,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const [selectedFile, setSelectedFile] = useState<{
        path: string;
        audioId?: string;
        hash?: string;
    } | null>(null);

    useEffect(() => {
        if (open) setSelectedFile(null);
    }, [open]);

    const handleFileSelectChange = (files: any[], path: string, _special: string) => {
        if (files && files.length === 1) {
            const file = files[0];
            const normalizedPath = path === "" || path.endsWith("/") ? path : path + "/";
            const filePath = `lib://${normalizedPath}${file.name}`;

            if (requireTafHeader) {
                const audioIdRaw = file?.tafHeader?.audioId;
                const hashRaw = file?.tafHeader?.sha1Hash;
                if (audioIdRaw != null && hashRaw) {
                    setSelectedFile({
                        path: filePath,
                        audioId: String(audioIdRaw).trim(),
                        hash: String(hashRaw).trim(),
                    });
                } else {
                    setSelectedFile(null);
                }
            } else {
                setSelectedFile({ path: filePath });
            }
        } else {
            setSelectedFile(null);
        }
    };

    const canConfirm = selectedFile && (!requireTafHeader || (selectedFile.audioId != null && selectedFile.hash != null));

    const handleConfirm = () => {
        if (selectedFile && canConfirm) {
            onSelect({
                path: selectedFile.path,
                audioId: selectedFile.audioId,
                hash: selectedFile.hash,
            });
            setSelectedFile(null);
            onClose();
        }
    };

    const handleCancel = () => {
        setSelectedFile(null);
        onClose();
    };

    const defaultTitle = requireTafHeader
        ? t("tonies.customEditor.audio.selectFromLibrary", {
              library: t("tonies.library.title"),
              defaultValue: "Select audio from library",
          })
        : t("tonies.selectFileModal.selectFile");
    const title = titleProp ?? defaultTitle;

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
            <Button type="primary" onClick={handleConfirm} disabled={!canConfirm}>
                {t("tonies.selectFileModal.ok")}
            </Button>
        </div>
    );

    const workingInitialPath =
        initialPath && initialPath.startsWith("lib://")
            ? initialPath.replace(/^lib:\/\//, "").replace(/[^/]+$/, "")
            : initialPath;

    return (
        <Modal
            className="sticky-footer"
            title={title}
            open={open}
            onCancel={handleCancel}
            width="auto"
            footer={footer}
        >
            <SelectFileFileBrowser
                key={keySelectFileFileBrowser}
                initialPath={workingInitialPath}
                special="library"
                maxSelectedRows={1}
                trackUrl={false}
                filetypeFilter={[".taf", ".tap"]}
                onFileSelectChange={handleFileSelectChange}
            />
        </Modal>
    );
};
