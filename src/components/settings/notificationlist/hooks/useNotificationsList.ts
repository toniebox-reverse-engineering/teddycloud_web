import { useEffect, useMemo, useState } from "react";
import { useTeddyCloud } from "../../../../TeddyCloudContext";
import { NotificationRecord } from "../../../../types/teddyCloudNotificationTypes";

type NotificationStatusFilter = "Confirmed" | "Unconfirmed";

export const useNotificationsList = () => {
    const { notifications, confirmNotification, clearAllNotifications, removeNotifications } = useTeddyCloud();

    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [titleFilter, setTitleFilter] = useState<string>("");
    const [descriptionFilter, setDescriptionFilter] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string[]>([]);
    const [contextFilter, setContextFilter] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<NotificationStatusFilter[]>([]);

    useEffect(() => {
        const handleResize = () => {
            setIsTablet(window.innerWidth < 1024);
            setIsMobile(window.innerWidth < 768);
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const filteredNotifications: NotificationRecord[] = notifications.filter((notification) => {
        const notificationDate = notification.date instanceof Date ? notification.date : new Date(notification.date);

        const matchesDate =
            (!dateRange[0] || notificationDate >= dateRange[0]) && (!dateRange[1] || notificationDate <= dateRange[1]);

        const title = notification.title || "";
        const description = notification.description || "";
        const context = notification.context || "";

        const matchesTitle = title.toLowerCase().includes(titleFilter.toLowerCase());
        const matchesDescription = description.toLowerCase().includes(descriptionFilter.toLowerCase());
        const matchesType = typeFilter.length === 0 || typeFilter.includes(notification.type);
        const matchesContext = contextFilter.length === 0 || contextFilter.includes(context);

        const status: NotificationStatusFilter = notification.flagConfirmed ? "Confirmed" : "Unconfirmed";
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(status);

        return matchesDate && matchesTitle && matchesDescription && matchesType && matchesContext && matchesStatus;
    });

    const uniqueContexts = useMemo(
        () =>
            Array.from(
                new Set(
                    notifications
                        .map((notification) => notification.context)
                        .filter((value): value is string => Boolean(value))
                )
            ),
        [notifications]
    );

    const confirmSelectedNotifications = () => {
        selectedRowKeys.forEach((key) => {
            const uuid = String(key);
            confirmNotification(uuid);
        });
        setSelectedRowKeys([]);
    };

    const removeSelectedNotifications = () => {
        const uuidsToRemove = selectedRowKeys.map((key) => String(key));
        removeNotifications(uuidsToRemove);
        setSelectedRowKeys([]);
    };

    const confirmSingleNotification = (uuid: string) => {
        confirmNotification(uuid);
    };

    return {
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
    };
};
