import { useEffect, useState } from "react";
import { Table, Select, Space, theme, Button } from "antd";
import { NotificationRecord, NotificationType } from "../../types/teddyCloudNotificationTypes";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { ExclamationCircleFilled, CheckCircleFilled, CloseCircleFilled, InfoCircleFilled } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { TableRowSelection } from "antd/es/table/interface";
import style from "react-syntax-highlighter/dist/esm/styles/hljs/a11y-dark";

const { Option } = Select;
const { useToken } = theme;

const NotificationsList = () => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { notifications, confirmNotification, clearAllNotifications } = useTeddyCloud();
    const [filteredNotifications, setFilteredNotifications] = useState<NotificationRecord[]>(notifications);
    const [filterType, setFilterType] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [pageSize, setPageSize] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        // Add event listener to handle screen size change
        const handleResize = () => {
            setIsTablet(window.innerWidth < 1024);
            setIsMobile(window.innerWidth < 768);
        };

        handleResize(); // Check screen size on component mount
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize); // Clean up the event listener
        };
    }, []);

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

    const columns: any = [
        {
            title: t("settings.notifications.colType"),
            dataIndex: "type",
            key: "type",
            render: (text: NotificationType) => (
                <div style={{ display: "flex", gap: 8 }}>
                    {isMobile ? "" : notificationIconMap[text]}
                    {text.charAt(0).toUpperCase() + text.slice(1)}
                </div>
            ),
            sorter: (a: NotificationRecord, b: NotificationRecord) => a.type.localeCompare(b.type),
            ellipsis: true,
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
            responsive: ["lg"],
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
            width: 90,
            onCell: () => ({
                style: { maxWidth: 90 },
            }),
            ellipsis: true,
            responsive: ["lg"],
        },
        {
            title: t("settings.notifications.colDate"),
            dataIndex: "date",
            key: "date",
            render: (date: Date) => {
                if (!(date instanceof Date)) return "";

                return isMobile
                    ? date
                          .toLocaleString("en-US", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                          })
                          .replace(",", "")
                    : date
                          .toLocaleString("en-US", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                          })
                          .replace(",", "");
            },
            sorter: (a: NotificationRecord, b: NotificationRecord) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateA.getTime() - dateB.getTime();
            },
            ellipsis: true,
        },
        {
            title: t("settings.notifications.colStatus"),
            dataIndex: "flagConfirmed",
            key: "flagConfirmed",
            render: (confirmed: boolean) => (confirmed ? "Confirmed" : "Unconfirmed"), // Display confirmation status
            sorter: (a: NotificationRecord, b: NotificationRecord) => Number(a.flagConfirmed) - Number(b.flagConfirmed),
            responsive: ["sm"],
        },
    ];

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        console.log("selectedRowKeys changed: ", newSelectedRowKeys);
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection: TableRowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

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
                tableLayout="auto"
                size={"small"}
                rowSelection={rowSelection}
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
                    current: currentPage,
                    pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: [10, 20, 30, 50],
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    },
                    locale: { items_per_page: t("settings.notifications.pageSelector") },
                }}
                sticky={{ offsetHeader: 0 }}
                rowKey="key" // Use the key prop for unique row identification
                onRow={(record) => ({
                    onClick: () => {
                        if (!record.flagConfirmed) {
                            confirmNotification(record.key);
                        }
                    },
                })}
                expandable={
                    isTablet
                        ? {
                              expandedRowRender: (record) => (
                                  <div>
                                      <strong>{t("settings.notifications.colDetails")}:</strong> {record.description}
                                      {record.context ? (
                                          <div>
                                              <br />
                                              <strong>{t("settings.notifications.colContext")}:</strong>{" "}
                                              {record.context}{" "}
                                          </div>
                                      ) : null}
                                      <br />
                                      {isMobile ? (
                                          <div>
                                              <strong>{t("settings.notifications.colStatus")}:</strong>{" "}
                                              {record.flagConfirmed ? "Confirmed" : "Unconfirmed"}
                                          </div>
                                      ) : null}
                                  </div>
                              ),
                              rowExpandable: (record) => record.description !== undefined, // Ensure rows with no description can't be expanded
                          }
                        : undefined
                }
            />
        </div>
    );
};

export default NotificationsList;
