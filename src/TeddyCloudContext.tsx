import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from "react";
import { notification as antdNotification } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

import { NotificationRecord, NotificationType, NotificationTypeEnum } from "./types/teddyCloudNotificationTypes";
import { PluginMeta, TeddyCloudSection } from "./types/pluginsMetaTypes";
import { generateUUID } from "./utils/helpers";
import { TeddyCloudApi } from "./api";
import { defaultAPIConfig } from "./config/defaultApiConfig";
import GetBoxModelImages from "./utils/boxModels";
import { TonieboxImage } from "./types/tonieboxTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

interface TeddyCloudContextType {
    fetchCloudStatus: boolean;
    setFetchCloudStatus: Dispatch<SetStateAction<boolean>>;
    toniesCloudAvailable: boolean;
    setToniesCloudAvailable: (cloudEnabled: boolean) => void;
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
    boxModelImages: { boxModelImages: TonieboxImage[]; loading: boolean };
}

const TeddyCloudContext = createContext<TeddyCloudContextType>({
    fetchCloudStatus: false,
    setFetchCloudStatus: () => {},
    toniesCloudAvailable: false,
    setToniesCloudAvailable: () => {},
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
    boxModelImages: {
        boxModelImages: [],
        loading: false,
    },
});

interface TeddyCloudProviderProps {
    children: ReactNode;
    linkOverlay?: string | null;
}

export function TeddyCloudProvider({ children, linkOverlay }: TeddyCloudProviderProps) {
    const [fetchCloudStatus, setFetchCloudStatus] = useState<boolean>(false);
    const [toniesCloudAvailable, setToniesCloudAvailable] = useState<boolean>(false);

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
            let folders: string[] = [];

            try {
                const response = await api.apiGetTeddyCloudApiRaw(`/api/plugins/getPlugins`);
                if (!response.ok) throw new Error(response.statusText);
                folders = await response.json(); // assuming the API returns a list of folders
            } catch (error) {
                // @ToDo: Remove fallback for WIP till api is available: a manually maintained plugins.json is used
                console.warn(
                    "Using fallback plugin list from plugins/plugins.json due to an error (API most probably not available yet)."
                );
                try {
                    const response = await api.apiGetTeddyCloudApiRaw("/plugins/plugins.json");
                    if (!response.ok) throw new Error("Fallback plugins.json fetch failed");
                    folders = await response.json();
                } catch (fallbackErr) {
                    return;
                }
            }

            const loadedPlugins: PluginMeta[] = [];

            for (const folder of folders.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
                try {
                    const res = await api.apiGetTeddyCloudApiRaw(`/plugins/${folder}/plugin.json`);
                    if (!res.ok) throw new Error(`Failed to fetch plugin: ${folder}`);
                    const meta = await res.json();

                    if (!meta.pluginName) {
                        console.warn(`Skipping "${folder}" — missing pluginName.`);
                        addNotification(
                            NotificationTypeEnum.Warning,
                            `Fetching entry pluginName in plugin.json for "${folder}" failed`,
                            `Fetching entry pluginName in plugin.json for "${folder}" failed, so we skip that plugin`,
                            "TeddyCloudContext",
                            true
                        );
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
                    addNotification(
                        NotificationTypeEnum.Error,
                        `Fetching plugin.json for "${folder}" failed`,
                        `Fetching plugin.json for "${folder}" failed, so we skip that plugin`,
                        "TeddyCloudContext",
                        false
                    );
                }
            }

            setPlugins(loadedPlugins);
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                "Loading plugins failed",
                "Loading plugins failed: " + error,
                "TeddyCloudContext",
                false
            );
            console.error("Error loading plugins:", error);
        }
    };

    useEffect(() => {
        fetchPlugins();
    }, []);

    const getPluginMeta = (pluginId: string) => plugins.find((p) => p.pluginId === pluginId);

    const boxModelImages = GetBoxModelImages();

    return (
        <TeddyCloudContext.Provider
            value={{
                fetchCloudStatus,
                setFetchCloudStatus,
                toniesCloudAvailable,
                setToniesCloudAvailable,
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
                boxModelImages,
            }}
        >
            {children}
        </TeddyCloudContext.Provider>
    );
}

export function useTeddyCloud() {
    return useContext(TeddyCloudContext);
}
