import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, Flex, Form, Input, Switch, Table, Tooltip, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";

import ConfirmationDialog from "../../common/modals/ConfirmationModal";
import { useAuth } from "../../../provider/AuthProvider";
import { useTeddyCloud } from "../../../provider/TeddyCloudProvider";
import { NotificationTypeEnum } from "../../../types/teddyCloudNotificationTypes";
import {
    changeAuthPassword,
    createAuthUser,
    deleteAuthUser,
    fetchAuthUsers,
    setAuthEnabled,
} from "../../../utils/auth/webAuthApi";

const { Title, Paragraph, Text } = Typography;

export const WebAuthSettings = () => {
    const { t } = useTranslation();
    const { refresh } = useAuth();
    const { addNotification } = useTeddyCloud();
    const [users, setUsers] = useState<string[]>([]);
    const [enabled, setEnabled] = useState(false);
    const [envOverride, setEnvOverride] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [passwordUser, setPasswordUser] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [createForm] = Form.useForm();

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAuthUsers();
            setUsers(data.users);
            setEnabled(data.enabled);
            setEnvOverride(data.envOverride);
        } catch (err) {
            setError(err instanceof Error ? err.message : t("settings.webAuth.loadFailed"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const handleToggle = async (checked: boolean) => {
        setError(null);
        try {
            await setAuthEnabled(checked);
            setEnabled(checked);
            await refresh();
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : t("settings.webAuth.saveFailed"));
        }
    };

    const handleCreate = async (values: { username: string; password: string }) => {
        setError(null);
        try {
            await createAuthUser(values.username.trim(), values.password);
            createForm.resetFields();
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : t("settings.webAuth.saveFailed"));
        }
    };

    const togglePasswordRow = (username: string) => {
        setError(null);
        setNewPassword("");
        setPasswordUser((current) => (current === username ? null : username));
    };

    const savePassword = async () => {
        if (!passwordUser || newPassword.length < 4) {
            return;
        }
        setError(null);
        setPasswordSaving(true);
        try {
            await changeAuthPassword(passwordUser, newPassword);
            addNotification(
                NotificationTypeEnum.Success,
                t("settings.webAuth.passwordChanged"),
                t("settings.webAuth.passwordChangedDetails", { username: passwordUser }),
                t("settings.webAuth.navigationTitle"),
            );
            setPasswordUser(null);
            setNewPassword("");
        } catch (err) {
            setError(err instanceof Error ? err.message : t("settings.webAuth.saveFailed"));
        } finally {
            setPasswordSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!userToDelete) {
            return;
        }
        setError(null);
        try {
            const result = await deleteAuthUser(userToDelete);
            if (passwordUser === userToDelete) {
                setPasswordUser(null);
                setNewPassword("");
            }
            setUserToDelete(null);
            await load();
            await refresh();
            if (result.authDisabled) {
                setEnabled(false);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t("settings.webAuth.saveFailed"));
        }
    };

    const lastUser = users.length === 1;

    return (
        <>
            <Title level={2}>{t("settings.webAuth.title")}</Title>
            <Paragraph>{t("settings.webAuth.intro")}</Paragraph>
            {envOverride ? (
                <Alert
                    type="warning"
                    showIcon
                    title={t("settings.webAuth.envOverride")}
                    style={{ marginBottom: 16 }}
                />
            ) : null}
            {error ? (
                <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />
            ) : null}

            <Flex align="center" gap={12} style={{ marginBottom: 24 }}>
                <Switch
                    checked={enabled}
                    disabled={envOverride || (users.length === 0 && !enabled)}
                    onChange={handleToggle}
                />
                <Text>{t("settings.webAuth.enabled")}</Text>
            </Flex>
            {users.length === 0 ? (
                <Alert
                    type="info"
                    showIcon
                    title={t("settings.webAuth.createFirstUser")}
                    style={{ marginBottom: 16 }}
                />
            ) : null}

            <Title level={4}>{t("settings.webAuth.users")}</Title>
            <Table
                loading={loading}
                pagination={false}
                rowKey="username"
                dataSource={users.map((username) => ({ username }))}
                expandable={{
                    expandedRowKeys: passwordUser ? [passwordUser] : [],
                    showExpandColumn: false,
                    expandedRowRender: (record: { username: string }) => (
                        <Flex gap={8} wrap="wrap" align="center">
                            <Input.Password
                                autoComplete="new-password"
                                placeholder={t("auth.newPassword")}
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                onPressEnter={() => void savePassword()}
                                style={{ minHeight: 44, minWidth: 200, flex: "1 1 200px" }}
                                aria-label={t("settings.webAuth.changePasswordFor", {
                                    username: record.username,
                                })}
                            />
                            <Button
                                type="primary"
                                loading={passwordSaving}
                                disabled={newPassword.length < 4}
                                onClick={() => void savePassword()}
                                style={{ minHeight: 44 }}
                            >
                                {t("settings.webAuth.changePassword")}
                            </Button>
                            <Button
                                onClick={() => togglePasswordRow(record.username)}
                                style={{ minHeight: 44 }}
                            >
                                {t("common.cancel")}
                            </Button>
                        </Flex>
                    ),
                }}
                columns={[
                    {
                        title: t("auth.username"),
                        dataIndex: "username",
                    },
                    {
                        title: "",
                        key: "actions",
                        width: 112,
                        render: (_: unknown, record: { username: string }) => (
                            <Flex justify="flex-end" gap={0}>
                                <Tooltip
                                    title={t("settings.webAuth.changePasswordFor", {
                                        username: record.username,
                                    })}
                                >
                                    <Button
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={() => togglePasswordRow(record.username)}
                                        aria-label={t("settings.webAuth.changePasswordFor", {
                                            username: record.username,
                                        })}
                                        style={{ minHeight: 44, minWidth: 44 }}
                                    />
                                </Tooltip>
                                <Tooltip title={t("settings.webAuth.deleteUser")}>
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => setUserToDelete(record.username)}
                                        aria-label={t("settings.webAuth.deleteUser")}
                                        style={{ minHeight: 44, minWidth: 44 }}
                                    />
                                </Tooltip>
                            </Flex>
                        ),
                    },
                ]}
                style={{ marginBottom: 24 }}
            />

            <Title level={4}>{t("settings.webAuth.addUser")}</Title>
            <Form
                form={createForm}
                layout="vertical"
                onFinish={handleCreate}
                style={{ maxWidth: 420 }}
            >
                <Form.Item
                    name="username"
                    label={t("auth.username")}
                    rules={[{ required: true, message: t("auth.usernameRequired") }]}
                >
                    <Input autoComplete="off" style={{ minHeight: 44 }} />
                </Form.Item>
                <Form.Item
                    name="password"
                    label={t("auth.password")}
                    rules={[
                        { required: true, message: t("auth.passwordRequired") },
                        { min: 4, message: t("auth.passwordMin") },
                    ]}
                >
                    <Input.Password autoComplete="new-password" style={{ minHeight: 44 }} />
                </Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    icon={<PlusOutlined />}
                    style={{ minHeight: 44 }}
                >
                    {t("settings.webAuth.addUser")}
                </Button>
            </Form>

            <ConfirmationDialog
                title={
                    lastUser
                        ? t("settings.webAuth.deleteLastTitle")
                        : t("settings.webAuth.deleteTitle")
                }
                okText={t("settings.webAuth.deleteUser")}
                cancelText={t("common.cancel")}
                content={
                    lastUser
                        ? t("settings.webAuth.deleteLastContent", { username: userToDelete || "" })
                        : t("settings.webAuth.deleteContent", { username: userToDelete || "" })
                }
                contentHint={lastUser ? t("settings.webAuth.deleteLastHint") : undefined}
                open={!!userToDelete}
                handleOk={confirmDelete}
                handleCancel={() => setUserToDelete(null)}
            />
        </>
    );
};
