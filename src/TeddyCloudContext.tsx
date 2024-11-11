import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from "react";
import { notification as antdNotification } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useLocation } from "react-router-dom";

import { TeddyCloudApi } from "./api";
import { defaultAPIConfig } from "./config/defaultApiConfig";
import { NotificationRecord, NotificationType } from "./types/teddyCloudNotificationTypes";
import { generateUUID } from "./utils/helpers";

const api = new TeddyCloudApi(defaultAPIConfig());

interface TeddyCloudContextType {
    fetchCloudStatus: boolean;
    setFetchCloudStatus: Dispatch<SetStateAction<boolean>>;
    notifications: NotificationRecord[];
    tonieBoxContentDirs: Array<[string, string[], string]>;
    overlay: string;
    setOverlay: (overlay: string) => void;
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
    handleContentOverlayChange: (overlay: string) => void;
}

const TeddyCloudContext = createContext<TeddyCloudContextType>({
    fetchCloudStatus: false,
    setFetchCloudStatus: () => {},
    notifications: [],
    tonieBoxContentDirs: [],
    overlay: "",
    setOverlay: () => {},
    addNotification: () => {},
    addLoadingNotification: () => {},
    closeLoadingNotification: () => {},
    confirmNotification: () => {},
    unconfirmedCount: 0,
    clearAllNotifications: () => {},
    removeNotifications: () => {},
    handleContentOverlayChange: () => {},
});

interface TeddyCloudProviderProps {
    children: ReactNode;
    linkOverlay?: string | null;
}

export function TeddyCloudProvider({ children, linkOverlay }: TeddyCloudProviderProps) {
    const [fetchCloudStatus, setFetchCloudStatus] = useState<boolean>(false);
    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
    const [tonieBoxContentDirs, setTonieboxContentDirs] = useState<Array<[string, string[], string]>>([]);
    const [overlay, setOverlay] = useState("");

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Content dir overlay handling
    useEffect(() => {
        if (linkOverlay) {
            setOverlay(linkOverlay);
            localStorage.setItem("contentOverlay", linkOverlay);
        } else {
            const savedOverlay = localStorage.getItem("contentOverlay");
            if (savedOverlay) setOverlay(savedOverlay);
        }
    }, [linkOverlay]);

    useEffect(() => {
        const fetchContentDirs = async () => {
            const tonieboxData = await api.apiGetTonieboxesIndex();
            const tonieboxContentDirs = await Promise.all(
                tonieboxData.map(async (toniebox) => {
                    const contentDir = await api.apiGetTonieboxContentDir(toniebox.ID);
                    return [contentDir, toniebox.boxName, toniebox.ID] as [string, string, string];
                })
            );

            const groupedContentDirs = tonieboxContentDirs.reduce((acc, [contentDir, boxName, boxID]) => {
                const existingGroupIndex = acc.findIndex((group) => group[0] === contentDir);
                if (existingGroupIndex !== -1) {
                    acc[existingGroupIndex][1].push(boxName);
                    if (overlay === boxID) {
                        setOverlay(acc[existingGroupIndex][2]);
                    }
                } else {
                    acc.push([contentDir, [boxName], boxID]);
                }
                return acc;
            }, [] as [string, string[], string][]);

            const contentDir = await api.apiGetTonieboxContentDir("");
            if (!groupedContentDirs.some((group) => group[0] === contentDir)) {
                groupedContentDirs.push(["", ["TeddyCloud Default Content Dir"], ""]);
            }

            if (!overlay) {
                const firstBoxId = groupedContentDirs.length > 0 ? groupedContentDirs[0][2] : "";
                setOverlay(firstBoxId);
                localStorage.setItem("contentOverlay", firstBoxId);
            }
            setTonieboxContentDirs(groupedContentDirs);
        };
        fetchContentDirs();
    }, [overlay]);

    const handleContentOverlayChange = (newOverlay: string) => {
        setOverlay(newOverlay);
        localStorage.setItem("contentOverlay", newOverlay);
    };

    // Notifications

    useEffect(() => {
        const storedNotifications = localStorage.getItem("notifications");
        if (storedNotifications) {
            const parsedNotifications: NotificationRecord[] = JSON.parse(storedNotifications);
            setNotifications(
                parsedNotifications.map((notification) => ({
                    ...notification,
                    date: new Date(notification.date),
                }))
            );
        }
    }, []);

    const addNotification = (
        type: NotificationType,
        title: string,
        description: string,
        context?: string,
        confirmed?: boolean
    ) => {
        const newNotification: NotificationRecord = {
            uuid: generateUUID(),
            date: new Date(),
            type,
            title,
            description,
            context: context || "",
            flagConfirmed: confirmed !== undefined ? confirmed : type === "success" || type === "info",
        };

        antdNotification.open({
            type,
            message: title,
            description,
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
            description,
            icon: <LoadingOutlined />,
            duration: 0,
            placement: "bottomRight",
        });
    };

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
                tonieBoxContentDirs,
                overlay,
                setOverlay,
                addNotification,
                addLoadingNotification,
                closeLoadingNotification,
                confirmNotification,
                unconfirmedCount,
                clearAllNotifications,
                removeNotifications,
                handleContentOverlayChange,
            }}
        >
            {children}
        </TeddyCloudContext.Provider>
    );
}

export function useTeddyCloud() {
    return useContext(TeddyCloudContext);
}
