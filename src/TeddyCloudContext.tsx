import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    Dispatch,
    SetStateAction,
    ElementType,
} from "react";
import { notification as antdNotification } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import * as AntIcons from "@ant-design/icons";

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

export function TeddyCloudProvider({ children }: TeddyCloudProviderProps) {
    const [fetchCloudStatus, setFetchCloudStatus] = useState(false);
    const [toniesCloudAvailable, setToniesCloudAvailable] = useState(false);
    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
    const [navOpen, setNavOpen] = useState(false);
    const [subNavOpen, setSubNavOpen] = useState(false);
    const [currentTCSection, setCurrentTCSection] = useState("");
    const [plugins, setPlugins] = useState<PluginMeta[]>([]);

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    useEffect(() => {
        if ("requestIdleCallback" in window) {
            (window as any).requestIdleCallback(loadStoredNotifications);
        } else {
            setTimeout(loadStoredNotifications, 0);
        }
    }, []);

    function loadStoredNotifications() {
        try {
            const stored = localStorage.getItem("notifications");
            if (!stored) return;

            const parsed = JSON.parse(stored);
            const chunk = 200;
            let idx = 0;

            const processChunk = () => {
                const slice = parsed.slice(idx, idx + chunk).map((n: any) => ({
                    ...n,
                    date: new Date(n.date),
                }));

                setNotifications((prev) => [...prev, ...slice]);

                idx += chunk;
                if (idx < parsed.length) {
                    requestIdleCallback(processChunk);
                }
            };

            requestIdleCallback(processChunk);
        } catch (e) {
            console.error("Failed to load notifications", e);
        }
    }

    // ==============================
    // Notification Handling
    // ==============================

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

        setNotifications((prev) => {
            const updated = [newNotification, ...prev];
            // we limit to 500 notifications stored
            if (updated.length > 500) {
                updated.splice(500, updated.length - 500);
            }
            localStorage.setItem("notifications", JSON.stringify(updated));
            return updated;
        });

        setTimeout(() => {
            antdNotification.open({
                type,
                message: title,
                description,
                showProgress: true,
                pauseOnHover: true,
                placement: "topRight",
            });
        }, 0);
    };

    const addLoadingNotification = (key: string, message: string, description: string) => {
        setTimeout(() => {
            antdNotification.open({
                key,
                message,
                description,
                icon: <LoadingOutlined />,
                duration: 0,
                placement: "topRight",
            });
        }, 0);
    };

    const closeLoadingNotification = async (key: string) => {
        setTimeout(() => antdNotification.destroy(key), 300);
        await sleep(500);
    };

    const confirmNotification = (uuid: string) => {
        setNotifications((prev) => {
            const updated = prev.map((n) => (n.uuid === uuid ? { ...n, flagConfirmed: true } : n));
            localStorage.setItem("notifications", JSON.stringify(updated));
            return updated;
        });
    };

    const removeNotifications = (uuids: string[]) => {
        setNotifications((prev) => {
            const updated = prev.filter((n) => !uuids.includes(n.uuid));
            localStorage.setItem("notifications", JSON.stringify(updated));
            return updated;
        });
    };

    const clearAllNotifications = () => {
        setNotifications([]);
        localStorage.removeItem("notifications");
    };

    const unconfirmedCount = notifications.filter((n) => !n.flagConfirmed).length;

    // ==============================
    // Plugin Handling
    // ==============================

    const fetchPlugins = async () => {
        try {
            let folders: string[] = [];

            try {
                const response = await api.apiGetTeddyCloudApiRaw(`/api/plugins/getPlugins`);
                if (response.ok) folders = await response.json();
            } catch {
                return;
            }

            folders.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

            const requests = folders.map((folder) =>
                api
                    .apiGetTeddyCloudApiRaw(`/plugins/${folder}/plugin.json`)
                    .then(async (res) => {
                        if (!res.ok) throw new Error(folder);
                        const meta = await res.json();
                        return { folder, meta };
                    })
                    .catch(() => ({ folder, meta: null }))
            );

            const results = await Promise.all(requests);

            const loadedPlugins: PluginMeta[] = [];
            const invalid: string[] = [];
            const failed: string[] = [];

            for (const { folder, meta } of results) {
                if (!meta) {
                    failed.push(folder);
                    continue;
                }
                if (!meta.pluginName) {
                    invalid.push(folder);
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
                    icon: (meta.icon && meta.icon in AntIcons
                        ? AntIcons[meta.icon as keyof typeof AntIcons]
                        : AntIcons.CodeSandboxOutlined) as ElementType,
                });
            }

            setPlugins(loadedPlugins);

            if (invalid.length) {
                addNotification(
                    NotificationTypeEnum.Warning,
                    `Some plugins missing pluginName`,
                    invalid.join(", "),
                    "TeddyCloudContext",
                    true
                );
            }

            if (failed.length) {
                addNotification(
                    NotificationTypeEnum.Error,
                    `Some plugins failed to load`,
                    failed.join(", "),
                    "TeddyCloudContext",
                    false
                );
            }
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                "Loading plugins failed",
                String(error),
                "TeddyCloudContext",
                false
            );
            console.error(error);
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
