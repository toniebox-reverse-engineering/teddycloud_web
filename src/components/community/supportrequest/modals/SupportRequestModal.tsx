import React, { useEffect, useMemo } from "react";
import { Modal, Form, Input, Typography, Alert } from "antd";
import { useTranslation } from "react-i18next";
import { SupportRequestFormValues } from "../helper/supportRequestFormatter";
import { useTeddyCloudVersion } from "../../../../hooks/useTeddyCloudVersion";
import CodeSnippet from "../../../common/elements/CodeSnippet";

const { TextArea } = Input;
const { Paragraph } = Typography;

export interface SupportRequestModalProps {
    open: boolean;
    onCancel: () => void;
    onSubmit: (values: SupportRequestFormValues) => void;
}

export const SupportRequestModal: React.FC<SupportRequestModalProps> = ({ open, onCancel, onSubmit }) => {
    const { t } = useTranslation();
    const { version } = useTeddyCloudVersion();
    const [form] = Form.useForm<SupportRequestFormValues>();

    const teddyCloudVersionDisplay = useMemo(() => {
        if (!version) return "";
        return version;
    }, [version]);

    useEffect(() => {
        form.setFieldsValue({
            teddycloudVersion: teddyCloudVersionDisplay,
        });
    }, [form, teddyCloudVersionDisplay]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            onSubmit(values);
            form.resetFields();
        } catch {
            // AntD will show validation errors
        }
    };

    const formItemRequiredRule = [{ required: true, message: t("community.supportRequestGuide.requiredField") }];

    return (
        <Modal
            title={t("community.supportRequestGuide.createSupportRequestFormTitle")}
            open={open}
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            onOk={handleOk}
            okText={t("community.supportRequestGuide.generate")}
            width="90%"
            style={{ maxWidth: 900 }}
        >
            <Paragraph>
                <Paragraph type="secondary">{t("community.supportRequestGuide.intro")}</Paragraph>
                <Alert type="info" description={t("community.supportRequestGuide.englishHint")} />
            </Paragraph>

            <Form<SupportRequestFormValues> form={form} layout="vertical">
                <Form.Item
                    name="subject"
                    label={t("community.supportRequestGuide.subject.label")}
                    rules={formItemRequiredRule}
                >
                    <Input placeholder={t("community.supportRequestGuide.subject.placeholder")} />
                </Form.Item>

                <Form.Item
                    name="description"
                    label={t("community.supportRequestGuide.description.label")}
                    rules={formItemRequiredRule}
                >
                    <TextArea rows={3} placeholder={t("community.supportRequestGuide.step1.content")} />
                </Form.Item>

                <Form.Item
                    name="actions"
                    label={t("community.supportRequestGuide.actions.label")}
                    rules={formItemRequiredRule}
                >
                    <TextArea rows={4} placeholder={t("community.supportRequestGuide.step2.list.0")} />
                </Form.Item>

                <Form.Item
                    name="expected"
                    label={t("community.supportRequestGuide.expected.label")}
                    rules={formItemRequiredRule}
                >
                    <TextArea rows={2} placeholder={t("community.supportRequestGuide.step2.list.1")} />
                </Form.Item>

                <Form.Item
                    name="actual"
                    label={t("community.supportRequestGuide.actual.label")}
                    rules={formItemRequiredRule}
                >
                    <TextArea rows={2} placeholder={t("community.supportRequestGuide.step2.list.2")} />
                </Form.Item>

                <Form.Item name="os" label={t("community.supportRequestGuide.os.label")} rules={formItemRequiredRule}>
                    <Input placeholder={t("community.supportRequestGuide.step3.list.0")} />
                </Form.Item>

                <Form.Item name="docker" label={t("community.supportRequestGuide.docker.label")}>
                    <Input placeholder={t("community.supportRequestGuide.step3.list.1")} />
                </Form.Item>

                <Form.Item name="teddycloudVersion" label={t("community.supportRequestGuide.version.label")}>
                    <Input value={teddyCloudVersionDisplay} />
                </Form.Item>

                <Form.Item name="stepsTaken" label={t("community.supportRequestGuide.stepsTaken.label")}>
                    <TextArea rows={3} placeholder={t("community.supportRequestGuide.step6.content")} />
                </Form.Item>

                <Form.Item name="logs" label={t("community.supportRequestGuide.logs.label")}>
                    <Paragraph>{t("community.supportRequestGuide.step4.intro")}</Paragraph>
                    <ul>
                        <li>
                            {t("community.supportRequestGuide.step4.listFirstEntry")}
                            <CodeSnippet language="shell" code={`docker logs -f teddycloud > teddycloud_logs.txt`} />
                        </li>
                        {(
                            t("community.supportRequestGuide.step4.list", {
                                returnObjects: true,
                            }) as string[]
                        ).map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </Form.Item>

                <Form.Item name="additionalInfo" label={t("community.supportRequestGuide.additionalInfo.label")}>
                    <TextArea rows={2} placeholder={t("community.supportRequestGuide.step5.content")} />
                </Form.Item>
            </Form>

            <Typography>
                <Paragraph type="secondary" style={{ marginTop: 16 }}>
                    {t("community.supportRequestGuide.closing")}
                </Paragraph>
            </Typography>
        </Modal>
    );
};
