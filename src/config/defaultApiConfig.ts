import { Configuration } from "../api";
import { getBasePath as getRuntimeBasePath } from "../utils/basePath";

/**
 * Use the runtime URL prefix (usually empty) as basePath in browser so API requests are
 * same-origin (relative URLs). This fixes FetchError when the app is accessed via port
 * forwarding (e.g. devcontainer) and keeps working behind a reverse proxy sub-path.
 */
const getBasePath = (): string => {
    const envUrl = import.meta.env.VITE_APP_TEDDYCLOUD_API_URL;
    if (envUrl && String(envUrl).trim()) {
        return String(envUrl).trim();
    }
    if (typeof window !== "undefined") {
        return getRuntimeBasePath();
    }
    return "http://localhost";
};

// Proxied requests such as /content/download pass the cloud's own 401 on; only the web login answers with this body.
const isLoginRequired = async (response: Response): Promise<boolean> => {
    if (response.status !== 401) {
        return false;
    }
    try {
        const body = await response.clone().json();
        return body?.error === "unauthorized";
    } catch {
        return false;
    }
};

export const defaultAPIConfig = () =>
    new Configuration({
        basePath: getBasePath(),
        credentials: "same-origin",
        fetchApi: async (url, init) => {
            const headers = new Headers(init?.headers);
            try {
                const token = sessionStorage.getItem("teddycloud_web_token");
                if (token && !headers.has("Authorization")) {
                    headers.set("Authorization", `Bearer ${token}`);
                }
            } catch {
                /* ignore */
            }
            const response = await fetch(url, { ...init, headers, credentials: "same-origin" });
            const path = typeof url === "string" ? url : url.toString();
            if (!path.includes("/api/auth/") && (await isLoginRequired(response))) {
                window.dispatchEvent(new Event("teddycloud-auth-required"));
            }
            return response;
        },
    });
