import { FolderAddOutlined, InboxOutlined } from "@ant-design/icons";
import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext, PointerSensor, useSensor } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { InputRef, TreeSelectProps, UploadProps } from "antd";
import { Button, Divider, Input, Space, TreeSelect, Upload, message, Modal, Tooltip } from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    HiddenDesktop,
    StyledBreadcrumb,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { DraggableUploadListItem } from "../../components/utils/DraggableUploadListItem";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { MyUploadFile, upload } from "../../utils/encoder";
import { createQueryString } from "../../utils/url";
import { DefaultOptionType } from "antd/es/select";

import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

const rootTreeNode = { id: "1", pId: "-1", value: "1", title: "/" };

const MAX_FILES = 99;

export const EncoderPage = () => {
    const { t } = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();

    const [debugPCMObjects, setDebugPCMObjects] = useState(false);
    const [fileList, setFileList] = useState<MyUploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [tafFilename, setTafFilename] = useState("");
    const [treeNodeId, setTreeNodeId] = useState<string>(rootTreeNode.id);
    const [treeData, setTreeData] = useState<Omit<DefaultOptionType, "label">[]>([rootTreeNode]);
    const [isCreateDirectoryModalOpen, setCreateDirectoryModalOpen] = useState(false);
    const [inputValueCreateDirectory, setInputValueCreateDirectory] = useState("");
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
            messageApi.open({
                type: "error",
                content: t("tonies.encoder.maxFiles", {
                    maxFiles: MAX_FILES,
                }),
            });
        }

        setFileList(newFileList.slice(0, MAX_FILES) as MyUploadFile[]);
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

        for (const file of fileList) {
            await new Promise((resolve, reject) => upload(resolve, reject, formData, fileList, file, debugPCMObjects));
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

        const response = await api.apiPostTeddyCloudFormDataRaw(`/api/pcmUpload?${queryString}`, formData);

        const responseData = await response.text();
        if (response.ok) {
            message.success(t("tonies.encoder.uploadSuccessful"));
            setFileList([]);
            setTafFilename("");
            setTreeData([rootTreeNode]);
            setTreeNodeId(rootTreeNode.id);
        } else {
            console.log("Upload failed:", responseData);
            message.error(t("tonies.encoder.uploadFailed"));
        }
        setProcessing(false);
        setUploading(false);
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
                    var list: any[] = data.files;
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
                    setTreeData([...treeData, newDir]);
                    setTreeNodeId(newNodeId);

                    message.success(t("tonies.createDirectory.directoryCreated"));
                    setCreateDirectoryModalOpen(false);
                    setInputValueCreateDirectory("");
                })
                .catch((error) => {
                    message.error(error.message);
                });
        } catch (error) {
            message.error(`Error while creating directory`);
        }
    };

    const closeCreateDirectoryModal = () => {
        setCreateDirectoryModalOpen(false);
        setInputValueCreateDirectory("");
    };

    const createDirectoryModal = (
        <Modal
            title={t("tonies.createDirectory.modalTitle")}
            open={isCreateDirectoryModalOpen}
            onCancel={closeCreateDirectoryModal}
            onOk={createDirectory}
            okText={t("tonies.createDirectory.create")}
            cancelText={t("tonies.createDirectory.cancel")}
        >
            <p>
                {t("tonies.createDirectory.inDirectory")} <b>{pathFromNodeId(treeNodeId)}/</b>
            </p>
            <Input
                ref={inputRef}
                autoFocus={true}
                placeholder={t("tonies.createDirectory.placeholder")}
                value={inputValueCreateDirectory}
                onChange={handleCreateDirectoryInputChange}
            />
        </Modal>
    );

    return (
        <>
            {contextHolder}
            <StyledSider>
                <ToniesSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <ToniesSubNav />
                </HiddenDesktop>
                <StyledBreadcrumb
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
                                                marginBottom: "16px",
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
                                            <Tooltip title={t("tonies.createDirectory.createDirectory")}>
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
                                                style={{
                                                    maxWidth: 300,
                                                }}
                                                status={fileList.length > 0 && tafFilename === "" ? "error" : ""}
                                                onChange={(event) => setTafFilename(event.target.value)}
                                                disabled={uploading}
                                            />
                                        </Space.Compact>

                                        <Space.Compact style={{ display: "flex", justifyContent: "flex-end" }}>
                                            <Button
                                                type="primary"
                                                onClick={handleUpload}
                                                disabled={fileList.length === 0 || tafFilename === ""}
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
