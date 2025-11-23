import { Location } from "@remix-run/router";

/**
 * Creates a query string from a params object.
 * Example:
 *   createQueryString({ a: 1, b: "test" })
 *   → "a=1&b=test"
 */
export function createQueryString(params: Record<string, any>): string {
    return Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join("&");
}

/**
 * Extracts the "path" query parameter and returns it normalized.
 * Ensures the result always ends with a slash.
 */
export function getFilePathFromQueryParam(location: Location): string {
    const query = new URLSearchParams(location.search);
    const path = query.get("path");

    if (!path) return "/";

    return path.endsWith("/") ? path : path + "/";
}
