import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Space } from "antd";
import { CloseOutlined, FolderOpenOutlined, MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { FileBrowser } from "./FileBrowser";

export interface FileItem {
    filepath: string;
    name: string;
}

export interface FormValues {
    type: string;
    audio_id: number;
    filepath: string;
    name: string;
    files: FileItem[];
}

export interface TonieAudioPlaylistEditorProps {
    open: boolean;
    initialValuesJson?: string;
    onCreate: (values: FormValues) => void;
    onCancel: () => void;
}

const TonieAudioPlaylistEditor: React.FC<TonieAudioPlaylistEditorProps> = ({
    open,
    initialValuesJson,
    onCreate,
    onCancel,
}) => {
    const { t } = useTranslation();
    const [form] = Form.useForm<FormValues>();
    const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
    const [isSelectFileModalOpen, setSelectFileModalOpen] = useState(false);
    const [filebrowserKey, setFilebrowserKey] = useState(0);
    const [selectedFileIndex, setSelectedFileIndex] = useState<number>(-1);

    useEffect(() => {
        setSelectedFiles([]);
    }, []);

    useEffect(() => {
        // Set initial values when initialValuesJson prop changes
        if (initialValuesJson) {
            try {
                const initialValues = JSON.parse(initialValuesJson);
                form.setFieldsValue(initialValues);
            } catch (error) {
                console.error("Error parsing JSON:", error);
            }
        }
    }, [form, initialValuesJson]);

    const resetForm = () => {
        form.resetFields();
    };

    const handleSourceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        form.setFieldsValue({ filepath: e.target.value });
    };

    const handleFileSelectChange = (files: any[], path: string, special: string) => {
        if (files && files.length > 0) {
            const prefix = special === "library" ? "lib:/" : "content:/";
            const newFiles = files.map((file) => ({
                filepath: prefix + path + "/" + file.name,
                name: file.name,
            }));
            setSelectedFiles(newFiles);
        }
    };

    const showFileSelectModal = () => {
        setFilebrowserKey((prevKey) => prevKey + 1);
        setSelectFileModalOpen(true);
    };

    const handleEditFile = (index: number) => {
        setFilebrowserKey((prevKey) => prevKey + 1);
        setSelectFileModalOpen(true);
        setSelectedFileIndex(index); // Store the index of the selected file
        setSelectedFiles([form.getFieldValue(["files", index])]);
    };

    const handleOkSelectFile = () => {
        const currentValues = form.getFieldsValue() as FormValues;
        let updatedFiles = [...currentValues.files];

        if (selectedFileIndex !== -1) {
            // Replace existing file
            updatedFiles[selectedFileIndex] = {
                filepath: selectedFiles[0].filepath,
                name: selectedFiles[0].name,
            };
        } else {
            // Add new file
            updatedFiles = [...currentValues.files, ...selectedFiles];
        }

        const updatedValues = {
            ...currentValues,
            files: updatedFiles,
        };

        form.setFieldsValue(updatedValues);

        setSelectFileModalOpen(false);
        setSelectedFiles([]);
        setSelectedFileIndex(-1); // Reset selected file index
    };

    const handleCancelSelectFile = () => {
        setSelectFileModalOpen(false);
        setSelectedFiles([]);
    };

    return (
        <Modal
            open={open}
            title={initialValuesJson ? t("tonies.tapEditor.titleEdit") : t("tonies.tapEditor.titleCreate")}
            okText={initialValuesJson ? t("tonies.tapEditor.save") : t("tonies.tapEditor.create")}
            cancelText={t("tonies.tapEditor.cancel")}
            onCancel={() => {
                onCancel();
                resetForm();
            }}
            onOk={() => {
                form.validateFields()
                    .then(() => {
                        onCreate(form.getFieldsValue() as FormValues);
                        resetForm();
                    })
                    .catch((info) => {
                        console.log("Validate Failed:", info);
                    });
            }}
        >
            <Form
                form={form}
                layout="vertical"
                name="tapEditorModal"
                initialValues={{
                    type: "tap",
                    filepath: "",
                    name: "",
                    files: [],
                }}
            >
                <Form.Item name="audio_id" label="Audio ID">
                    <Input type="number" />
                </Form.Item>
                <Form.Item name="filepath" label={t("tonies.tapEditor.filePath")}>
                    <Input onChange={handleSourceInputChange} />
                </Form.Item>
                <Form.Item
                    name="name"
                    label={t("tonies.tapEditor.name")}
                    rules={[{ required: true, message: t("tonies.tapEditor.nameRequired") }]}
                >
                    <Input />
                </Form.Item>

                <Form.List name="files">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name }, index) => (
                                <div className="playlistTitle">
                                    <Space
                                        key={key}
                                        style={{
                                            display: "flex",
                                            marginBottom: 8,
                                            alignItems: "center",
                                            width: "100%",
                                        }}
                                        align="baseline"
                                    >
                                        <Form.Item
                                            name={[name, "filepath"]}
                                            label={t("tonies.tapEditor.filePathContentFile")}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("tonies.tapEditor.filePathContentFileRequired"),
                                                },
                                            ]}
                                        >
                                            <Input
                                                width="auto"
                                                addonBefore={
                                                    <CloseOutlined
                                                        onClick={() => {
                                                            const newValues = [...form.getFieldsValue().files];
                                                            newValues[index].filepath = "";
                                                            form.setFieldsValue({ files: newValues });
                                                        }}
                                                    />
                                                }
                                                addonAfter={
                                                    <FolderOpenOutlined onClick={() => handleEditFile(index)} />
                                                }
                                            />
                                        </Form.Item>
                                        <Form.Item
                                            name={[name, "name"]}
                                            label={t("tonies.tapEditor.fileNameContentFile")}
                                        >
                                            <Input placeholder="Name" />
                                        </Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)} />
                                    </Space>
                                </div>
                            ))}
                            <Form.Item>
                                <Button
                                    type="dashed"
                                    onClick={() => showFileSelectModal()}
                                    block
                                    icon={<PlusOutlined />}
                                >
                                    {t("tonies.tapEditor.addFile")}
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
            </Form>
            <Modal
                title={t("tonies.selectFileModal.selectFile")}
                open={isSelectFileModalOpen}
                onOk={handleOkSelectFile}
                onCancel={handleCancelSelectFile}
                width="auto"
            >
                <FileBrowser
                    maxSelectedRows={99}
                    special="library"
                    trackUrl={false}
                    selectTafOnly={false}
                    key={filebrowserKey}
                    onFileSelectChange={handleFileSelectChange}
                />
            </Modal>
        </Modal>
    );
};

export default TonieAudioPlaylistEditor;
