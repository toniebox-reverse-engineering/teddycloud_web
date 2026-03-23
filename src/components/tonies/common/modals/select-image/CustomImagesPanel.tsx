import React, { useCallback, useRef } from "react";
import { FolderAddOutlined, InboxOutlined } from "@ant-design/icons";
import { Button, Upload } from "antd";
import type { UploadProps } from "antd";
import { useTranslation } from "react-i18next";

import { IMAGE_EXTENSIONS } from "../../../../../constants/fileTypes";
import { SelectFileFileBrowser } from "../../../filebrowser/SelectFileFileBrowser";
import CreateDirectoryModal from "../CreateDirectoryModal";
import { toCustomImgWebPath } from "../../utils/imagePathUtils";

type UploadDraggerHandle = React.ComponentRef<typeof Upload.Dragger>;

function clickUploadFileInput(draggerRef: React.RefObject<UploadDraggerHandle | null>) {
    const root = draggerRef.current && "upload" in draggerRef.current ? (draggerRef.current as { upload?: unknown }).upload : undefined;
    const ajax =
        root && typeof root === "object" && root !== null && "uploader" in root
            ? (root as { uploader?: { fileInput?: HTMLInputElement | null } }).uploader
            : undefined;
    ajax?.fileInput?.click();
}

interface CustomImagesPanelProps {
    allowMultiple: boolean;
    customPath: string;
    rebuildTrigger: number;
    active: boolean;
    tableScrollY: number;
    uploadDraggerProps: UploadProps;
    isCreateDirectoryModalOpen: boolean;
    createDirectoryPath: string;
    createDirectoryInputKey: number;
    hasNewDirectoryInvalidChars: boolean;
    isCreateDirectoryButtonDisabled: boolean;
    inputCreateDirectoryRef: React.RefObject<any>;
    handleCreateDirectoryInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    closeCreateDirectoryModal: () => void;
    createDirectory: () => void;
    openCreateDirectoryModal: (path: string) => void;
    onCustomSelect: (paths: string[], path: string) => void;
    onCustomDoubleClick: (path: string, fileName: string) => void;
    onImagePreview: (imageUrl: string) => void;
    onCustomImgDropFiles: (files: FileList) => void;
}

export const CustomImagesPanel: React.FC<CustomImagesPanelProps> = ({
    allowMultiple,
    customPath,
    rebuildTrigger,
    active,
    tableScrollY,
    uploadDraggerProps,
    isCreateDirectoryModalOpen,
    createDirectoryPath,
    createDirectoryInputKey,
    hasNewDirectoryInvalidChars,
    isCreateDirectoryButtonDisabled,
    inputCreateDirectoryRef,
    handleCreateDirectoryInputChange,
    closeCreateDirectoryModal,
    createDirectory,
    openCreateDirectoryModal,
    onCustomSelect,
    onCustomDoubleClick,
    onImagePreview,
    onCustomImgDropFiles,
}) => {
    const { t } = useTranslation();
    const uploadDraggerRef = useRef<UploadDraggerHandle | null>(null);
    const openUploadDialog = useCallback(() => clickUploadFileInput(uploadDraggerRef), []);

    return (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", minHeight: 0 }}>
            {isCreateDirectoryModalOpen && (
                <CreateDirectoryModal
                    open={isCreateDirectoryModalOpen}
                    createDirectoryPath={createDirectoryPath}
                    createDirectoryInputKey={createDirectoryInputKey}
                    hasNewDirectoryInvalidChars={hasNewDirectoryInvalidChars}
                    isCreateDirectoryButtonDisabled={isCreateDirectoryButtonDisabled}
                    inputRef={inputCreateDirectoryRef}
                    onInputChange={handleCreateDirectoryInputChange}
                    onClose={closeCreateDirectoryModal}
                    onCreate={createDirectory}
                />
            )}
            <SelectFileFileBrowser
                key={`custom-picker-${rebuildTrigger}`}
                special="custom_img"
                initialPath={customPath}
                filetypeFilter={IMAGE_EXTENSIONS}
                trackUrl={false}
                active={active}
                tableScrollY={tableScrollY}
                maxSelectedRows={allowMultiple ? 0 : 1}
                onImagePreview={onImagePreview}
                customImgTableDropZone={{
                    uploadDraggerProps,
                    uploadDraggerRef,
                    onDropFiles: onCustomImgDropFiles,
                }}
                pathActions={
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Button
                            size="small"
                            icon={<InboxOutlined />}
                            title={t("fileBrowser.upload.uploadHint")}
                            onClick={openUploadDialog}
                        >
                            {t("fileBrowser.upload.upload")}
                        </Button>
                        <Button
                            icon={<FolderAddOutlined />}
                            size="small"
                            onClick={() => openCreateDirectoryModal(customPath)}
                        >
                            {t("fileBrowser.createDirectory.createDirectory")}
                        </Button>
                    </div>
                }
                showColumns={["picture", "name", "size", "date", "controls"]}
                onFileSelectChange={(files, path) => {
                    const paths = files.filter((f) => !f.isDir).map((f) => toCustomImgWebPath(path, f.name));
                    onCustomSelect(paths, path);
                }}
                onFileDoubleClick={(file, path) => {
                    if (allowMultiple || file?.isDir) return;
                    onCustomDoubleClick(path, file.name);
                }}
            />
        </div>
    );
};

export default CustomImagesPanel;
