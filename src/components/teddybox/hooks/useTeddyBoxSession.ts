import { useEffect } from "react";

import { TeddyCloudApi } from "../../../api";
import { defaultAPIConfig } from "../../../config/defaultApiConfig";
import { TEDDYBOX_SESSION_REFRESH_MS } from "../../../constants/teddybox";
import { useAuth } from "../../../provider/AuthProvider";

const api = new TeddyCloudApi(defaultAPIConfig());

/**
 * Keeps the child inside the TeddyBox: back button/gesture, context menu and screen sleep.
 * With web login enabled the session is refreshed regularly, so backends that extend it on refresh
 * keep the child's device logged in while the TeddyBox is used.
 */
export const useTeddyBoxSession = () => {
    const { enabled, loggedIn } = useAuth();

    // Back navigation: push a guard entry and push it again whenever it is popped.
    useEffect(() => {
        const guard = () => window.history.pushState({ teddybox: true }, "", window.location.href);
        guard();
        window.addEventListener("popstate", guard);
        return () => window.removeEventListener("popstate", guard);
    }, []);

    useEffect(() => {
        const prevent = (event: Event) => event.preventDefault();
        document.addEventListener("contextmenu", prevent);
        // Safari pinch zoom
        document.addEventListener("gesturestart", prevent);
        return () => {
            document.removeEventListener("contextmenu", prevent);
            document.removeEventListener("gesturestart", prevent);
        };
    }, []);

    useEffect(() => {
        let lock: WakeLockSentinel | null = null;
        const request = () => {
            if (!("wakeLock" in navigator) || document.visibilityState !== "visible") return;
            navigator.wakeLock
                .request("screen")
                .then((sentinel) => {
                    lock = sentinel;
                })
                .catch(() => undefined);
        };
        request();
        document.addEventListener("visibilitychange", request);
        return () => {
            document.removeEventListener("visibilitychange", request);
            void lock?.release().catch(() => undefined);
        };
    }, []);

    useEffect(() => {
        if (!enabled || !loggedIn) return;
        const refresh = () => {
            api.apiPostTeddyCloudRaw("/api/auth/refresh-token").catch((err) =>
                console.warn("TeddyBox: session refresh failed", err),
            );
        };
        refresh();
        const timer = window.setInterval(refresh, TEDDYBOX_SESSION_REFRESH_MS);
        return () => window.clearInterval(timer);
    }, [enabled, loggedIn]);
};
