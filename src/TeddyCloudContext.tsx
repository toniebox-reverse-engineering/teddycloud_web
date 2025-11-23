import {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    useCallback,
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
import { generateUUID } from "./components/common/Helpers";
import { TeddyCloudApi } from "./api";
import { defaultAPIConfig } from "./config/defaultApiConfig";
import { useBoxModelImages } from "./hooks/useBoxModels";
import { TonieboxImage } from "./types/tonieboxTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

// =====================================
// Helpers
// =====================================

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

type IdleScheduler = (cb: () => void) => void;

const scheduleTask: IdleScheduler =
    typeof window !== "undefined" && "requestIdleCallback" in window
        ? (cb) => (window as any).requestIdleCallback(cb)
        : (cb) => setTimeout(cb, 0);

// =====================================
// Context Typen
// =====================================

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
    closeLoadingNotification: (key: string) => Promise<void>;
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
    fetchPlugins: () => Promise<void>;

    boxModelImages: TonieboxImage[];
    boxModelImagesLoading: boolean;
}

const TeddyCloudContext = createContext<TeddyCloudContextType>({
    fetchCloudStatus: false,
    setFetchCloudStatus: () => {},
    toniesCloudAvailable: false,
    setToniesCloudAvailable: () => {},
    notifications: [],
    addNotification: () => {},
    addLoadingNotification: () => {},
    closeLoadingNotification: async () => {},
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
    fetchPlugins: async () => {},
    boxModelImages: [],
    boxModelImagesLoading: false,
});

interface TeddyCloudProviderProps {
    children: ReactNode;
    // linkOverlay ist derzeit ungenutzt – ggf. entfernen oder später sinnvoll einsetzen
    linkOverlay?: string | null;
}

// =====================================
// Provider
// =====================================

export function TeddyCloudProvider({ children }: TeddyCloudProviderProps) {
    const [fetchCloudStatus, setFetchCloudStatus] = useState(false);
    const [toniesCloudAvailable, setToniesCloudAvailable] = useState(false);
    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
    const [navOpen, setNavOpen] = useState(false);
    const [subNavOpen, setSubNavOpen] = useState(false);
    const [currentTCSection, setCurrentTCSection] = useState("");
    const [plugins, setPlugins] = useState<PluginMeta[]>([]);

    const { boxModelImages, loading: boxModelImagesLoading } = useBoxModelImages();

    // =====================================
    // Notifications: lokal aus Storage laden
    // =====================================

    const loadStoredNotifications = useCallback(() => {
        try {
            const stored = localStorage.getItem("notifications");
            if (!stored) return;

            const parsed: (Omit<NotificationRecord, "date"> & { date: string })[] = JSON.parse(stored);
            const chunk = 200;
            let idx = 0;

            const processChunk = () => {
                const slice: NotificationRecord[] = parsed.slice(idx, idx + chunk).map((n) => ({
                    ...n,
                    date: new Date(n.date),
                }));

                setNotifications((prev) => [...prev, ...slice]);

                idx += chunk;
                if (idx < parsed.length) {
                    scheduleTask(processChunk);
                }
            };

            scheduleTask(processChunk);
        } catch (e) {
            console.error("Failed to load notifications", e);
        }
    }, []);

    useEffect(() => {
        scheduleTask(loadStoredNotifications);
    }, [loadStoredNotifications]);

    // =====================================
    // Notification Handling
    // =====================================

    const addNotification = useCallback(
        (type: NotificationType, title: string, description: string, context?: string, confirmed?: boolean) => {
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
        },
        []
    );

    const addLoadingNotification = useCallback((key: string, message: string, description: string) => {
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
    }, []);

    const closeLoadingNotification = useCallback(async (key: string) => {
        setTimeout(() => antdNotification.destroy(key), 300);
        await sleep(500);
    }, []);

    const confirmNotification = useCallback((uuid: string) => {
        setNotifications((prev) => {
            const updated = prev.map((n) => (n.uuid === uuid ? { ...n, flagConfirmed: true } : n));
            localStorage.setItem("notifications", JSON.stringify(updated));
            return updated;
        });
    }, []);

    const removeNotifications = useCallback((uuids: string[]) => {
        setNotifications((prev) => {
            const updated = prev.filter((n) => !uuids.includes(n.uuid));
            localStorage.setItem("notifications", JSON.stringify(updated));
            return updated;
        });
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
        localStorage.removeItem("notifications");
    }, []);

    const unconfirmedCount = useMemo(() => notifications.filter((n) => !n.flagConfirmed).length, [notifications]);

    // =====================================
    // Plugin Handling
    // =====================================

    const fetchPlugins = useCallback(async () => {
        try {
            let folders: string[] = [];

            try {
                const response = await api.apiGetTeddyCloudApiRaw(`/api/plugins/getPlugins`);
                if (response.ok) folders = await response.json();
            } catch {
                // wenn das schon schiefgeht, abbrechen
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
                    "Some plugins missing pluginName",
                    invalid.join(", "),
                    "TeddyCloudContext",
                    true
                );
            }

            if (failed.length) {
                addNotification(
                    NotificationTypeEnum.Error,
                    "Some plugins failed to load",
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
    }, [addNotification]);

    useEffect(() => {
        fetchPlugins();
    }, [fetchPlugins]);

    const getPluginMeta = useCallback((pluginId: string) => plugins.find((p) => p.pluginId === pluginId), [plugins]);

    // =====================================
    // Context Value memoizen
    // =====================================

    const contextValue = useMemo<TeddyCloudContextType>(
        () => ({
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
            boxModelImagesLoading,
        }),
        [
            fetchCloudStatus,
            toniesCloudAvailable,
            notifications,
            addNotification,
            addLoadingNotification,
            closeLoadingNotification,
            confirmNotification,
            unconfirmedCount,
            clearAllNotifications,
            removeNotifications,
            navOpen,
            subNavOpen,
            currentTCSection,
            plugins,
            getPluginMeta,
            fetchPlugins,
            boxModelImages,
            boxModelImagesLoading,
        ]
    );

    return <TeddyCloudContext.Provider value={contextValue}>{children}</TeddyCloudContext.Provider>;
}

// =====================================
// Hook
// =====================================

export function useTeddyCloud() {
    return useContext(TeddyCloudContext);
}
