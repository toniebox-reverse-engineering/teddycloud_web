import { useEffect, useState } from "react";
import { Table, Select, Space, theme, Button } from "antd";
import { NotificationRecord, NotificationType } from "../../types/teddyCloudNotificationTypes";
import { useTeddyCloud } from "../../utils/TeddyCloudContext";
import { ExclamationCircleFilled, CheckCircleFilled, CloseCircleFilled, InfoCircleFilled } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Option } = Select;
const { useToken } = theme;

const NotificationsList = () => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { notifications, confirmNotification, clearAllNotifications } = useTeddyCloud();
    const [filteredNotifications, setFilteredNotifications] = useState<NotificationRecord[]>(notifications);
    const [filterType, setFilterType] = useState<string | null>(null); // State for selected filter type

    useEffect(() => {
        setFilteredNotifications(notifications);
    }, [notifications]);

    const handleFilterChange = (value: string | null) => {
        setFilterType(value);
        if (value) {
            setFilteredNotifications(notifications.filter((notification) => notification.type === value));
        } else {
            setFilteredNotifications(notifications);
        }
    };

    const notificationIconMap = {
        success: <CheckCircleFilled style={{ color: token.colorSuccess }} />,
        error: <CloseCircleFilled style={{ color: token.colorError }} />,
        info: <InfoCircleFilled style={{ color: token.colorInfo }} />,
        warning: <ExclamationCircleFilled style={{ color: token.colorWarning }} />,
    };

    const columns = [
        {
            title: t("settings.notifications.colType"),
            dataIndex: "type",
            key: "type",
            render: (text: NotificationType) => (
                <div style={{ display: "flex", gap: 16 }}>
                    {notificationIconMap[text]}
                    {text.charAt(0).toUpperCase() + text.slice(1)}
                </div>
            ),
            sorter: (a: NotificationRecord, b: NotificationRecord) => a.type.localeCompare(b.type),
        },
        {
            title: t("settings.notifications.colTitle"),
            dataIndex: "title",
            key: "title",
            sorter: (a: NotificationRecord, b: NotificationRecord) => {
                const titleA = a.title || "";
                const titleB = b.title || "";
                return titleA.localeCompare(titleB);
            },
        },
        {
            title: t("settings.notifications.colDetails"),
            dataIndex: "description",
            key: "description",
            sorter: (a: NotificationRecord, b: NotificationRecord) => {
                const descriptionA = a.description || "";
                const descriptionB = b.description || "";
                return descriptionA.localeCompare(descriptionB);
            },
        },
        {
            title: t("settings.notifications.colContext"),
            dataIndex: "context",
            key: "context",
            sorter: (a: NotificationRecord, b: NotificationRecord) => {
                const contextA = a.context || "";
                const contextB = b.context || "";
                return contextA.localeCompare(contextB);
            },
        },
        {
            title: t("settings.notifications.colDate"),
            dataIndex: "date",
            key: "date",
            render: (date: Date) => {
                if (!(date instanceof Date)) return ""; // Check if it's a Date object

                return date
                    .toLocaleString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false, // Set to true for 12-hour format
                    })
                    .replace(",", ""); // Optionally remove the comma if present
            },
            sorter: (a: NotificationRecord, b: NotificationRecord) => {
                const dateA = new Date(a.date); // Ensure it's a Date object
                const dateB = new Date(b.date); // Ensure it's a Date object
                return dateA.getTime() - dateB.getTime(); // Sort by date
            },
        },
        {
            title: t("settings.notifications.colStatus"),
            dataIndex: "flagConfirmed",
            key: "flagConfirmed",
            render: (confirmed: boolean) => (confirmed ? "Confirmed" : "Unconfirmed"), // Display confirmation status
            sorter: (a: NotificationRecord, b: NotificationRecord) => Number(a.flagConfirmed) - Number(b.flagConfirmed), // Sort by confirmed status
        },
    ];

    return (
        <div>
            <h2>{t("settings.notifications.title")}</h2>
            <Space style={{ marginBottom: 16 }}>
                <Select
                    placeholder="Filter by type"
                    onChange={handleFilterChange}
                    allowClear // Allow clearing the selection
                    style={{ width: 200 }}
                >
                    <Option value="success">{t("settings.notifications.success")}</Option>
                    <Option value="info">{t("settings.notifications.info")}</Option>
                    <Option value="warning">{t("settings.notifications.warning")}</Option>
                    <Option value="error">{t("settings.notifications.error")}</Option>
                </Select>
            </Space>
            <Button style={{ marginLeft: 16 }} onClick={clearAllNotifications}>
                {t("settings.notifications.removeAll")}
            </Button>
            <Table
                dataSource={filteredNotifications.map((notification, index) => ({
                    key: index,
                    type: notification.type,
                    title: notification.title,
                    description: notification.description,
                    context: notification.context,
                    date: notification.date,
                    flagConfirmed: notification.flagConfirmed,
                }))}
                columns={columns}
                pagination={{
                    pageSize: 20,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "30", "50"],
                    locale: { items_per_page: t("settings.notifications.pageSelector") },
                }}
                rowKey="key" // Use the key prop for unique row identification
                onRow={(record) => ({
                    onClick: () => {
                        if (!record.flagConfirmed) {
                            confirmNotification(record.key);
                        }
                    },
                })}
            />
        </div>
    );
};

export default NotificationsList;
