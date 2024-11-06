import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from "react";
import { notification as antdNotification } from "antd";
import { NotificationRecord, NotificationType } from "../types/teddyCloudNotificationTypes";

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
    confirmNotification: (index: number) => void;
    unconfirmedCount: number;
    clearAllNotifications: () => void;
}

const TeddyCloudContext = createContext<TeddyCloudContextType>({
    fetchCloudStatus: false,
    setFetchCloudStatus: () => {},
    notifications: [],
    addNotification: () => {},
    confirmNotification: () => {},
    unconfirmedCount: 0,
    clearAllNotifications: () => {},
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

    const saveNotifications = (newNotifications: NotificationRecord[]) => {
        setNotifications(newNotifications);
        localStorage.setItem("notifications", JSON.stringify(newNotifications));
    };

    const addNotification = (
        type: NotificationType,
        title: string,
        description: string,
        context?: string,
        confirmed?: boolean
    ) => {
        const newNotification: NotificationRecord = {
            date: new Date(),
            type,
            title,
            description,
            context: context || "",
            flagConfirmed: confirmed !== undefined ? confirmed : type === "success" || type === "info",
        };
        const updatedNotifications = [newNotification, ...notifications];
        saveNotifications(updatedNotifications);

        antdNotification[type]({
            message: title,
            description: description,
            showProgress: true,
            pauseOnHover: true,
            placement: "bottomRight",
        });
    };

    const confirmNotification = (index: number) => {
        const updatedNotifications = [...notifications];
        if (updatedNotifications[index]) {
            updatedNotifications[index].flagConfirmed = true;
            saveNotifications(updatedNotifications);
        }
    };

    const clearAllNotifications = () => {
        setNotifications([]); // Clear notifications state
        localStorage.removeItem("notifications"); // Remove notifications from local storage
    };

    const unconfirmedCount = notifications.filter((notification) => !notification.flagConfirmed).length;

    return (
        <TeddyCloudContext.Provider
            value={{
                fetchCloudStatus,
                setFetchCloudStatus,
                notifications,
                addNotification,
                confirmNotification,
                unconfirmedCount,
                clearAllNotifications,
            }}
        >
            {children}
        </TeddyCloudContext.Provider>
    );
}

export function useTeddyCloud() {
    return useContext(TeddyCloudContext);
}
