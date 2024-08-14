import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Space, Alert, theme } from "antd";
import { CloseOutlined, FolderOpenOutlined, MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { FileBrowser } from "../utils/FileBrowser";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

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

const { useToken } = theme;

const TonieAudioPlaylistEditor: React.FC<TonieAudioPlaylistEditorProps> = ({
    open,
    initialValuesJson,
    onCreate,
    onCancel,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
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
        setSelectedFileIndex(index);
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

    // just for now, can be removed later when API is available
    const [jsonData, setJsonData] = useState<string>("");
    const [jsonDataMinimized, setJsonDataMinimized] = useState<string>("");
    const [jsonViewerModalOpened, setJsonViewerModalOpened] = useState(false);

    const jsonViewerModalFooter = (
        <Button type="primary" onClick={() => setJsonViewerModalOpened(false)}>
            {t("tonies.informationModal.ok")}
        </Button>
    );

    const handleJsonViewerModalClose = () => {
        setJsonViewerModalOpened(false);
    };

    function detectColorScheme() {
        const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const storedTheme = localStorage.getItem("theme");

        if (storedTheme === "auto") {
            return prefersDarkMode ? "dark" : "light";
        } else {
            return storedTheme;
        }
    }

    const jsonViewerModal = (
        <Modal
            footer={jsonViewerModalFooter}
            width={700}
            title={"File (you can copy the content to a *.tap file)"}
            open={jsonViewerModalOpened}
            onCancel={handleJsonViewerModalClose}
        >
            {jsonData ? (
                <>
                    <SyntaxHighlighter
                        language="json"
                        style={detectColorScheme() === "dark" ? oneDark : oneLight}
                        customStyle={{
                            padding: 0,
                            borderRadius: 0,
                            margin: 0,
                            border: "none",
                        }}
                    >
                        {jsonData}
                    </SyntaxHighlighter>
                    <div style={{ margin: "16px 0 8px 0" }}>Minimized json:</div>
                    <SyntaxHighlighter
                        language="json"
                        style={detectColorScheme() === "dark" ? oneDark : oneLight}
                        customStyle={{
                            padding: 0,
                            borderRadius: 0,
                            margin: 0,
                            border: "none",
                        }}
                    >
                        {jsonDataMinimized}
                    </SyntaxHighlighter>
                </>
            ) : (
                "Loading..."
            )}
        </Modal>
    );
    // end removal json viewer

    const selectModalFooter = (
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
            <Button onClick={handleCancelSelectFile}>{t("tonies.selectFileModal.cancel")}</Button>
            <Button type="primary" onClick={handleOkSelectFile}>
                {t("tonies.selectFileModal.ok")}
            </Button>
        </div>
    );

    return (
        <>
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
                            //remove that if the API is available
                            setJsonData(JSON.stringify(form.getFieldsValue(), null, 2));
                            setJsonDataMinimized(JSON.stringify(form.getFieldsValue(), null, 0));
                            setJsonViewerModalOpened(true);
                            resetForm();
                        })
                        .catch((info) => {
                            console.log("Validate Failed:", info);
                        });
                }}
            >
                <Alert
                    type="info"
                    showIcon={true}
                    message="Work in progress - be aware!"
                    description="Currently, only the generated json is displayed when saving the new tap. This is not automatically saved to your library. You have to create a *.tap file manually and copy this into the file yourself."
                    style={{ marginBottom: 8 }}
                />
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
                    <Form.Item name="type" hidden label="type">
                        <Input type="string" />
                    </Form.Item>
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
                                    <div key={`files-${key}`} className="playlistTitle">
                                        <Space
                                            key={`space-${key}`}
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
                    className="sticky-footer"
                    title={t("tonies.selectFileModal.selectFile")}
                    open={isSelectFileModalOpen}
                    onOk={handleOkSelectFile}
                    onCancel={handleCancelSelectFile}
                    width="auto"
                    footer={selectModalFooter}
                >
                    <FileBrowser
                        maxSelectedRows={99}
                        special="library"
                        trackUrl={false}
                        selectTafOrTapOnly={false}
                        key={filebrowserKey}
                        onFileSelectChange={handleFileSelectChange}
                    />
                </Modal>
            </Modal>
            {/* remove next line later when API is available */}
            {jsonViewerModal}
        </>
    );
};

export default TonieAudioPlaylistEditor;
