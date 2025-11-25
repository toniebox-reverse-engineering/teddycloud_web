import React, { useEffect, useRef, useState } from "react";
import { Modal, Button, Tooltip, Space, Divider, Input, InputRef, theme } from "antd";
import { FolderAddOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { DndContext, DragEndEvent, PointerSensor, useSensor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

import { DraggableFileObjectListItem } from "../items/DraggableFileObjectListItem";
import { FileObject } from "../../../../types/fileBrowserTypes";
import {
    INVALID_NAME_CHARS_DISPLAY as invalidCharactersAsString,
    isInputValid,
} from "../../../../utils/validation/fieldInputValidator";
import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { DirectoryTreeApi } from "../../common/hooks/useDirectoryTree";

const api = new TeddyCloudApi(defaultAPIConfig());

const { useToken } = theme;

interface EncodeFilesModalProps {
    open: boolean;
    onClose: () => void;
    modalKey: number;
    special: string;

    encodeFileList: FileObject[];
    setEncodeFileList: React.Dispatch<React.SetStateAction<FileObject[]>>;

    directoryTree: DirectoryTreeApi;
    folderTreeElement: React.ReactNode;

    selectFileModal: React.ReactNode;
    showSelectFileModal: () => void;

    setCreateDirectoryPath: (path: string) => void;
    setFilterFieldAutoFocus: (v: boolean) => void;
    setIsCreateDirectoryModalOpen: (v: boolean) => void;

    setRebuildList: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedRowKeys: React.Dispatch<React.SetStateAction<React.Key[]>>;
}

const EncodeFilesModal: React.FC<EncodeFilesModalProps> = ({
    open,
    onClose,
    modalKey,
    special,
    encodeFileList,
    setEncodeFileList,
    directoryTree,
    folderTreeElement,
    selectFileModal,
    showSelectFileModal,
    setCreateDirectoryPath,
    setFilterFieldAutoFocus,
    setIsCreateDirectoryModalOpen,
    setRebuildList,
    setSelectedRowKeys,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();

    const inputEncodeTafFileNameRef = useRef<InputRef>(null);

    const [processing, setProcessing] = useState<boolean>(false);
    const [hasInvalidChars, setHasInvalidChars] = useState<boolean>(false);
    const [hasError, setHasError] = useState<boolean>(true);
    const [isUnchangedOrEmpty, setIsUnchangedOrEmpty] = useState<boolean>(true);

    const sensor = useSensor(PointerSensor, {
        activationConstraint: { distance: 10 },
    });

    useEffect(() => {
        if (open) {
            setProcessing(false);
            setHasInvalidChars(false);
            setHasError(true);
            setIsUnchangedOrEmpty(true);

            setTimeout(() => {
                inputEncodeTafFileNameRef.current?.focus();
            }, 0);
        }
    }, [open]);

    const handleFileNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value ?? "";
        const inputInvalid = !isInputValid(value.toString());
        const errorDetected = (encodeFileList.length > 0 && !value.toString()) || inputInvalid;
        setHasInvalidChars(inputInvalid);
        setHasError(errorDetected);
        setIsUnchangedOrEmpty(value === "");
    };

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (active.id !== over?.id) {
            setEncodeFileList((prev) => {
                const activeIndex = prev.findIndex((i) => i.uid === active.id);
                const overIndex = prev.findIndex((i) => i.uid === over?.id);
                return arrayMove(prev, activeIndex, overIndex);
            });
        }
    };

    const onRemove = (file: FileObject) => {
        const index = encodeFileList.indexOf(file);
        const newFileList = encodeFileList.slice();
        newFileList.splice(index, 1);
        setEncodeFileList(newFileList);
    };

    const sortFileListAlphabetically = () => {
        setEncodeFileList((prev) => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
    };

    const encodeFiles = async () => {
        setProcessing(true);
        const newTafFilename = inputEncodeTafFileNameRef.current?.input?.value;
        if (!newTafFilename) {
            setProcessing(false);
            return;
        }

        const key = "encoding-" + newTafFilename;
        addLoadingNotification(
            key,
            t("fileBrowser.encodeFiles.encoding"),
            t("fileBrowser.encodeFiles.encodingInProgress")
        );

        const currentNodeId = directoryTree.treeNodeId;
        const basePath = directoryTree.getPathFromNodeId(currentNodeId);
        const target = basePath + "/" + newTafFilename + ".taf";

        const body =
            encodeFileList.map((file) => `source=${encodeURIComponent(file.path + "/" + file.name)}`).join("&") +
            `&target=${encodeURIComponent(target)}`;

        try {
            const response = await api.apiPostTeddyCloudRaw(`/api/fileEncode?special=${special}`, body);
            if (response.ok) {
                closeLoadingNotification(key);
                addNotification(
                    NotificationTypeEnum.Success,
                    t("fileBrowser.encodeFiles.encodingSuccessful"),
                    t("fileBrowser.encodeFiles.encodingSuccessfulDetails", { file: target }),
                    t("fileBrowser.title")
                );
                // Tree auf Root zurücksetzen (wie vorher setTreeNodeId("1"))
                directoryTree.setTreeNodeId(directoryTree.rootTreeNode.id);
                setSelectedRowKeys([]);
                setRebuildList((prev) => !prev);
                onClose();
            } else {
                closeLoadingNotification(key);
                addNotification(
                    NotificationTypeEnum.Error,
                    t("fileBrowser.encodeFiles.encodingFailed"),
                    t("fileBrowser.encodeFiles.encodingFailedDetails", { file: target }).replace(": ", ""),
                    t("fileBrowser.title")
                );
            }
        } catch (err) {
            closeLoadingNotification(key);
            addNotification(
                NotificationTypeEnum.Error,
                t("fileBrowser.encodeFiles.encodingFailed"),
                t("fileBrowser.encodeFiles.encodingFailedDetails", { file: target }) + err,
                t("fileBrowser.title")
            );
        }
        setProcessing(false);
    };

    return (
        <Modal
            title={t("fileBrowser.encodeFiles.modalTitle")}
            key={"encodeModal-" + modalKey}
            open={open}
            onCancel={onClose}
            onOk={encodeFiles}
            okText={t("fileBrowser.encodeFiles.encode")}
            cancelText={t("fileBrowser.encodeFiles.cancel")}
            zIndex={1000}
            width="auto"
            okButtonProps={{
                disabled: processing || hasError || isUnchangedOrEmpty || encodeFileList.length === 0,
            }}
        >
            {selectFileModal}
            <DndContext sensors={[sensor]} onDragEnd={onDragEnd}>
                <SortableContext
                    items={encodeFileList.map((i) => i.uid)}
                    strategy={verticalListSortingStrategy}
                    disabled={processing}
                >
                    <Button disabled={processing} onClick={showSelectFileModal}>
                        {t("fileBrowser.encodeFiles.addFiles")}
                    </Button>
                    {encodeFileList.map((file) => (
                        <DraggableFileObjectListItem
                            key={file.uid}
                            originNode={<div>{file.name}</div>}
                            onRemove={onRemove}
                            disabled={processing}
                            fileObjectList={encodeFileList}
                            file={file}
                        />
                    ))}
                </SortableContext>
            </DndContext>
            <Space direction="vertical" style={{ display: "flex" }}>
                {encodeFileList.length > 0 ? (
                    <>
                        <Space
                            direction="horizontal"
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "flex-start",
                            }}
                        >
                            <Button type="default" disabled={processing} onClick={sortFileListAlphabetically}>
                                {t("tonies.encoder.sortAlphabetically")}
                            </Button>
                        </Space>
                        <Divider />
                        <div style={{ width: "100%" }} className="encoder">
                            <Space orientation="vertical" style={{ width: "100%" }}>
                                <Space.Compact
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
                                        style={{
                                            maxWidth: 180,
                                            borderTopRightRadius: 0,
                                            borderBottomRightRadius: 0,
                                        }}
                                        disabled
                                        value={t("tonies.encoder.saveAs")}
                                    />
                                    {folderTreeElement}
                                    <Tooltip title={t("fileBrowser.createDirectory.createDirectory")}>
                                        <Button
                                            disabled={processing}
                                            icon={<FolderAddOutlined />}
                                            onClick={() => {
                                                const basePath = directoryTree.getPathFromNodeId(
                                                    directoryTree.treeNodeId
                                                );
                                                setCreateDirectoryPath(basePath);
                                                setFilterFieldAutoFocus(false);
                                                setIsCreateDirectoryModalOpen(true);
                                            }}
                                            style={{ borderRadius: 0 }}
                                        />
                                    </Tooltip>
                                    <Input
                                        ref={inputEncodeTafFileNameRef}
                                        suffix=".taf"
                                        required
                                        status={hasError ? "error" : ""}
                                        onChange={handleFileNameInputChange}
                                        disabled={processing}
                                    />
                                </Space.Compact>
                                {hasInvalidChars ? (
                                    <div style={{ textAlign: "end", color: token.colorErrorText }}>
                                        {t("inputValidator.invalidCharactersDetected", {
                                            invalidChar: invalidCharactersAsString,
                                        })}
                                    </div>
                                ) : null}
                            </Space>
                        </div>
                    </>
                ) : null}
            </Space>
        </Modal>
    );
};

export default EncodeFilesModal;
