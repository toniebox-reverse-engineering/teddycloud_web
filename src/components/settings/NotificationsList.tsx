import { useEffect, useState } from "react";
import { Table, Select, Space } from "antd";
import { NotificationRecord } from "../../types/teddyCloudNotificationTypes";
import { useTeddyCloud } from "../../utils/TeddyCloudContext";

const { Option } = Select;

const NotificationsList = () => {
    const { notifications, confirmNotification } = useTeddyCloud(); // Destructure to get notifications
    const [filteredNotifications, setFilteredNotifications] = useState<NotificationRecord[]>(notifications);
    const [filterType, setFilterType] = useState<string | null>(null); // State for selected filter type

    useEffect(() => {
        setFilteredNotifications(notifications);
    }, [notifications]);

    // Handle filter change
    const handleFilterChange = (value: string | null) => {
        setFilterType(value);
        if (value) {
            setFilteredNotifications(notifications.filter((notification) => notification.type === value));
        } else {
            setFilteredNotifications(notifications);
        }
    };

    const columns = [
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (text: string) => <span>{text.charAt(0).toUpperCase() + text.slice(1)}</span>, // Capitalize the first letter
            sorter: (a: NotificationRecord, b: NotificationRecord) => a.type.localeCompare(b.type), // Sort by type
        },
        {
            title: "Description",
            dataIndex: "message",
            key: "message",
            sorter: (a: NotificationRecord, b: NotificationRecord) => a.message.localeCompare(b.message), // Sort by message
        },
        {
            title: "Date",
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
            title: "Status",
            dataIndex: "flagConfirmed",
            key: "flagConfirmed",
            render: (confirmed: boolean) => (confirmed ? "Confirmed" : "Unconfirmed"), // Display confirmation status
            sorter: (a: NotificationRecord, b: NotificationRecord) => Number(a.flagConfirmed) - Number(b.flagConfirmed), // Sort by confirmed status
        },
    ];

    return (
        <div>
            <h2>Notifications</h2>
            <Space style={{ marginBottom: 16 }}>
                <Select
                    placeholder="Filter by type"
                    onChange={handleFilterChange}
                    allowClear // Allow clearing the selection
                    style={{ width: 200 }}
                >
                    <Option value="success">Success</Option>
                    <Option value="info">Info</Option>
                    <Option value="warning">Warning</Option>
                    <Option value="error">Error</Option>
                </Select>
            </Space>
            <Table
                dataSource={filteredNotifications.map((notification, index) => ({
                    key: index,
                    type: notification.type,
                    message: notification.message,
                    description: notification.description,
                    date: notification.date,
                    flagConfirmed: notification.flagConfirmed,
                }))}
                columns={columns}
                pagination={{
                    pageSize: 20,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "30", "50"],
                }}
                rowKey="key" // Use the key prop for unique row identification
                onRow={(record) => ({
                    onClick: () => {
                        if (!record.flagConfirmed) {
                            confirmNotification(record.key); // Confirm notification on row click
                        }
                    },
                })}
            />
        </div>
    );
};

export default NotificationsList;
