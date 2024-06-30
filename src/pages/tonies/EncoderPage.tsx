import { FolderOpenOutlined } from "@ant-design/icons";
import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext, PointerSensor, useSensor } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { TreeSelectProps, UploadProps } from "antd";
import { Button, Divider, Input, Space, TreeSelect, Upload, message } from "antd";
import { useState } from "react";
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

const rootTreeNode = { id: "1", pId: "-1", value: "1", title: "/" };

export const EncoderPage = () => {
    const { t } = useTranslation();

    const [fileList, setFileList] = useState<MyUploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [tafFilename, setTafFilename] = useState("");
    const [treeNodeId, setTreeNodeId] = useState<string>(rootTreeNode.id);
    const [treeData, setTreeData] = useState<Omit<DefaultOptionType, "label">[]>([rootTreeNode]);

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
        setFileList(newFileList as MyUploadFile[]);
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
            await new Promise((resolve, reject) => upload(resolve, reject, formData, fileList, file));
        }

        const currentUnixTime = Math.floor(Date.now() / 1000);
        const queryParams = {
            name: tafFilename + ".taf",
            audioId: currentUnixTime - 0x50000000,
            path: pathFromNodeId(treeNodeId),
            special: "library",
        };

        const queryString = createQueryString(queryParams);
        const response = await fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/pcmUpload?${queryString}`, {
            method: "POST",
            body: formData,
        });

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
            fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/fileIndexV2?path=${newPath}&special=library`)
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

    return (
        <>
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
                            <SortableContext items={fileList.map((i) => i.uid)} strategy={verticalListSortingStrategy}>
                                <Upload {...props}>
                                    <Button icon={<FolderOpenOutlined />} disabled={uploading}>
                                        {t("tonies.encoder.uploadFiles")}
                                    </Button>
                                </Upload>
                            </SortableContext>
                        </DndContext>
                        {fileList.length > 0 ? (
                            <>
                                <Divider />
                                <Space
                                    direction="vertical"
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-end",
                                    }}
                                >
                                    <Space.Compact
                                        direction="horizontal"
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-end",
                                        }}
                                    >
                                        <Input type="text" disabled value={t("tonies.encoder.saveAs")}></Input>
                                        <TreeSelect
                                            treeLine
                                            treeDataSimpleMode
                                            style={{ width: "100%" }}
                                            value={treeNodeId}
                                            dropdownStyle={{
                                                maxHeight: 400,
                                                overflow: "auto",
                                            }}
                                            onChange={setTreeNodeId}
                                            loadData={onLoadTreeData}
                                            treeData={treeData}
                                        />
                                        <Input
                                            addonAfter=".taf"
                                            required
                                            status={fileList.length > 0 && tafFilename === "" ? "error" : ""}
                                            onChange={(event) => setTafFilename(event.target.value)}
                                            disabled={uploading}
                                        />
                                    </Space.Compact>
                                    <Button
                                        type="primary"
                                        onClick={handleUpload}
                                        disabled={fileList.length === 0 || tafFilename === ""}
                                        loading={uploading}
                                    >
                                        {uploading ? t("tonies.encoder.uploading") : t("tonies.encoder.upload")}
                                    </Button>
                                </Space>
                            </>
                        ) : (
                            <></>
                        )}
                    </Space>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
