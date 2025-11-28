import { useState } from "react";

import { FileObject } from "../../../../types/fileBrowserTypes";
import { generateUUID } from "../../../../utils/ids/generateUUID";

export interface UseSelectFilesOptions {
    onConfirm: (files: FileObject[]) => void;
    selectableFileTypes?: string[];
}

export interface UseSelectFilesResult {
    // State
    isOpen: boolean;
    browserKey: number;
    selectedNewFiles: FileObject[];

    // Actions
    openModal: () => void;
    closeModal: () => void;
    handleFileSelectChange: (files: any[], path: string, special: string) => void;
    handleCancel: () => void;
    handleOk: () => void;
}

export const useSelectFiles = ({ onConfirm, selectableFileTypes }: UseSelectFilesOptions): UseSelectFilesResult => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [selectedNewFiles, setSelectedNewFiles] = useState<FileObject[]>([]);
    const [browserKey, setBrowserKey] = useState<number>(0);

    const openModal = () => {
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    const handleFileSelectChange = (selectedFiles: any[], path: string, special: string) => {
        const newFiles: FileObject[] = [];

        if (selectedFiles?.length > 0) {
            for (const selectedFile of selectedFiles) {
                const name: string | undefined = selectedFile?.name;
                if (!name) continue;

                const isAllowedExtension =
                    !selectableFileTypes || selectableFileTypes.some((ext) => name.toLowerCase().endsWith(ext));

                if (!isAllowedExtension) {
                    continue;
                }

                newFiles.push({
                    uid: generateUUID(),
                    name,
                    path,
                });
            }
        }

        setSelectedNewFiles(newFiles);
    };

    const handleCancel = () => {
        setSelectedNewFiles([]);
        closeModal();
    };

    const handleOk = () => {
        if (selectedNewFiles.length > 0) {
            onConfirm(selectedNewFiles);
        }
        setBrowserKey((prev) => prev + 1);
        setSelectedNewFiles([]);
        closeModal();
    };

    return {
        isOpen,
        browserKey,
        selectedNewFiles,
        openModal,
        closeModal,
        handleFileSelectChange,
        handleCancel,
        handleOk,
    };
};
