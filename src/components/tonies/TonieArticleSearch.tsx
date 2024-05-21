import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Col, Form, Input, Modal, Row, Select, Tooltip, message } from "antd";
import type { SelectProps } from "antd";
import { TonieInfo } from "./TonieCard";

export const TonieArticleSearch: React.FC<{
    placeholder: string;
    onChange: (newValue: string) => void;
}> = (props) => {
    const { t } = useTranslation();
    // this is actually needed that the search works
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [messageApi, contextHolder] = message.useMessage();
    const [data, setData] = useState<SelectProps["options"]>([]);
    const [value, setValue] = useState<string>();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [tonieInfos, setTonieInfos] = useState<TonieInfo[]>();
    const [showAddCustomTonieModal, setShowAddCustomTonieModal] = useState<boolean>(false);
    const [form] = Form.useForm();

    // Initialize the form with at least one empty field for each Form.List
    useEffect(() => {
        form.setFieldsValue({
            ids: [{ "audio-id": '', "hash": '' }],
            tracks: [{ "track": '' }],
        });
    }, [form]);

    const handleSearch = async (search: string) => {
        const searchEncode = encodeURIComponent(search);
        const url =
            process.env.REACT_APP_TEDDYCLOUD_API_URL +
            "/api/toniesJsonSearch?" +
            "searchModel=" +
            searchEncode +
            "&searchSeries=" +
            searchEncode +
            "&searchEpisode=" +
            searchEncode;
        try {
            const response = await fetch(url, {});
            if (!response.ok) {
                throw new Error(response.status + " " + response.statusText);
            }
            const data = await response.json();
            setTonieInfos(data);
            const result = data.map((item: TonieInfo) => ({
                value: item.model,
                text: "[" + item.model + "] " + item.series + " - " + item.episode,
            }));
            setData(result);
        } catch (error) {
            message.error(t("tonieArticleSearch.failedToFetchSearchResults") + error);
            return;
        }
    };

    const handleChange = (newValue: string) => {
        setValue(newValue);
        props.onChange(newValue);
    };

    const handleAddNewCustomButtonClick = () => {
        setShowAddCustomTonieModal(true);
    };

    const handleAddCustomTonieModalCancel = () => {
        resetForm();
        setShowAddCustomTonieModal(false);
    }

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

            if (values.article) {
                // call tonies api reload
                // then set article value
                setValue(values.article);
                props.onChange(values.article);
            }

            resetForm();
            message.success(t("tonies.addNewCustomTonieModal.successfullyCreated"));
            setShowAddCustomTonieModal(false);

        } catch (error) {
            message.error(t("tonies.addNewCustomTonieModal.failedToCreate") + error);
        }
    };

    const resetForm = () => {
        form.resetFields();
        form.setFieldsValue({
            ids: [{ "audio-id": '', "hash": '' }],
            tracks: [{ "track": '' }],
        });
    }

    const handleOk = () => {
        form.submit();
    };

    const addCustomTonieModal = (
        <Modal title={t("tonies.addNewCustomTonieModal.title")} open={showAddCustomTonieModal} onCancel={handleAddCustomTonieModalCancel} onOk={handleOk} okText={t("tonies.addNewCustomTonieModal.save")} width={Math.max(window.innerWidth * 0.75, 500)}>
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Row gutter={[16, 0]}>
                    <Col span={24}>
                        <Row gutter={[16, 0]}>
                            <Col span={10}>
                                <Form.Item label={t("tonies.addNewCustomTonieModal.series")} name="series" required>
                                    <Input style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={10}>
                                <Form.Item label={t("tonies.addNewCustomTonieModal.episode")} name="episode">
                                    <Input style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item label={t("tonies.addNewCustomTonieModal.language")} name="language">
                                    <Input style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        <Row gutter={[16, 0]}>
                            <Col span={6}>
                                <Form.Item label={t("tonies.addNewCustomTonieModal.model")} name="article">
                                    <Input style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={18}>
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
                                                    <Col span={6}>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'audio-id']}
                                                            label={index === 0 ? t("tonies.addNewCustomTonieModal.audioId") : ''}
                                                        >
                                                            <Input style={{ width: '100%' }} />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={18}>
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
        </Modal>);

    return (
        <>
            <Select
                showSearch
                value={value}
                placeholder={props.placeholder}
                defaultActiveFirstOption={false}
                suffixIcon={null}
                filterOption={false}
                onSearch={handleSearch}
                onChange={handleChange}
                notFoundContent={null}
                options={(data || []).map((d) => ({
                    value: d.value,
                    label: d.text,
                }))}
            />
            {addCustomTonieModal}
            <Tooltip title={t("tonies.addNewCustomTonieHint")}>
                <Button
                    onClick={handleAddNewCustomButtonClick}
                    style={{ marginTop: 8 }}
                >
                    {t("tonies.addNewCustomTonie")}
                </Button>
            </Tooltip>
        </>
    );
};
