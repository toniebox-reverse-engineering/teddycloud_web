import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from "react";
import { notification as antdNotification } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

import { NotificationRecord, NotificationType } from "./types/teddyCloudNotificationTypes";

interface TeddyCloudContextType {
    fetchCloudStatus: boolean;
    setFetchCloudStatus: Dispatch<SetStateAction<boolean>>;
    notifications: NotificationRecord[];
    addNotification: (
        type: NotificationType,
        message: string,
        description: string,
        context?: string,
        confirmed?: boolean
    ) => void;
    addLoadingNotification: (key: string, message: string, description: string) => void;
    closeLoadingNotification: (key: string) => void;
    confirmNotification: (uuid: string) => void;
    unconfirmedCount: number;
    clearAllNotifications: () => void;
    removeNotifications: (uuid: string[]) => void;
}

const TeddyCloudContext = createContext<TeddyCloudContextType>({
    fetchCloudStatus: false,
    setFetchCloudStatus: () => {},
    notifications: [],
    addNotification: () => {},
    addLoadingNotification: () => {},
    closeLoadingNotification: () => {},
    confirmNotification: () => {},
    unconfirmedCount: 0,
    clearAllNotifications: () => {},
    removeNotifications: () => {},
});

interface TeddyCloudProviderProps {
    children: ReactNode;
}

export function TeddyCloudProvider({ children }: TeddyCloudProviderProps) {
    const [fetchCloudStatus, setFetchCloudStatus] = useState<boolean>(false);
    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

    useEffect(() => {
        const storedNotifications = localStorage.getItem("notifications");
        if (storedNotifications) {
            const parsedNotifications: NotificationRecord[] = JSON.parse(storedNotifications);
            const notificationsWithDateObjects = parsedNotifications.map((notification) => ({
                ...notification,
                date: new Date(notification.date), // Convert date string back to Date object
            }));
            setNotifications(notificationsWithDateObjects);
        }
    }, []);

    function generateUUIDWithDate(date = new Date()) {
        const timestamp = date.getTime();
        const timestampHex = timestamp.toString(16);

        return "xxxx-xxxx-4xxx-yxxx-xxxx".replace(/[xy]/g, function (c, index) {
            const random = (Math.random() * 16) | 0;
            const value =
                c === "x"
                    ? index < timestampHex.length
                        ? parseInt(timestampHex[index], 16)
                        : random
                    : (random & 0x3) | 0x8;

            return value.toString(16);
        });
    }
    const addNotification = (
        type: NotificationType,
        title: string,
        description: string,
        context?: string,
        confirmed?: boolean
    ) => {
        const newNotification: NotificationRecord = {
            uuid: generateUUIDWithDate(new Date()),
            date: new Date(),
            type,
            title,
            description,
            context: context || "",
            flagConfirmed: confirmed !== undefined ? confirmed : type === "success" || type === "info",
        };

        antdNotification.open({
            type: type,
            message: title,
            description: description,
            showProgress: true,
            pauseOnHover: true,
            placement: "bottomRight",
        });

        setNotifications((prevNotifications) => {
            const updatedNotifications = [newNotification, ...prevNotifications];
            localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
            return updatedNotifications;
        });
    };

    const addLoadingNotification = (key: string, title: string, description: string) => {
        antdNotification.open({
            key,
            message: title,
            description: description,
            icon: <LoadingOutlined />,
            duration: 0,
            placement: "bottomRight",
        });
    };

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const closeLoadingNotification = async (key: string) => {
        setTimeout(() => {
            antdNotification.destroy(key);
        }, 300);
        await sleep(500); // prevent flickering
    };

    const confirmNotification = (uuid: string) => {
        setNotifications((prevNotifications) => {
            const updatedNotifications = prevNotifications.map((notification) =>
                notification.uuid === uuid ? { ...notification, flagConfirmed: true } : notification
            );
            localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
            return updatedNotifications;
        });
    };

    const removeNotifications = (uuidsToRemove: string[]) => {
        setNotifications((prevNotifications) => {
            const updatedNotifications = prevNotifications.filter(
                (notification) => !uuidsToRemove.includes(notification.uuid)
            );
            localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
            return updatedNotifications;
        });
    };

    const clearAllNotifications = () => {
        setNotifications([]);
        localStorage.removeItem("notifications");
    };

    const unconfirmedCount = notifications.filter((notification) => !notification.flagConfirmed).length;

    return (
        <TeddyCloudContext.Provider
            value={{
                fetchCloudStatus,
                setFetchCloudStatus,
                notifications,
                addNotification,
                addLoadingNotification,
                closeLoadingNotification,
                confirmNotification,
                unconfirmedCount,
                clearAllNotifications,
                removeNotifications,
            }}
        >
            {children}
        </TeddyCloudContext.Provider>
    );
}

export function useTeddyCloud() {
    return useContext(TeddyCloudContext);
}
