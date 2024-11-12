import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Form, Input, Button, Col, Row, Tooltip, Alert } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

import { TonieCardProps } from "../../types/tonieTypes";

import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import CodeSnippet from "../utils/CodeSnippet";
import { useTeddyCloud } from "../../TeddyCloudContext";

const api = new TeddyCloudApi(defaultAPIConfig());

interface ToniesCustomJsonEditorProps {
    open: boolean;
    onClose: () => void;
    setValue?: (value: any) => void;
    props?: any;
    tonieCardProps?: TonieCardProps;
    audioId?: number;
    hash?: string;
}

export const ToniesCustomJsonEditor: React.FC<ToniesCustomJsonEditorProps> = ({
    open,
    onClose,
    setValue,
    props,
    tonieCardProps,
    audioId,
    hash,
}) => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();
    const [form] = Form.useForm();

    useEffect(() => {
        if (open) {
            resetForm();
        }
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

        // remove that if the API is available
        setJsonData(values);
        setJsonViewerModalOpened(true);

        /*
        try {
            await api.apiPostTeddyCloudRaw("/api/doSomething", JSON.stringify(values), undefined, undefined, {
                "Content-Type": "application/json",
            });

            // if called from article search, we write back the article number
            if (values.article && setValue) {
                // todo call tonies api reload
                // then set article value
                setValue(values.article);
                props.onChange(values.article);
            }

            resetForm();
            addNotification(
                NotificationTypeEnum.Success,
                t("tonies.addNewCustomTonieModal.successfullyCreated"),
                t("tonies.addNewCustomTonieModal.successfullyCreatedDetails", { series: values.series, model: values.model }),
                t("tonies.addToniesCustomJsonEntry")
            );
            onClose();
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.addNewCustomTonieModal.failedToCreate"),
                t("tonies.addNewCustomTonieModal.failedToCreateDetails", { series: values.series, model: values.model }) + error,
                t("tonies.addToniesCustomJsonEntry")
            );
        }
        */
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
        <Button type="primary" onClick={() => handleJsonViewerModalClose()}>
            {t("tonies.informationModal.ok")}
        </Button>
    );

    const handleJsonViewerModalClose = () => {
        setJsonViewerModalOpened(false);
        handleCancel();
    };

    const jsonViewerModal = (
        <Modal
            footer={jsonViewerModalFooter}
            width={1000}
            title={"File (you can copy the content to the tonies.custom.json)"}
            open={jsonViewerModalOpened}
            onCancel={handleJsonViewerModalClose}
        >
            {jsonData ? (
                <>
                    <CodeSnippet key="json-readable" language="json" code={JSON.stringify(jsonData, null, 2)} />
                    <div style={{ margin: "16px 0 8px 0" }}>Minimized json:</div>
                    <CodeSnippet
                        key="json-minimized"
                        language="json"
                        showLineNumbers={false}
                        code={JSON.stringify(jsonData, null, 0)}
                    />
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
                <Alert
                    type="info"
                    showIcon={true}
                    message="Work in progress - be aware!"
                    description="Currently, only the generated json fragment is displayed when saving the new model. This is not automatically inserted into the tonies.custom.json. You have to copy this into the file yourself."
                    style={{ marginBottom: 8 }}
                />
                <Form form={form} layout="vertical" onFinish={handleFinish}>
                    <Row gutter={[16, 0]}>
                        <Col span={24}>
                            <Row gutter={[16, 0]}>
                                <Col span={8}>
                                    <Form.Item
                                        key="series"
                                        label={[
                                            t("tonies.addNewCustomTonieModal.series"),
                                            <Tooltip
                                                key="series-tooltip"
                                                title={t("tonies.addNewCustomTonieModal.seriesHint")}
                                            >
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
                                        key="episodes"
                                        label={[
                                            t("tonies.addNewCustomTonieModal.episode"),
                                            <Tooltip
                                                key="episodes-tooltip"
                                                title={t("tonies.addNewCustomTonieModal.episodeHint")}
                                            >
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
                                        key="language"
                                        label={[
                                            t("tonies.addNewCustomTonieModal.language"),
                                            <Tooltip
                                                key="language-tooltip"
                                                title={t("tonies.addNewCustomTonieModal.languageHint")}
                                            >
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
                                        key="model"
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
                                    <Form.Item key="pic" label={t("tonies.addNewCustomTonieModal.pic")} name="pic">
                                        <Input style={{ width: "100%" }} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Row gutter={[16, 0]}>
                                <Col span={8}>
                                    <Form.Item key="no" label={t("tonies.addNewCustomTonieModal.no")} name="no">
                                        <Input style={{ width: "100%" }} />
                                    </Form.Item>
                                </Col>
                                <Col span={16}>
                                    <Form.Item
                                        key="title"
                                        label={[
                                            t("tonies.addNewCustomTonieModal.formfieldTitle"),
                                            <Tooltip
                                                key="title-tooltip"
                                                title={t("tonies.addNewCustomTonieModal.formfieldTitleHint")}
                                            >
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
                                    <Form.Item
                                        key="release"
                                        label={t("tonies.addNewCustomTonieModal.release")}
                                        name="release"
                                    >
                                        <Input style={{ width: "100%" }} />
                                    </Form.Item>
                                </Col>
                                <Col span={16}>
                                    <Form.Item
                                        key="category"
                                        label={t("tonies.addNewCustomTonieModal.category")}
                                        name="category"
                                    >
                                        <Input style={{ width: "100%" }} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Row gutter={[16, 0]}>
                                <Col span={24}>
                                    <Form.List key="audio-id-hash-list" name="audio_id">
                                        {(fields, { add, remove }) => (
                                            <>
                                                {fields.map(({ key, name, ...restField }, index) => (
                                                    <Row key={`audio-id-hash-row-${key}`} gutter={[16, 0]}>
                                                        <Col span={8}>
                                                            <Form.Item
                                                                {...restField}
                                                                key={`audio-id-${key}`}
                                                                name={[name, "audio_id"]}
                                                                label={
                                                                    <div key={`audio-id-label-${key}`}>
                                                                        {index === 0
                                                                            ? t("tonies.addNewCustomTonieModal.audioId")
                                                                            : ""}
                                                                    </div>
                                                                }
                                                            >
                                                                <Input style={{ width: "100%" }} />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={16}>
                                                            <Form.Item
                                                                {...restField}
                                                                key={`hash-${key}`}
                                                                name={[name, "hash"]}
                                                                label={
                                                                    <div key={`hash-label-${key}`}>
                                                                        {index === 0
                                                                            ? t("tonies.addNewCustomTonieModal.hash")
                                                                            : ""}
                                                                    </div>
                                                                }
                                                            >
                                                                <Input
                                                                    style={{ width: "100%" }}
                                                                    addonAfter={
                                                                        <Button
                                                                            key={`audio-id-hash-remove-${key}`}
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
                                                <Form.Item key="add-audio-id-hash">
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
                            <Form.List key="track-list" name="tracks">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }, index) => (
                                            <Row key={`track-row-${key}`} gutter={[16, 0]}>
                                                <Col span={24}>
                                                    <Form.Item
                                                        {...restField}
                                                        key={`track-${key}`}
                                                        name={[name, "track"]}
                                                        label={
                                                            <div key={`track-label-${key}`}>
                                                                {index === 0
                                                                    ? t("tonies.addNewCustomTonieModal.track")
                                                                    : ""}
                                                            </div>
                                                        }
                                                    >
                                                        <Input
                                                            key={"input-track-" + key}
                                                            style={{ width: "100%" }}
                                                            addonAfter={
                                                                <Button
                                                                    key={`track-remove-${key}`}
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
                                        <Form.Item key="add-track">
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
