import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Divider, Input, Space, TreeSelect, Upload, Modal, Tooltip, Form, theme } from "antd";
import type { InputRef, TreeSelectProps, UploadProps } from "antd";
import { DefaultOptionType } from "antd/es/select";
import { FolderAddOutlined, InboxOutlined } from "@ant-design/icons";
import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext, PointerSensor, useSensor } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { DraggableUploadListItem } from "../../components/utils/DraggableUploadListItem";
import { MyUploadFile, upload } from "../../utils/encoder";
import { invalidCharactersAsString, isInputValid } from "../../utils/fieldInputValidator";
import { createQueryString } from "../../utils/url";
import { MAX_FILES } from "../../constants";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

const { useToken } = theme;

const rootTreeNode = { id: "1", pId: "-1", value: "1", title: "/" };

export const EncoderPage = () => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();

    const [debugPCMObjects, setDebugPCMObjects] = useState(false);
    const [fileList, setFileList] = useState<MyUploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [tafFilename, setTafFilename] = useState("");
    const [treeNodeId, setTreeNodeId] = useState<string>(rootTreeNode.id);
    const [treeData, setTreeData] = useState<Omit<DefaultOptionType, "label">[]>([rootTreeNode]);
    const [isCreateDirectoryModalOpen, setCreateDirectoryModalOpen] = useState(false);
    const [inputValueCreateDirectory, setInputValueCreateDirectory] = useState("");
    const [hasInvalidChars, setHasInvalidChars] = useState(false);
    const [hasNewDirectoryInvalidChars, setHasNewDirectoryInvalidChars] = useState(false);
    const inputRef = useRef<InputRef>(null);
    let uploadedFiles = 0;

    useEffect(() => {
        const fetchDebugPCM = async () => {
            const api = new TeddyCloudApi(defaultAPIConfig());
            let logPCMURLObject = false;
            try {
                const response = await api.apiGetTeddyCloudSettingRaw("debug.web.pcm_encode_console_url");
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                logPCMURLObject = data.toString() === "true";
            } catch (error) {
                console.error("Error fetching debug.web.pcm_encode_console_url: ", error);
            }
            setDebugPCMObjects(logPCMURLObject);
        };
        fetchDebugPCM();

        const preLoadTreeData = async () => {
            const newPath = pathFromNodeId(rootTreeNode.id);

            // Simulate an API call to fetch children
            api.apiGetTeddyCloudApiRaw(`/api/fileIndexV2?path=${newPath}&special=library`)
                .then((response) => response.json())
                .then((data) => {
                    var list: any[] = data.files;
                    list = list
                        .filter((entry) => entry.isDir && entry.name !== "..")
                        .sort((a, b) => {
                            return a.name === b.name ? 0 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
                        })
                        .map((entry) => {
                            return {
                                id: rootTreeNode.id + "." + list.indexOf(entry),
                                pId: rootTreeNode.id,
                                value: rootTreeNode.id + "." + list.indexOf(entry),
                                title: entry.name,
                            };
                        });
                    setTreeData(treeData.concat(list));
                });
        };
        preLoadTreeData();
    }, []);

    useEffect(() => {
        if (isCreateDirectoryModalOpen) {
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 0);
        }
    }, [isCreateDirectoryModalOpen]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        uploadedFiles = fileList.length;
    }, [fileList]);

    const sensor = useSensor(PointerSensor, {
        activationConstraint: { distance: 10 },
    });

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (active.id !== over?.id) {
            setFileList((prev) => {
                const activeIndex = prev.findIndex((i) => i.uid === active.id);
                const overIndex = prev.findIndex((i) => i.uid === over?.id);
                return arrayMove(prev, activeIndex, overIndex);
            });
        }
    };

    const onChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
        uploadedFiles++;
        if (uploadedFiles > MAX_FILES) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.encoder.tooManyFilesError"),
                t("tonies.encoder.maxFiles", {
                    maxFiles: MAX_FILES,
                }),
                t("tonies.title")
            );
        }
        const updatedFileList = newFileList.slice(0, MAX_FILES) as MyUploadFile[];
        if (updatedFileList.length === 1 && tafFilename === "") {
            const singleFile = updatedFileList[0];
            const fileNameWithoutExtension = singleFile.name.replace(/\.[^/.]+$/, ""); // Remove file extension
            setTafFilename(fileNameWithoutExtension);
        }
        setFileList(updatedFileList);
    };

    const onRemove = (file: MyUploadFile) => {
        const index = fileList.indexOf(file);
        const newFileList = fileList.slice();
        newFileList.splice(index, 1);
        setFileList(newFileList);
    };

    const handleUpload = async () => {
        setUploading(true);
        const formData = new FormData();
        const key = "encoding-" + tafFilename + ".taf";
        addLoadingNotification(key, t("tonies.encoder.uploading"), t("tonies.encoder.uploading"));
        for (const file of fileList) {
            addLoadingNotification(
                key,
                t("tonies.encoder.uploading"),
                t("tonies.encoder.uploadingDetails", { file: file.name })
            );
            try {
                await new Promise((resolve, reject) =>
                    upload(resolve, reject, formData, fileList, file, debugPCMObjects)
                );
            } catch (error) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("tonies.encoder.processingError"),
                    t("tonies.encoder.errorFileProcessing") + error,
                    t("tonies.title")
                );
                closeLoadingNotification(key);
                setUploading(false);
                return;
            }
        }
        const currentUnixTime = Math.floor(Date.now() / 1000);
        const queryParams = {
            name: tafFilename + ".taf",
            audioId: currentUnixTime - 0x50000000,
            path: pathFromNodeId(treeNodeId),
            special: "library",
        };
        setProcessing(true);
        const queryString = createQueryString(queryParams);

        try {
            addLoadingNotification(
                key,
                t("tonies.encoder.processing"),
                t("tonies.encoder.processingDetails", { file: tafFilename + ".taf" })
            );
            const response = await api.apiPostTeddyCloudFormDataRaw(`/api/pcmUpload?${queryString}`, formData);
            closeLoadingNotification(key);
            if (response.ok) {
                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonies.encoder.uploadSuccessful"),
                    t("tonies.encoder.uploadSuccessfulDetails", { file: tafFilename + ".taf" }),
                    t("tonies.title")
                );
                setFileList([]);
                setTafFilename("");
            } else {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("tonies.encoder.uploadFailed"),
                    t("tonies.encoder.uploadFailedDetails") + response.statusText,
                    t("tonies.title")
                );
            }
            setProcessing(false);
            setUploading(false);
        } catch (err) {
            closeLoadingNotification(key);
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.encoder.uploadFailed"),
                t("tonies.encoder.uploadFailedDetails") + err,
                t("tonies.title")
            );
            setProcessing(false);
            setUploading(false);
        }
    };

    const props: UploadProps = {
        listType: "picture",
        multiple: true,
        beforeUpload: (file) => {
            const myFile: MyUploadFile = file;
            myFile.file = file;
            fileList.push(myFile);
            setFileList(fileList);

            return false;
        },
        fileList,
        onChange: onChange,
        itemRender: (originNode, file) => (
            <DraggableUploadListItem
                originNode={originNode}
                fileList={fileList}
                file={file}
                onRemove={onRemove}
                disabled={uploading}
            />
        ),
    };

    const onLoadTreeData: TreeSelectProps["loadData"] = ({ id }) =>
        new Promise((resolve, reject) => {
            const newPath = pathFromNodeId(id);
            api.apiGetTeddyCloudApiRaw(`/api/fileIndexV2?path=${newPath}&special=library`)
                .then((response) => response.json())
                .then((data) => {
                    let list: any[] = data.files;
                    list = list
                        .filter((entry) => entry.isDir && entry.name !== "..")
                        .sort((a, b) => {
                            return a.name === b.name ? 0 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
                        })
                        .map((entry) => {
                            return {
                                id: id + "." + list.indexOf(entry),
                                pId: id,
                                value: id + "." + list.indexOf(entry),
                                title: entry.name,
                            };
                        });
                    setTreeData(treeData.concat(list));
                    resolve(true);
                })
                .then(() => {
                    reject();
                });
        });

    const pathFromNodeId = (nodeId: string): string => {
        const node = treeData.filter((entry) => entry.value === nodeId)[0];
        if (node.pId === "-1") return "";
        return pathFromNodeId(treeData.filter((entry) => entry.id === node.pId)[0].id) + "/" + node.title;
    };

    const sortFileListAlphabetically = () => {
        setFileList((prev) => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
    };

    const clearFileList = () => {
        setFileList([]);
    };

    const openCreateDirectoryModal = () => {
        setCreateDirectoryModalOpen(true);
    };

    const handleCreateDirectoryInputChange = (e: { target: { value: React.SetStateAction<string> } }) => {
        setHasNewDirectoryInvalidChars(!isInputValid(e.target.value.toString()));
        setInputValueCreateDirectory(e.target.value);
    };

    const createDirectory = () => {
        const path = pathFromNodeId(treeNodeId);
        const newNodeId = `${treeNodeId}.${treeData.length}`; // Generate a unique ID for the new node
        const newDir = {
            id: newNodeId,
            pId: treeNodeId,
            value: newNodeId,
            title: inputValueCreateDirectory,
        };
        try {
            api.apiPostTeddyCloudRaw(`/api/dirCreate?special=library`, path + "/" + inputValueCreateDirectory)
                .then((response) => {
                    return response.text();
                })
                .then((text) => {
                    if (text !== "OK") {
                        throw new Error(text);
                    }
                    // Update the tree data and select the new directory
                    setTreeData(
                        [...treeData, newDir].sort((a, b) => {
                            return a.title === b.title ? 0 : a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1;
                        })
                    );
                    setTreeNodeId(newNodeId);
                    addNotification(
                        NotificationTypeEnum.Success,
                        t("fileBrowser.createDirectory.directoryCreated"),
                        t("fileBrowser.createDirectory.directoryCreatedDetails", {
                            directory: path + "/" + inputValueCreateDirectory,
                        }),
                        t("fileBrowser.title")
                    );
                    setCreateDirectoryModalOpen(false);
                    setInputValueCreateDirectory("");
                })
                .catch((error) => {
                    addNotification(
                        NotificationTypeEnum.Error,
                        t("fileBrowser.createDirectory.directoryCreateFailed"),
                        t("fileBrowser.createDirectory.directoryCreateFailedDetails", {
                            directory: path + "/" + inputValueCreateDirectory,
                        }) + error,
                        t("fileBrowser.title")
                    );
                });
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("fileBrowser.createDirectory.directoryCreateFailed"),
                t("fileBrowser.createDirectory.directoryCreateFailedDetails", {
                    directory: path + "/" + inputValueCreateDirectory,
                }) + error,
                t("fileBrowser.title")
            );
        }
    };

    const closeCreateDirectoryModal = () => {
        setCreateDirectoryModalOpen(false);
        setInputValueCreateDirectory("");
        setHasNewDirectoryInvalidChars(false);
    };

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
                    autoFocus={true}
                    placeholder={t("fileBrowser.createDirectory.placeholder")}
                    value={inputValueCreateDirectory}
                    status={hasNewDirectoryInvalidChars ? "error" : ""}
                    onChange={handleCreateDirectoryInputChange}
                />
            </Form.Item>
        </Modal>
    );
    const handleFileNameInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setHasInvalidChars(!isInputValid(value));
        setTafFilename(value);
    };

    return (
        <>
            <StyledSider>
                <ToniesSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <ToniesSubNav />
                </HiddenDesktop>
                <BreadcrumbWrapper
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("tonies.navigationTitle") },
                        { title: t("tonies.encoder.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("tonies.encoder.title")}</h1>
                    <Space direction="vertical" style={{ display: "flex" }}>
                        <DndContext sensors={[sensor]} onDragEnd={onDragEnd}>
                            <SortableContext
                                items={fileList.map((i) => i.uid)}
                                strategy={verticalListSortingStrategy}
                                disabled={uploading}
                            >
                                <Upload.Dragger {...props} disabled={uploading}>
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
                                            ></Input>
                                            <TreeSelect
                                                treeLine
                                                treeDataSimpleMode
                                                disabled={uploading}
                                                style={{
                                                    maxWidth: 250,
                                                }}
                                                value={treeNodeId}
                                                dropdownStyle={{
                                                    maxHeight: 400,
                                                    overflow: "auto",
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
                                                ></Button>
                                            </Tooltip>
                                            <Input
                                                addonAfter=".taf"
                                                required
                                                defaultValue={tafFilename}
                                                style={{
                                                    maxWidth: 300,
                                                }}
                                                status={
                                                    (fileList.length > 0 && tafFilename === "") || hasInvalidChars
                                                        ? "error"
                                                        : ""
                                                }
                                                onChange={handleFileNameInputChange}
                                                disabled={uploading}
                                            />
                                        </Space.Compact>
                                        {hasInvalidChars ? (
                                            <div style={{ textAlign: "end", color: token.colorErrorText }}>
                                                {t("inputValidator.invalidCharactersDetected", {
                                                    invalidChar: invalidCharactersAsString,
                                                })}
                                            </div>
                                        ) : (
                                            ""
                                        )}
                                        <Space.Compact
                                            style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}
                                        >
                                            <Button
                                                type="primary"
                                                onClick={handleUpload}
                                                disabled={
                                                    fileList.length === 0 || tafFilename === "" || hasInvalidChars
                                                }
                                                loading={uploading}
                                            >
                                                {uploading
                                                    ? processing
                                                        ? t("tonies.encoder.processing")
                                                        : t("tonies.encoder.uploading")
                                                    : t("tonies.encoder.upload")}
                                            </Button>
                                        </Space.Compact>
                                    </Space>
                                </div>
                            </>
                        ) : (
                            <></>
                        )}
                    </Space>
                </StyledContent>
            </StyledLayout>
            {createDirectoryModal}
        </>
    );
};
