/**
 * Runtime URL prefix support.
 *
 * The web UI is served under `/web`, but the whole TeddyCloud instance may sit behind a
 * reverse proxy / ingress (e.g. Home Assistant: `/api/hassio_ingress/<token>/web/...`).
 * The prefix is only known at runtime. The inline script at the top of `index.html` derives it
 * from `window.location.pathname` (everything before the first `/web` path segment) and injects
 * `<base href="<prefix>/web/">`; this module reads the prefix back from that `<base>` element so
 * the detection logic lives in a single place.
 */

let cachedBasePath: string | undefined;

/**
 * Extracts the prefix from a document base URI of the form `<origin><prefix>/web/`.
 * Returns "" when the base URI does not end in `/web/`.
 */
export const basePathFromBaseUri = (baseUri: string): string => {
    const match = new URL(baseUri).pathname.match(/^(.*?)\/web\/$/);
    return match ? match[1] : "";
};

/**
 * Returns the runtime prefix without a trailing slash ("" when the app is served at `/web/`).
 */
export const getBasePath = (): string => {
    if (cachedBasePath === undefined) {
        cachedBasePath =
            typeof document !== "undefined" ? basePathFromBaseUri(document.baseURI) : "";
    }
    return cachedBasePath;
};

/** Clears the memoized prefix. Only meant for tests. */
export const resetBasePathCache = (): void => {
    cachedBasePath = undefined;
};

const isAbsoluteUrl = (url: string): boolean =>
    url.startsWith("//") || /^[a-z][a-z\d+.-]*:/i.test(url);

/**
 * Prepends the runtime prefix to a root-absolute path (`/api/...`, `/content/...`, `/web/...`).
 * Absolute URLs (`http:`, `https:`, `data:`, `blob:`, `//host/...`), relative paths and paths
 * that already carry the prefix are returned unchanged, so it is safe to apply twice.
 */
export const withBase = (path: string): string => {
    const base = getBasePath();
    if (!base || !path || !path.startsWith("/") || path.startsWith("//")) {
        return path;
    }
    if (path === base || path.startsWith(base + "/")) {
        return path;
    }
    return base + path;
};

/**
 * Builds the URL for a backend path (`/content/...`, `/api/...`, a tonie `audioUrl`, ...):
 * the optional build-time `VITE_APP_TEDDYCLOUD_API_URL` (used by the dev server) followed by the
 * prefixed path. Absolute URLs and relative paths are returned unchanged.
 */
export const backendUrl = (path: string): string => {
    if (!path || isAbsoluteUrl(path) || !path.startsWith("/")) {
        return path;
    }
    const apiUrl = String(import.meta.env.VITE_APP_TEDDYCLOUD_API_URL ?? "")
        .trim()
        .replace(/\/$/, "");
    return apiUrl + withBase(path);
};
