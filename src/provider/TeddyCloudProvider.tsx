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

import {
    NotificationRecord,
    NotificationType,
    NotificationTypeEnum,
} from "../types/teddyCloudNotificationTypes";
import { PluginMeta, TeddyCloudSection } from "../types/pluginsMetaTypes";
import { TeddyCloudApi } from "../api";
import { defaultAPIConfig } from "../config/defaultApiConfig";
import { useBoxModelImages } from "../hooks/useBoxModels";
import { TonieboxImage } from "../types/tonieboxTypes";
import { generateUUID } from "../utils/ids/generateUUID";

const api = new TeddyCloudApi(defaultAPIConfig());

const NOTIFICATIONS_STORAGE_KEY = "notifications";
const MAX_STORED_NOTIFICATIONS = 500;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeNotificationDate = (value: unknown): Date => {
    const parsedDate =
        value instanceof Date
            ? new Date(value.getTime())
            : typeof value === "string" || typeof value === "number"
              ? new Date(value)
              : new Date();

    return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
};

const normalizeStoredNotifications = (value: unknown): NotificationRecord[] => {
    if (!Array.isArray(value)) return [];

    const usedUuids = new Set<string>();

    return value.slice(0, MAX_STORED_NOTIFICATIONS).map((notification) => {
        const raw = isRecord(notification) ? notification : {};
        const rawUuid = typeof raw.uuid === "string" ? raw.uuid : "";
        const uuid = rawUuid && !usedUuids.has(rawUuid) ? rawUuid : generateUUID();
        usedUuids.add(uuid);

        return {
            uuid,
            date: normalizeNotificationDate(raw.date),
            type: (typeof raw.type === "string"
                ? raw.type
                : NotificationTypeEnum.Info) as NotificationType,
            title: typeof raw.title === "string" ? raw.title : "",
            description: typeof raw.description === "string" ? raw.description : "",
            context: typeof raw.context === "string" ? raw.context : "",
            flagConfirmed: Boolean(raw.flagConfirmed),
        };
    });
};

const persistNotifications = (notificationsToPersist: NotificationRecord[]) => {
    if (typeof window === "undefined") return;

    localStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(notificationsToPersist.slice(0, MAX_STORED_NOTIFICATIONS)),
    );
};

const readStoredNotifications = (): NotificationRecord[] => {
    if (typeof window === "undefined") return [];

    try {
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (!stored) return [];

        const parsed = normalizeStoredNotifications(JSON.parse(stored));
        persistNotifications(parsed);
        return parsed;
    } catch (e) {
        console.error("Failed to load notifications", e);
        return [];
    }
};

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
        confirmed?: boolean,
        persist?: boolean,
    ) => void;
    addLoadingNotification: (key: string, message: string, description?: string) => void;
    closeLoadingNotification: (key: string) => Promise<void>;
    confirmNotification: (uuid: string) => void;
    unconfirmedCount: number;
    clearAllNotifications: () => void;
    removeNotifications: (uuid: string[]) => void;
    reloadNotifications: () => void;

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

    /** Increment to trigger tonies list refetch (e.g. after custom model save) */
    toniesRefreshTrigger: number;
    invalidateTonies: () => void;
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
    reloadNotifications: () => {},
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
    toniesRefreshTrigger: 0,
    invalidateTonies: () => {},
});

interface TeddyCloudProviderProps {
    children: ReactNode;
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
    const [toniesRefreshTrigger, setToniesRefreshTrigger] = useState(0);

    const invalidateTonies = useCallback(() => {
        setToniesRefreshTrigger((prev) => prev + 1);
    }, []);

    const { boxModelImages, loading: boxModelImagesLoading } = useBoxModelImages();

    // =====================================
    // Notification Handling
    // =====================================

    const loadStoredNotifications = useCallback(() => {
        const storedNotifications = readStoredNotifications();
        setNotifications(storedNotifications);
        return storedNotifications;
    }, []);

