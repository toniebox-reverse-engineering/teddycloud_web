import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthStatus } from "../utils/auth/webAuthApi";
import { setUserStorageScope } from "../utils/storage/userStorage";
import {
    fetchAuthStatus,
    login as apiLogin,
    logout as apiLogout,
    setStoredToken,
} from "../utils/auth/webAuthApi";

type AuthContextValue = AuthStatus & {
    loading: boolean;
    error: string | null;
    statusAvailable: boolean;
    needsLogin: boolean;
    refresh: () => Promise<void>;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const emptyStatus: AuthStatus = {
    enabled: false,
    loggedIn: false,
    username: "",
    envOverride: false,
    userCount: 0,
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [status, setStatusState] = useState<AuthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // GUI settings are stored per user, so the scope must be switched before the UI reads them.
    const setStatus = useCallback((next: AuthStatus) => {
        setUserStorageScope(next.enabled && next.loggedIn ? next.username : "");
        setStatusState(next);
    }, []);

    const refresh = useCallback(async () => {
        setError(null);

        try {
            const next = await fetchAuthStatus();

            setStatus(next);

            if (!next.loggedIn) {
                setStoredToken(null);
            }
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Could not load authentication status";

            setError(message);
            throw err;
        }
    }, [setStatus]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const next = await fetchAuthStatus();

                if (!cancelled) {
                    setStatus(next);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error ? err.message : "Could not load authentication status",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const onAuthRequired = () => {
            setUserStorageScope("");
            setStatusState((current) =>
                current ? { ...current, loggedIn: false, username: "" } : current,
            );
            setStoredToken(null);
        };
        window.addEventListener("teddycloud-auth-required", onAuthRequired);
        return () => window.removeEventListener("teddycloud-auth-required", onAuthRequired);
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        const next = await apiLogin(username, password);
        setStatus(next);
    }, []);

    const logout = useCallback(async () => {
        await apiLogout();
        await refresh();
    }, [refresh]);

    const value = useMemo<AuthContextValue>(
        () => ({
            ...(status ?? emptyStatus),
            loading,
            error,
            statusAvailable: status !== null,
            needsLogin: Boolean(status?.enabled && !status.loggedIn),
            refresh,
            login,
            logout,
        }),
        [status, loading, error, refresh, login, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};
