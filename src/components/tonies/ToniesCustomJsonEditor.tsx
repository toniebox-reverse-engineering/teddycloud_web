import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Col, Row, message, Tooltip } from "antd";
import { TonieCardProps } from "./TonieCard";
import { useTranslation } from "react-i18next";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { InfoCircleOutlined } from "@ant-design/icons";

interface ToniesCustomJsonEditorProps {
    open: boolean;
    onClose: () => void;
    setValue?: (value: any) => void;
    props?: any;
    tonieCardProps?: TonieCardProps;
    audioId?: number;
    hash?: string;
}

const ToniesCustomJsonEditor: React.FC<ToniesCustomJsonEditorProps> = ({
    open,
    onClose,
    setValue,
    props,
    tonieCardProps,
    audioId,
    hash,
}) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();

    useEffect(() => {
        resetForm();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (open && tonieCardProps) {
            // to do prefill form
            form.setFieldsValue({
                series: tonieCardProps.tonieInfo.series,
                episodes: tonieCardProps.tonieInfo.episode,
                model: tonieCardProps.tonieInfo.model,
                language: tonieCardProps.tonieInfo.language,
                pic: tonieCardProps.tonieInfo.picture,
                tracks: tonieCardProps.tonieInfo.tracks,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, tonieCardProps, form]);

    const handleFinish = async (values: any) => {
        if (values["tracks"]) {
            values["tracks"] = values["tracks"]
                .filter((track: { track: string }) => track.track && track.track.trim())
                .map((track: { track: string }) => track.track);
        }
        if (values.audio_id) {
            values.audio_id = values.audio_id.filter(
                (audio_id: { audio_id: string; hash: string }) =>
                    audio_id["audio_id"] && audio_id["audio_id"].trim() && audio_id.hash && audio_id.hash.trim()
            );

            const audio_id = values.audio_id.map((item: { audio_id: string }) => item.audio_id);
            const hash = values.audio_id.map((item: { hash: string }) => item.hash);

            values = {
                no: values.no,
                model: values.model,
                audio_id: audio_id,
                hash: hash,
                title: values.title,
                series: values.series,
                episodes: values.episodes,
                tracks: values.tracks,
                release: values.release,
                language: values.language,
                category: values.category,
                pic: values.pic,
            };
        }

        //remove that if the API is available
        setJsonData(values);
        setJsonViewerModalOpened(true);

        const url = `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/doSomething/`;
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });
            if (!response.ok) {
                throw new Error(response.status + " " + response.statusText);
            }

            // if called from article search, we write back the article number
            if (values.article && setValue) {
                // todo call tonies api reload
                // then set article value
                setValue(values.article);
                props.onChange(values.article);
            }

            resetForm();
            message.success(t("tonies.addNewCustomTonieModal.successfullyCreated"));
            onClose();
        } catch (error) {
            message.error(t("tonies.addNewCustomTonieModal.failedToCreate") + error);
        }
    };

    const handleOk = () => {
        form.submit();
    };

    const handleCancel = () => {
        resetForm();
        onClose();
    };
    const resetForm = () => {
        form.resetFields();
        form.setFieldsValue({
            audio_id: [{ audio_id: audioId ? audioId : "", hash: hash ? hash : "" }],
            tracks: [{ track: "" }],
        });
    };

    // just for now, can be removed later when API is available
    const [jsonData, setJsonData] = useState<string>("");
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
            title={"File (you can copy the content to the tonies.custom.json)"}
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
                        {JSON.stringify(jsonData, null, 2)}
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
                        {JSON.stringify(jsonData, null, 0)}
                    </SyntaxHighlighter>
                </>
            ) : (
                "Loading..."
            )}
        </Modal>
    );
    // end removal json viewer

    return (
        <>
            <Modal
                title={t("tonies.addNewCustomTonieModal.title")}
                open={open}
                onCancel={handleCancel}
                onOk={handleOk}
                okText={t("tonies.addNewCustomTonieModal.save")}
                width={Math.max(Math.min(window.innerWidth * 0.75, 800), 500)}
            >
                <Form form={form} layout="vertical" onFinish={handleFinish}>
                    <Row gutter={[16, 0]}>
                        <Col span={24}>
                            <Row gutter={[16, 0]}>
                                <Col span={8}>
                                    <Form.Item
                                        label={[
                                            t("tonies.addNewCustomTonieModal.series"),
                                            <Tooltip title={t("tonies.addNewCustomTonieModal.seriesHint")}>
                                                <InfoCircleOutlined style={{ marginLeft: 2 }} />
                                            </Tooltip>,
                                        ]}
                                        name="series"
                                        rules={[
                                            {
                                                required: true,
                                                message: t("tonies.addNewCustomTonieModal.seriesRequired"),
                                            },
                                        ]}
                                    >
                                        <Input style={{ width: "100%" }} />
                                    </Form.Item>
                                </Col>
                                <Col span={10}>
                                    <Form.Item
                                        label={[
                                            t("tonies.addNewCustomTonieModal.episode"),
                                            <Tooltip title={t("tonies.addNewCustomTonieModal.episodeHint")}>
                                                <InfoCircleOutlined style={{ marginLeft: 2 }} />
                                            </Tooltip>,
                                        ]}
                                        name="episodes"
                                    >
                                        <Input style={{ width: "100%" }} />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item
                                        label={[
                                            t("tonies.addNewCustomTonieModal.language"),
                                            <Tooltip title={t("tonies.addNewCustomTonieModal.languageHint")}>
                                                <InfoCircleOutlined style={{ marginLeft: 2 }} />
                                            </Tooltip>,
                                        ]}
                                        name="language"
                                    >
                                        <Input style={{ width: "100%" }} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Row gutter={[16, 0]}>
                                <Col span={8}>
                                    <Form.Item
                                        label={t("tonies.addNewCustomTonieModal.model")}
                                        name="model"
                                        rules={[
                                            {
                                                required: true,
                                                message: t("tonies.addNewCustomTonieModal.modelRequired"),
                                            },
                                        ]}
                                    >
                                        <Input style={{ width: "100%" }} />
                                    </Form.Item>
                                </Col>
                                <Col span={16}>
                                    <Form.Item label={t("tonies.addNewCustomTonieModal.pic")} name="pic">
                                        <Input style={{ width: "100%" }} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Row gutter={[16, 0]}>
                                <Col span={8}>
                                    <Form.Item label={t("tonies.addNewCustomTonieModal.no")} name="no">
                                        <Input style={{ width: "100%" }} />
                                    </Form.Item>
                                </Col>
                                <Col span={16}>
                                    <Form.Item
                                        label={[
                                            t("tonies.addNewCustomTonieModal.formfieldTitle"),
                                            <Tooltip title={t("tonies.addNewCustomTonieModal.formfieldTitleHint")}>
                                                <InfoCircleOutlined style={{ marginLeft: 2 }} />
                                            </Tooltip>,
                                        ]}
                                        name="title"
                                    >
                                        <Input style={{ width: "100%" }} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Row gutter={[16, 0]}>
                                <Col span={8}>
                                    <Form.Item label={t("tonies.addNewCustomTonieModal.release")} name="release">
                                        <Input style={{ width: "100%" }} />
                                    </Form.Item>
                                </Col>
                                <Col span={16}>
                                    <Form.Item label={t("tonies.addNewCustomTonieModal.category")} name="category">
                                        <Input style={{ width: "100%" }} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Row gutter={[16, 0]}>
                                <Col span={24}>
                                    <Form.List name="audio_id">
                                        {(fields, { add, remove }) => (
                                            <>
                                                {fields.map(({ key, name, ...restField }, index) => (
                                                    <Row key={key} gutter={[16, 0]}>
                                                        <Col span={8}>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, "audio_id"]}
                                                                label={
                                                                    index === 0
                                                                        ? t("tonies.addNewCustomTonieModal.audioId")
                                                                        : ""
                                                                }
                                                            >
                                                                <Input style={{ width: "100%" }} />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={16}>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, "hash"]}
                                                                label={
                                                                    index === 0
                                                                        ? t("tonies.addNewCustomTonieModal.hash")
                                                                        : ""
                                                                }
                                                            >
                                                                <Input
                                                                    style={{ width: "100%" }}
                                                                    addonAfter={
                                                                        <Button
                                                                            type="link"
                                                                            onClick={() => remove(name)}
                                                                            style={{ height: "auto", margin: -2 }}
                                                                        >
                                                                            {t("tonies.addNewCustomTonieModal.remove")}
                                                                        </Button>
                                                                    }
                                                                />
                                                            </Form.Item>
                                                        </Col>
                                                    </Row>
                                                ))}
                                                <Form.Item>
                                                    <Button type="dashed" onClick={() => add()} block>
                                                        {t("tonies.addNewCustomTonieModal.addAudioIdHash")}
                                                    </Button>
                                                </Form.Item>
                                            </>
                                        )}
                                    </Form.List>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Form.List name="tracks">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }, index) => (
                                            <Row key={key} gutter={[16, 0]}>
                                                <Col span={24}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, "track"]}
                                                        label={
                                                            index === 0 ? t("tonies.addNewCustomTonieModal.track") : ""
                                                        }
                                                    >
                                                        <Input
                                                            style={{ width: "100%" }}
                                                            addonAfter={
                                                                <Button
                                                                    type="link"
                                                                    onClick={() => remove(name)}
                                                                    style={{ height: "auto", margin: -2 }}
                                                                >
                                                                    {t("tonies.addNewCustomTonieModal.remove")}
                                                                </Button>
                                                            }
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add()} block>
                                                {t("tonies.addNewCustomTonieModal.addTrack")}
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </Col>
                    </Row>
                </Form>
            </Modal>
            {/* remove next line later when API is available */}
            {jsonViewerModal}
        </>
    );
};

export default ToniesCustomJsonEditor;
