import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from "react";
import { notification as antdNotification } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

import { NotificationRecord, NotificationType } from "./types/teddyCloudNotificationTypes";
import { PluginMeta, TeddyCloudSection } from "./types/pluginsMetaTypes";
import { generateUUID } from "./utils/helpers";
import { TeddyCloudApi } from "./api";
import { defaultAPIConfig } from "./config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

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
    navOpen: boolean;
    setNavOpen: (show: boolean) => void;
    subNavOpen: boolean;
    setSubNavOpen: (show: boolean) => void;
    currentTCSection: string;
    setCurrentTCSection: (section: string) => void;
    plugins: PluginMeta[];
    getPluginMeta: (pluginId: string) => PluginMeta | undefined;
    fetchPlugins: () => void;
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
    navOpen: false,
    setNavOpen: () => {},
    subNavOpen: false,
    setSubNavOpen: () => {},
    currentTCSection: "",
    setCurrentTCSection: () => {},
    plugins: [],
    getPluginMeta: () => undefined,
    fetchPlugins: () => {},
});

interface TeddyCloudProviderProps {
    children: ReactNode;
    linkOverlay?: string | null;
}

export function TeddyCloudProvider({ children, linkOverlay }: TeddyCloudProviderProps) {
    const [fetchCloudStatus, setFetchCloudStatus] = useState<boolean>(false);
    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // subnaves
    const [navOpen, setNavOpen] = useState<boolean>(false);
    const [subNavOpen, setSubNavOpen] = useState<boolean>(false);
    const [currentTCSection, setCurrentTCSection] = useState<string>("");

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
            placement: "topRight",
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
            placement: "topRight",
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

    const [plugins, setPlugins] = useState<PluginMeta[]>([]);

    const fetchPlugins = async () => {
        try {
            // @Todo: Add real apicall to get folders
            let pluginFolders: string[] = [];
            try {
                const response = await api.apiGetTeddyCloudApiRaw(`/api/plugins/getPlugins`);

                if (!response.ok) throw new Error(response.statusText);
            } catch (error) {
                pluginFolders = ["helloWorld", "ToniesList", "TeddyStudio"];
            }

            const loadedPlugins: PluginMeta[] = [];

            for (const folder of pluginFolders.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
                try {
                    const res = await fetch(`/web/plugins/${folder}/plugin.json`);
                    if (!res.ok) throw new Error(`Failed to fetch plugin: ${folder}`);
                    const meta = await res.json();

                    if (!meta.pluginName) {
                        console.warn(`Skipping "${folder}" — missing pluginName.`);
                        continue;
                    }

                    loadedPlugins.push({
                        pluginId: folder,
                        pluginName: meta.pluginName,
                        author: meta.author || "",
                        version: meta.version || "",
                        description: meta.description || "",
                        pluginHomepage: meta.pluginHomepage,
                        teddyCloudSection: Object.values(TeddyCloudSection).includes(meta.teddyCloudSection)
                            ? meta.teddyCloudSection
                            : null,
                    });
                } catch (err) {
                    console.warn(`Error loading plugin "${folder}":`, err);
                }
            }

            setPlugins(loadedPlugins);
        } catch (error) {
            console.error("Error loading plugins:", error);
        }
    };

    useEffect(() => {
        fetchPlugins();
    }, []);

    const getPluginMeta = (pluginId: string) => plugins.find((p) => p.pluginId === pluginId);

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
                navOpen,
                setNavOpen,
                subNavOpen,
                setSubNavOpen,
                currentTCSection,
                setCurrentTCSection,
                plugins,
                getPluginMeta,
                fetchPlugins,
            }}
        >
            {children}
        </TeddyCloudContext.Provider>
    );
}

export function useTeddyCloud() {
    return useContext(TeddyCloudContext);
}
