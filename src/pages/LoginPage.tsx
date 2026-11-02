import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, Card, Flex, Form, Input, Typography, theme } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";

import { useAuth } from "../provider/AuthProvider";
import { StyledLanguageSwitcher } from "../components/common/header/StyledLanguageSwitcher";
import logoImg from "../assets/logo.png";

const { useToken } = theme;
const { Title, Text } = Typography;

export const LoginPage = ({ themeSwitch }: { themeSwitch: ReactNode }) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const onFinish = async (values: { username: string; password: string }) => {
        setError(null);
        setSubmitting(true);
        try {
            await login(values.username.trim(), values.password);
        } catch (err) {
            if (err instanceof Error && err.message === "rate_limited") {
                setError(t("auth.loginRateLimited"));
            } else {
                setError(err instanceof Error ? err.message : t("auth.loginFailed"));
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Flex
            vertical
            align="center"
            justify="center"
            style={{
                minHeight: "100vh",
                padding: 16,
                background: token.colorBgLayout,
            }}
        >
            <Flex
                align="center"
                justify="flex-end"
                gap={8}
                style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    left: 0,
                    padding: "12px 16px",
                    background: "#141414",
                }}
            >
                {themeSwitch}
                <StyledLanguageSwitcher />
            </Flex>
            <Card style={{ width: "100%", maxWidth: 400 }}>
                <Flex vertical align="center" gap={8} style={{ marginBottom: 16 }}>
                    <img src={logoImg} alt="TeddyCloud" style={{ height: 40 }} />
                    <Title level={3} style={{ margin: 0 }}>
                        {t("auth.loginTitle")}
                    </Title>
                    <Text type="secondary">{t("auth.loginHint")}</Text>
                </Flex>
                {error ? (
                    <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />
                ) : null}
                <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
                    <Form.Item
                        name="username"
                        label={t("auth.username")}
                        rules={[{ required: true, message: t("auth.usernameRequired") }]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            autoComplete="username"
                            autoFocus
                            style={{ minHeight: 44 }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label={t("auth.password")}
                        rules={[{ required: true, message: t("auth.passwordRequired") }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            autoComplete="current-password"
                            style={{ minHeight: 44 }}
                        />
                    </Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitting}
                        block
                        style={{ minHeight: 44 }}
                    >
                        {t("auth.loginSubmit")}
                    </Button>
                </Form>
            </Card>
        </Flex>
    );
};
