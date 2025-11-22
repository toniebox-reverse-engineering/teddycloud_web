import React from "react";
import { Button, Divider, Form, Input, Modal, Space, Switch, Tooltip, TreeSelect, Upload, theme } from "antd";
import { useTranslation } from "react-i18next";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { FolderAddOutlined, InboxOutlined } from "@ant-design/icons";
import { DndContext } from "@dnd-kit/core";
import { MAX_FILES } from "../../../constants";
import { MyUploadFile } from "../../../utils/encoder";
import { DraggableUploadListItem } from "../common/DraggableUploadListItem";
import { useEncoder } from "./hooks/useEncoder";

const { useToken } = theme;

export const Encoder: React.FC = () => {
    const { t } = useTranslation();
    const { token } = useToken();

    const {
        // state
        fileList,
        uploading,
        processing,
        tafFilename,
        hasInvalidChars,
        useFrontendEncoding,
        useFrontendEncodingSetting,
        treeNodeId,
        treeData,
        isCreateDirectoryModalOpen,
        inputValueCreateDirectory,
        hasNewDirectoryInvalidChars,
        inputRef,

        // actions
        setTreeNodeId,
        setUseFrontendEncoding,
        sortFileListAlphabetically,
        clearFileList,
        openCreateDirectoryModal,
        closeCreateDirectoryModal,
        handleCreateDirectoryInputChange,
        handleFileNameInputChange,
        createDirectory,
        handleUpload,
        handleWasmUpload,

        // dnd / upload
        sensor,
        onDragEnd,
        uploadProps,
        onRemoveUpload,
        onLoadTreeData,
        pathFromNodeId,

        // helpers
        invalidCharactersAsString,
    } = useEncoder();

    const createDirectoryModal = (
        <Modal
            title={t("fileBrowser.createDirectory.modalTitle")}
            open={isCreateDirectoryModalOpen}
            onCancel={closeCreateDirectoryModal}
            onOk={createDirectory}
            okText={t("fileBrowser.createDirectory.create")}
            cancelText={t("fileBrowser.createDirectory.cancel")}
            okButtonProps={{ disabled: hasNewDirectoryInvalidChars }}
        >
            <p>
                {t("fileBrowser.createDirectory.inDirectory")} <b>{pathFromNodeId(treeNodeId)}/</b>
            </p>
            <Form.Item
                validateStatus={hasNewDirectoryInvalidChars ? "error" : ""}
                help={
                    hasNewDirectoryInvalidChars
                        ? t("inputValidator.invalidCharactersDetected", { invalidChar: invalidCharactersAsString })
                        : ""
                }
                required
            >
                <Input
                    ref={inputRef}
                    autoFocus
                    placeholder={t("fileBrowser.createDirectory.placeholder")}
                    value={inputValueCreateDirectory}
                    status={hasNewDirectoryInvalidChars ? "error" : ""}
                    onChange={handleCreateDirectoryInputChange}
                />
            </Form.Item>
        </Modal>
    );

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
                            direction="horizontal"
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
                            <Space direction="vertical" style={{ width: "100%" }}>
                                <Space.Compact
                                    direction="horizontal"
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "flex-end",
                                        justifyContent: "flex-end",
                                    }}
                                >
                                    <Input
                                        type="text"
                                        style={{
                                            maxWidth: 180,
                                            borderTopRightRadius: 0,
                                            borderBottomRightRadius: 0,
                                        }}
                                        disabled
                                        value={t("tonies.encoder.saveAs")}
                                    />
                                    <TreeSelect
                                        treeLine
                                        treeDataSimpleMode
                                        disabled={uploading}
                                        style={{ maxWidth: 250 }}
                                        value={treeNodeId}
                                        styles={{
                                            popup: {
                                                root: {
                                                    maxHeight: 400,
                                                    overflow: "auto",
                                                },
                                            },
                                        }}
                                        onChange={setTreeNodeId}
                                        loadData={onLoadTreeData}
                                        treeData={treeData}
                                    />
                                    <Tooltip title={t("fileBrowser.createDirectory.createDirectory")}>
                                        <Button
                                            disabled={uploading}
                                            icon={<FolderAddOutlined />}
                                            onClick={openCreateDirectoryModal}
                                            style={{ borderRadius: 0 }}
                                        />
                                    </Tooltip>
                                    <Input
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
                                        disabled={uploading}
                                    />
                                </Space.Compact>

                                {hasInvalidChars && (
                                    <div style={{ textAlign: "end", color: token.colorErrorText }}>
                                        {t("inputValidator.invalidCharactersDetected", {
                                            invalidChar: invalidCharactersAsString,
                                        })}
                                    </div>
                                )}

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
                                    />
                                    <Button
                                        type="primary"
                                        onClick={useFrontendEncoding ? handleWasmUpload : handleUpload}
                                        disabled={fileList.length === 0 || tafFilename === "" || hasInvalidChars}
                                        loading={uploading}
                                    >
                                        {uploading
                                            ? processing
                                                ? t("tonies.encoder.processing")
                                                : t("tonies.encoder.uploading")
                                            : t("tonies.encoder.upload")}
                                    </Button>
                                </div>
                            </Space>
                        </div>
                    </>
                ) : null}
            </Space>

            {createDirectoryModal}
        </>
    );
};
