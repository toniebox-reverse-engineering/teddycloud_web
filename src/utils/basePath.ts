/**
 * Runtime URL prefix support.
 *
 * The web UI is served under `/web`, but the whole TeddyCloud instance may sit behind a
 * reverse proxy / ingress (e.g. Home Assistant: `/api/hassio_ingress/<token>/web/...`).
 * The prefix is only known at runtime, so it is derived from `window.location.pathname`:
 * everything before the first `/web` path segment.
 *
 * NOTE: the same logic is duplicated as an inline script in `index.html` (it has to run before
 * any module script is loaded). Keep both in sync.
 */

let cachedBasePath: string | undefined;

/**
 * Returns the runtime prefix without a trailing slash ("" when the app is served at `/web/`).
 */
export const getBasePath = (): string => {
    if (cachedBasePath === undefined) {
        const pathname = typeof window !== "undefined" ? window.location.pathname : "";
        const match = pathname.match(/^(.*?)\/web(?=[/?#]|$)/);
        cachedBasePath = match ? match[1] : "";
    }
    return cachedBasePath;
};

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
