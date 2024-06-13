import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Col, Row, message, Tooltip } from "antd";
import { TonieCardProps } from "./TonieCard";
import { useTranslation } from "react-i18next";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { InfoCircleOutlined, ToolFilled } from "@ant-design/icons";

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
                episode: tonieCardProps.tonieInfo.episode,
                article: tonieCardProps.tonieInfo.model,
                language: tonieCardProps.tonieInfo.language,
                image: tonieCardProps.tonieInfo.picture,
                "tracks-desc": tonieCardProps.tonieInfo.tracks,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, tonieCardProps, form]);

    const handleFinish = async (values: any) => {
        if (values["track-desc"]) {
            values["track-desc"] = values["track-desc"]
                .filter((track: { track: string }) => track.track && track.track.trim())
                .map((track: { track: string }) => track.track);
        }
        if (values.ids) {
            values.ids = values.ids.filter(
                (ids: { "audio-id": string; hash: string }) =>
                    ids["audio-id"] && ids["audio-id"].trim() && ids.hash && ids.hash.trim()
            );
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
            ids: [{ "audio-id": audioId ? audioId : "", hash: hash ? hash : "" }],
            "track-desc": [{ track: "" }],
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
                                        name="episode"
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
                                        name="article"
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
                                    <Form.Item label={t("tonies.addNewCustomTonieModal.pic")} name="image">
                                        <Input style={{ width: "100%" }} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Row gutter={[16, 0]}>
                                <Col span={24}>
                                    <Form.List name="ids">
                                        {(fields, { add, remove }) => (
                                            <>
                                                {fields.map(({ key, name, ...restField }, index) => (
                                                    <Row key={key} gutter={[16, 0]}>
                                                        <Col span={8}>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, "audio-id"]}
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
                            <Form.List name="track-desc">
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