    useEffect(() => {
        loadStoredNotifications();
    }, [loadStoredNotifications]);

    const addNotification = useCallback(
        (
            type: NotificationType,
            title: string,
            description: string,
            context?: string,
            confirmed?: boolean,
            persist?: boolean,
        ) => {
            if (persist === undefined || persist) {
                const newNotification: NotificationRecord = {
                    uuid: generateUUID(),
                    date: new Date(),
                    type,
                    title,
                    description,
                    context: context || "",
                    flagConfirmed:
                        confirmed !== undefined ? confirmed : type === "success" || type === "info",
                };

                setNotifications((prev) => {
                    const updated = [newNotification, ...prev].slice(0, MAX_STORED_NOTIFICATIONS);
                    persistNotifications(updated);
                    return updated;
                });
            }
            setTimeout(() => {
                antdNotification.open({
                    type,
                    title,
                    description,
                    showProgress: true,
                    pauseOnHover: true,
                    placement: "topRight",
                });
            }, 0);
        },
        [],
    );

    const addLoadingNotification = useCallback(
        (key: string, title: string, description?: string) => {
            setTimeout(() => {
                antdNotification.open({
                    key,
                    title,
                    description,
                    icon: <LoadingOutlined />,
                    duration: 0,
                    placement: "topRight",
                });
            }, 0);
        },
        [],
    );

    const closeLoadingNotification = useCallback(async (key: string) => {
        setTimeout(() => antdNotification.destroy(key), 300);
        await sleep(500);
    }, []);

    const confirmNotification = useCallback((uuid: string) => {
        setNotifications((prev) => {
            const updated = prev.map((n) => (n.uuid === uuid ? { ...n, flagConfirmed: true } : n));
            persistNotifications(updated);
            return updated;
        });
    }, []);

    const removeNotifications = useCallback((uuids: string[]) => {
        setNotifications((prev) => {
            const updated = prev.filter((n) => !uuids.includes(n.uuid));
            persistNotifications(updated);
            return updated;
        });
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
        localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    }, []);

    const reloadNotifications = loadStoredNotifications;

    const unconfirmedCount = useMemo(
        () => notifications.filter((n) => !n.flagConfirmed).length,
        [notifications],
    );

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
                    .catch(() => ({ folder, meta: null })),
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
                    standalone: meta.standalone || false,
                    pluginHomepage: meta.pluginHomepage,
                    teddyCloudSection: Object.values(TeddyCloudSection).includes(
                        meta.teddyCloudSection,
                    )
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
                    true,
                );
            }

            if (failed.length) {
                addNotification(
                    NotificationTypeEnum.Error,
                    "Some plugins failed to load",
                    failed.join(", "),
                    "TeddyCloudContext",
                    false,
                );
            }
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                "Loading plugins failed",
                String(error),
                "TeddyCloudContext",
                false,
            );
            console.error(error);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchPlugins();
    }, [fetchPlugins]);

    const getPluginMeta = useCallback(
        (pluginId: string) => plugins.find((p) => p.pluginId === pluginId),
        [plugins],
    );

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
            reloadNotifications,
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
            toniesRefreshTrigger,
            invalidateTonies,
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
            reloadNotifications,
            navOpen,
            subNavOpen,
            currentTCSection,
            plugins,
            getPluginMeta,
            fetchPlugins,
            boxModelImages,
            boxModelImagesLoading,
            toniesRefreshTrigger,
            invalidateTonies,
        ],
    );

    return <TeddyCloudContext.Provider value={contextValue}>{children}</TeddyCloudContext.Provider>;
}

// =====================================
// Hook
// =====================================

export function useTeddyCloud() {
    const context = useContext(TeddyCloudContext);
    if (!context) {
        throw new Error("TeddyCloudContext must be used within an TeddyCloudProvider");
    }
    return context;
}
