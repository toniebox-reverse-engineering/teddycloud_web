import React, { useEffect } from "react";
import { Modal, Form, Input, Button, Col, Row, message } from "antd";
import { TonieCardProps } from "./TonieCard";
import { useTranslation } from "react-i18next";

interface ToniesCustomJsonEditorProps {
    visible: boolean;
    setValue?: (value: any) => void;
    onClose: () => void;
    props: any;
    tonieCardProps?: TonieCardProps;
    audioId?: number;
    hash?: string;
}

const ToniesCustomJsonEditor: React.FC<ToniesCustomJsonEditorProps> = ({ visible, setValue, onClose, props, tonieCardProps, audioId, hash }) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();

    useEffect(() => {
        resetForm();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (tonieCardProps) {
            // to do prefill form
            form.setFieldsValue({ series: tonieCardProps.tonieInfo.series });
            form.setFieldsValue({ episode: tonieCardProps.tonieInfo.episode });
            form.setFieldsValue({ article: tonieCardProps.tonieInfo.model });
            form.setFieldsValue({ language: tonieCardProps.tonieInfo.language });
            form.setFieldsValue({ image: tonieCardProps.tonieInfo.picture });
            form.setFieldsValue({ article: tonieCardProps.tonieInfo.model });
            form.setFieldsValue({ "tracks-desc": tonieCardProps.tonieInfo.tracks });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form]);

    const handleFinish = async (values: any) => {
        if (values["track-desc"]) {
            values["track-desc"] = values["track-desc"]
                .filter((track: { track: string }) => track.track && track.track.trim())
                .map((track: { track: string }) => track.track);
        }
        if (values.ids) {
            values.ids = values.ids.filter((ids: { "audio-id": string, hash: string }) => ids["audio-id"] && ids["audio-id"].trim() && ids.hash && ids.hash.trim());
        }
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
    }
    const resetForm = () => {
        form.resetFields();
        form.setFieldsValue({
            ids: [{ "audio-id": audioId ? audioId : '', "hash": hash ? hash : '' }],
            "track-desc": [{ "track": '' }],
        });
    }

    return (
        <Modal
            title={t("tonies.addNewCustomTonieModal.title")}
            open={visible}
            onCancel={handleCancel}
            onOk={handleOk}
            okText={t("tonies.addNewCustomTonieModal.save")}
            width={Math.max(window.innerWidth * 0.75, 500)}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Row gutter={[16, 0]}>
                    <Col span={24}>
                        <Row gutter={[16, 0]}>
                            <Col span={8}>
                                <Form.Item label={t("tonies.addNewCustomTonieModal.series")} name="series" required>
                                    <Input style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={10}>
                                <Form.Item label={t("tonies.addNewCustomTonieModal.episode")} name="episode">
                                    <Input style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item label={t("tonies.addNewCustomTonieModal.language")} name="language">
                                    <Input style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        <Row gutter={[16, 0]}>
                            <Col span={8}>
                                <Form.Item label={t("tonies.addNewCustomTonieModal.model")} name="article">
                                    <Input style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={16}>
                                <Form.Item label={t("tonies.addNewCustomTonieModal.pic")} name="image">
                                    <Input style={{ width: '100%' }} />
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
                                                            name={[name, 'audio-id']}
                                                            label={index === 0 ? t("tonies.addNewCustomTonieModal.audioId") : ''}
                                                        >
                                                            <Input style={{ width: '100%' }} />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={16}>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'hash']}
                                                            label={index === 0 ? t("tonies.addNewCustomTonieModal.hash") : ''}
                                                        >
                                                            <Input style={{ width: '100%' }} addonAfter={<Button
                                                                type="link"
                                                                onClick={() => remove(name)}
                                                                style={{ height: "auto", margin: -2 }}
                                                            >
                                                                {t("tonies.addNewCustomTonieModal.remove")}
                                                            </Button>} />
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
                                                    name={[name, 'track']}
                                                    label={index === 0 ? t("tonies.addNewCustomTonieModal.track") : ''}
                                                >
                                                    <Input style={{ width: '100%' }} addonAfter={<Button
                                                        type="link"
                                                        onClick={() => remove(name)}
                                                        style={{ height: "auto", margin: -2 }}
                                                    >
                                                        {t("tonies.addNewCustomTonieModal.remove")}
                                                    </Button>} />
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
    );
};

export default ToniesCustomJsonEditor;
