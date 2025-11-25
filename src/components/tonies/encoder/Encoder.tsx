import React from "react";
import { Button, Divider, Input, Space, Switch, Tooltip, Upload, theme } from "antd";
import { useTranslation } from "react-i18next";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { FolderAddOutlined, InboxOutlined } from "@ant-design/icons";
import { DndContext } from "@dnd-kit/core";
import { MAX_FILES } from "../../../constants/numbers";
import { MyUploadFile } from "../../../utils/audio/audioEncoder";
import { DraggableUploadListItem } from "../common/elements/DraggableUploadListItem";
import CreateDirectoryModal from "../common/modals/CreateDirectoryModal";
import { useEncoder } from "./hooks/useEncoder";
import { DirectoryTreeSelect } from "../common/elements/DirectoryTreeSelect";

const { useToken } = theme;

export const Encoder: React.FC = () => {
    const { t } = useTranslation();
    const { token } = useToken();

    const {
        fileList,
        uploading,
        processing,
        tafFilename,
        hasInvalidChars,
        useFrontendEncoding,
        useFrontendEncodingSetting,
        isCreateDirectoryModalOpen,
        createDirectoryPath,

        // Actions
        setUseFrontendEncoding,
        sortFileListAlphabetically,
        clearFileList,
        openCreateDirectoryModal,
        closeCreateDirectoryModal,
        setCreateDirectoryPath,
        handleFileNameInputChange,
        handleUpload,
        handleWasmUpload,

        // DnD / Upload
        sensor,
        onDragEnd,
        uploadProps,
        onRemoveUpload,

        // Directory tree
        directoryTree,

        // CreateDirectory / Encoder
        setRebuildList,

        // Helper
        invalidCharactersAsString,
    } = useEncoder();

    return (
        <>
            <Space direction="vertical" style={{ display: "flex" }}>
                <DndContext sensors={[sensor]} onDragEnd={onDragEnd}>
                    <SortableContext
                        items={fileList.map((i) => i.uid)}
                        strategy={verticalListSortingStrategy}
                        disabled={uploading}
                    >
                        <Upload.Dragger
                            {...uploadProps}
                            disabled={uploading}
                            itemRender={(originNode, file) => (
                                <DraggableUploadListItem
                                    originNode={originNode}
                                    fileList={fileList}
                                    file={file as MyUploadFile}
                                    onRemove={onRemoveUpload}
                                    disabled={uploading}
                                />
                            )}
                        >
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">
                                {t("tonies.encoder.uploadText", {
                                    maxFiles: MAX_FILES,
                                })}
                            </p>
                            <p className="ant-upload-hint">{t("tonies.encoder.uploadHint")}</p>
                        </Upload.Dragger>
                    </SortableContext>
                </DndContext>

                {fileList.length > 0 ? (
                    <>
                        <Space
                            orientation="horizontal"
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "flex-start",
                                flexWrap: "wrap",
                            }}
                        >
                            <Button type="default" disabled={uploading} onClick={sortFileListAlphabetically}>
                                {t("tonies.encoder.sortAlphabetically")}
                            </Button>
                            <Button
                                type="default"
                                disabled={uploading}
                                style={{ marginRight: 16 }}
                                onClick={clearFileList}
                            >
                                {t("tonies.encoder.clearList")}
                            </Button>
                        </Space>
                        <Divider />
                        <div style={{ width: "100%" }} className="encoder">
                            <Space orientation="vertical" style={{ width: "100%" }}>
                                <Space.Compact
                                    className="encoder-save-compact"
                                    orientation="horizontal"
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "flex-end",
                                        justifyContent: "flex-end",
                                    }}
                                >
                                    <Input
                                        type="text"
                                        className="encoder-save-label"
                                        style={{
                                            maxWidth: 180,
                                            borderTopRightRadius: 0,
                                            borderBottomRightRadius: 0,
                                        }}
                                        disabled
                                        value={t("tonies.encoder.saveAs")}
                                    />

                                    <DirectoryTreeSelect
                                        className="encoder-save-dir"
                                        directoryTree={directoryTree}
                                        disabled={processing || uploading}
                                        placeholder={t("fileBrowser.moveFile.destinationPlaceholder")}
                                    />

                                    <Tooltip title={t("fileBrowser.createDirectory.createDirectory")}>
                                        <Button
                                            className="encoder-save-btn"
                                            disabled={uploading || processing}
                                            icon={<FolderAddOutlined />}
                                            onClick={openCreateDirectoryModal}
                                            style={{ borderRadius: 0 }}
                                        />
                                    </Tooltip>

                                    <Input
                                        className="encoder-save-name"
                                        suffix=".taf"
                                        required
                                        value={tafFilename}
                                        style={{ maxWidth: 300 }}
                                        status={
                                            (fileList.length > 0 && tafFilename === "") || hasInvalidChars
                                                ? "error"
                                                : ""
                                        }
                                        onChange={handleFileNameInputChange}
                                        disabled={uploading || processing}
                                    />
                                </Space.Compact>
                                {hasInvalidChars ? (
                                    <div style={{ textAlign: "end", color: token.colorErrorText }}>
                                        {t("inputValidator.invalidCharactersDetected", {
                                            invalidChar: invalidCharactersAsString,
                                        })}
                                    </div>
                                ) : null}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "flex-end",
                                        alignItems: "center",
                                        marginTop: 8,
                                        gap: 16,
                                    }}
                                >
                                    <Switch
                                        checkedChildren={t("tonies.encoder.browserSideEncoding")}
                                        unCheckedChildren={t("tonies.encoder.serverSideEncoding")}
                                        defaultChecked={useFrontendEncodingSetting}
                                        checked={useFrontendEncoding}
                                        onChange={setUseFrontendEncoding}
                                        disabled={uploading || processing}
                                    />
                                    <Button
                                        type="primary"
                                        onClick={useFrontendEncoding ? handleWasmUpload : handleUpload}
                                        disabled={fileList.length === 0 || tafFilename === "" || hasInvalidChars}
                                        loading={uploading || processing}
                                    >
                                        {uploading
                                            ? processing
                                                ? t("tonies.encoder.processing")
                                                : t("tonies.encoder.uploading")
                                            : t("tonies.encoder.encode")}
                                    </Button>
                                </div>
                            </Space>
                        </div>
                    </>
                ) : null}
            </Space>

            <CreateDirectoryModal
                open={isCreateDirectoryModalOpen}
                onClose={closeCreateDirectoryModal}
                createDirectoryPath={createDirectoryPath}
                setCreateDirectoryPath={setCreateDirectoryPath}
                path={createDirectoryPath}
                directoryTree={directoryTree}
                selectNewNode={true}
                setRebuildList={setRebuildList}
            />
        </>
    );
};
