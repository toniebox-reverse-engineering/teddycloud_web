import { Configuration } from "../api";

/**
 * Use empty basePath in browser so API requests are same-origin (relative URLs).
 * This fixes FetchError when the app is accessed via port forwarding (e.g. devcontainer).
 */
const getBasePath = (): string => {
    const envUrl = import.meta.env.VITE_APP_TEDDYCLOUD_API_URL;
    if (envUrl && String(envUrl).trim()) {
        return String(envUrl).trim();
    }
    if (typeof window !== "undefined") {
        return "";
    }
    return "http://localhost";
};

export const defaultAPIConfig = () =>
    new Configuration({
        basePath: getBasePath(),
        //fetchApi: fetch,
    });
