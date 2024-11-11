import { useEffect, useState } from "react";
import {
    Table,
    Select,
    Space,
    theme,
    Button,
    DatePicker,
    Input,
    Collapse,
    CollapseProps,
    Typography,
    Tooltip,
} from "antd";
import { NotificationRecord, NotificationType } from "../../types/teddyCloudNotificationTypes";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { ExclamationCircleFilled, CheckCircleFilled, CloseCircleFilled, InfoCircleFilled } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { TableRowSelection } from "antd/es/table/interface";

const { Option } = Select;
const { Paragraph } = Typography;
const { useToken } = theme;

const NotificationsList = () => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { notifications, confirmNotification, clearAllNotifications, removeNotifications } = useTeddyCloud();
    const [filteredNotifications, setFilteredNotifications] = useState<NotificationRecord[]>(notifications);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [pageSize, setPageSize] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);

    const [collapsed, setCollapsed] = useState(true);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [titleFilter, setTitleFilter] = useState<string>("");
    const [descriptionFilter, setDescriptionFilter] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string[]>([]);
    const [contextFilter, setContextFilter] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<string[]>([]);

    useEffect(() => {
        const filteredData = notifications.filter((notification) => {
            const matchesDate =
                (!dateRange[0] || notification.date >= dateRange[0]) &&
                (!dateRange[1] || notification.date <= dateRange[1]);
            const matchesTitle = notification.title.toLowerCase().includes(titleFilter.toLowerCase());
            const matchesDescription = notification.description.toLowerCase().includes(descriptionFilter.toLowerCase());
            const matchesType = typeFilter.length === 0 || typeFilter.includes(notification.type);
            const matchesContext = contextFilter.length === 0 || contextFilter.includes(notification.context);
            const matchesStatus =
                statusFilter.length === 0 ||
                statusFilter.includes(notification.flagConfirmed ? "Confirmed" : "Unconfirmed");
            return matchesDate && matchesTitle && matchesDescription && matchesType && matchesContext && matchesStatus;
        });
        setFilteredNotifications(filteredData);
    }, [notifications, dateRange, titleFilter, descriptionFilter, typeFilter, contextFilter, statusFilter]);

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

    const notificationIconMap = {
        success: <CheckCircleFilled style={{ color: token.colorSuccess }} />,
        error: <CloseCircleFilled style={{ color: token.colorError }} />,
        info: <InfoCircleFilled style={{ color: token.colorInfo }} />,
        warning: <ExclamationCircleFilled style={{ color: token.colorWarning }} />,
    };

    const uniqueContexts = Array.from(new Set(notifications.map((notification) => notification.context))).filter(
        Boolean
    );

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
            render: (confirmed: boolean, record: NotificationRecord) => (
                <div
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                        e.stopPropagation();

                        if (!record.flagConfirmed) {
                            confirmNotification(record.uuid);
                        }
                    }}
                >
                    {record.flagConfirmed ? (
                        t("settings.notifications.confirmed")
                    ) : (
                        <Tooltip title={t("settings.notifications.clickToConfirm")}>
                            {t("settings.notifications.unconfirmed")}
                        </Tooltip>
                    )}
                </div>
            ),
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

    const filterPanelContent = (
        <div
            style={{
                marginBottom: 16,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 16,
                alignItems: "start",
            }}
        >
            <Select
                mode="multiple"
                placeholder={t("settings.notifications.filterBy") + " " + t("settings.notifications.colType")}
                onChange={setTypeFilter}
            >
                <Option value="success">{t("settings.notifications.success")}</Option>
                <Option value="info">{t("settings.notifications.info")}</Option>
                <Option value="warning">{t("settings.notifications.warning")}</Option>
                <Option value="error">{t("settings.notifications.error")}</Option>
            </Select>
            <Select
                mode="multiple"
                placeholder={t("settings.notifications.filterBy") + " " + t("settings.notifications.colContext")}
                onChange={setContextFilter}
            >
                {uniqueContexts.map((context) => (
                    <Option key={context} value={context}>
                        {context}
                    </Option>
                ))}
            </Select>
            <Select
                mode="multiple"
                placeholder={t("settings.notifications.filterBy") + " " + t("settings.notifications.colStatus")}
                onChange={setStatusFilter}
            >
                <Option value="Confirmed">{t("settings.notifications.confirmed")}</Option>
                <Option value="Unconfirmed">{t("settings.notifications.unconfirmed")}</Option>
            </Select>
            <DatePicker.RangePicker
                onChange={(dates) => {
                    setDateRange(dates && dates[0] && dates[1] ? [dates[0].toDate(), dates[1].toDate()] : [null, null]);
                }}
                placeholder={[t("settings.notifications.startDate"), t("settings.notifications.endDate")]}
            />
            <Input
                placeholder={t("settings.notifications.searchIn") + " " + t("settings.notifications.colTitle")}
                onChange={(e) => setTitleFilter(e.target.value)}
            />
            <Input
                placeholder={t("settings.notifications.searchIn") + " " + t("settings.notifications.colDetails")}
                onChange={(e) => setDescriptionFilter(e.target.value)}
            />
        </div>
    );

    const filterPanelContentItem: CollapseProps["items"] = [
        {
            key: "search-filter",
            label: collapsed ? t("tonies.tonies.filterBar.showFilters") : t("tonies.tonies.filterBar.hideFilters"),
            children: filterPanelContent,
        },
    ];

    const confirmSelectedNotifications = () => {
        selectedRowKeys.forEach((key) => {
            const uuid = String(key);
            confirmNotification(uuid);
            setSelectedRowKeys([]);
        });
    };

    const removeSelectedNotifications = () => {
        const uuidsToRemove = selectedRowKeys.map((key) => String(key));
        removeNotifications(uuidsToRemove);
    };

    return (
        <div>
            <h2>{t("settings.notifications.title")}</h2>

            <Paragraph
                style={{
                    width: "100%",
                    marginBottom: 16,
                }}
            >
                <Collapse
                    items={filterPanelContentItem}
                    defaultActiveKey={collapsed ? [] : ["search-filter"]}
                    onChange={() => setCollapsed(!collapsed)}
                    bordered={false}
                    style={{ width: "100%" }}
                />
            </Paragraph>
            <Paragraph style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                {selectedRowKeys.length > 0 ? (
                    <Paragraph style={{ display: "flex", gap: 8 }}>
                        <Button onClick={removeSelectedNotifications}>
                            {t("settings.notifications.removeSelectedNotifications")}
                        </Button>
                        <Button onClick={confirmSelectedNotifications}>
                            {t("settings.notifications.confirmSelectedNotifications")}
                        </Button>{" "}
                    </Paragraph>
                ) : (
                    <Paragraph></Paragraph>
                )}
                <Paragraph>
                    <Button onClick={clearAllNotifications}>{t("settings.notifications.removeAll")}</Button>
                </Paragraph>
            </Paragraph>

            <Table
                tableLayout="auto"
                size={"small"}
                rowSelection={rowSelection}
                dataSource={filteredNotifications.map((notification) => ({
                    uuid: notification.uuid,
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
                rowKey="uuid"
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
                                              {record.flagConfirmed ? (
                                                  t("settings.notifications.confirmed")
                                              ) : (
                                                  <Tooltip title={t("settings.notifications.clickToConfirm")}>
                                                      {t("settings.notifications.unconfirmed")}
                                                  </Tooltip>
                                              )}
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
