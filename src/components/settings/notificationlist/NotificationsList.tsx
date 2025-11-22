import React, { useMemo, useState } from "react";
import { Table, Select, theme, Button, DatePicker, Input, Collapse, CollapseProps, Typography, Tooltip } from "antd";
import { ExclamationCircleFilled, CheckCircleFilled, CloseCircleFilled, InfoCircleFilled } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { TableRowSelection, ColumnsType } from "antd/es/table/interface";
import { NotificationRecord, NotificationType } from "../../../types/teddyCloudNotificationTypes";
import { useNotificationsList } from "./hooks/useNotificationsList";

const { Option } = Select;
const { Paragraph } = Typography;
const { useToken } = theme;

type NotificationRow = NotificationRecord & { _rowId: string };

const NotificationsList: React.FC = () => {
    const { t } = useTranslation();
    const { token } = useToken();

    const {
        filteredNotifications,
        uniqueContexts,
        selectedRowKeys,
        setSelectedRowKeys,
        dateRange,
        setDateRange,
        setTitleFilter,
        setDescriptionFilter,
        setTypeFilter,
        setContextFilter,
        setStatusFilter,
        confirmSelectedNotifications,
        removeSelectedNotifications,
        clearAllNotifications,
        confirmSingleNotification,
        isMobile,
        isTablet,
    } = useNotificationsList();

    const [collapsed, setCollapsed] = useState(true);
    const [pageSize, setPageSize] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);

    const notificationIconMap: Record<NotificationType, React.ReactNode> = {
        success: <CheckCircleFilled style={{ color: token.colorSuccess }} />,
        error: <CloseCircleFilled style={{ color: token.colorError }} />,
        info: <InfoCircleFilled style={{ color: token.colorInfo }} />,
        warning: <ExclamationCircleFilled style={{ color: token.colorWarning }} />,
    };

    const tableData: NotificationRow[] = useMemo(
        () =>
            filteredNotifications.map((n, index) => ({
                ...n,
                _rowId: `${n.uuid}-${index}`,
            })),
        [filteredNotifications]
    );

    const columns: ColumnsType<NotificationRow> = [
        {
            title: t("settings.notifications.colType"),
            dataIndex: "type",
            key: "type",
            render: (text: NotificationType) => (
                <div style={{ display: "flex", gap: 8 }}>
                    {isMobile ? null : notificationIconMap[text]}
                    {text.charAt(0)?.toUpperCase() + text.slice(1)}
                </div>
            ),
            sorter: (a, b) => a.type.localeCompare(b.type),
            ellipsis: true,
        },
        {
            title: t("settings.notifications.colTitle"),
            dataIndex: "title",
            key: "title",
            sorter: (a, b) => {
                const titleA = a.title || "";
                const titleB = b.title || "";
                return titleA.localeCompare(titleB);
            },
        },
        {
            title: t("settings.notifications.colDetails"),
            dataIndex: "description",
            key: "description",
            sorter: (a, b) => {
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
            sorter: (a, b) => {
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
            render: (date: Date | string) => {
                const d = date instanceof Date ? date : new Date(date);
                if (Number.isNaN(d.getTime())) return "";

                return isMobile
                    ? d
                          .toLocaleString("en-US", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                          })
                          .replace(",", "")
                    : d
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
            sorter: (a, b) => {
                const dateA = a.date instanceof Date ? a.date : new Date(a.date);
                const dateB = b.date instanceof Date ? b.date : new Date(b.date);
                return dateA.getTime() - dateB.getTime();
            },
            ellipsis: true,
        },
        {
            title: t("settings.notifications.colStatus"),
            dataIndex: "flagConfirmed",
            key: "flagConfirmed",
            render: (confirmed: boolean, record: NotificationRow) => (
                <div
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!record.flagConfirmed) {
                            confirmSingleNotification(record.uuid);
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
            sorter: (a, b) => Number(a.flagConfirmed) - Number(b.flagConfirmed),
            responsive: ["sm"],
        },
    ];

    const rowSelection: TableRowSelection<NotificationRow> = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys) => {
            setSelectedRowKeys(newSelectedRowKeys);
        },
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
                    if (dates && dates[0] && dates[1]) {
                        setDateRange([dates[0].toDate(), dates[1].toDate()]);
                    } else {
                        setDateRange([null, null]);
                    }
                }}
                value={dateRange[0] && dateRange[1] ? [dateRange[0] as any, dateRange[1] as any] : undefined}
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

    return (
        <>
            <h1>{t("settings.notifications.title")}</h1>

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
                        </Button>
                    </Paragraph>
                ) : (
                    <Paragraph />
                )}
                <Paragraph>
                    <Button onClick={clearAllNotifications}>{t("settings.notifications.removeAll")}</Button>
                </Paragraph>
            </Paragraph>

            <Table<NotificationRow>
                tableLayout="auto"
                size="small"
                rowSelection={rowSelection}
                dataSource={tableData}
                columns={columns}
                rowKey="_rowId"
                pagination={{
                    current: currentPage,
                    pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: [10, 20, 30, 50],
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size || 20);
                    },
                    locale: { items_per_page: t("settings.notifications.pageSelector") },
                }}
                sticky={{ offsetHeader: 0 }}
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
                                              {record.context}
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
                              rowExpandable: (record) => record.description !== undefined,
                          }
                        : undefined
                }
            />
        </>
    );
};

export default NotificationsList;
