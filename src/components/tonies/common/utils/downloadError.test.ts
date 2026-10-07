import { describe, expect, it } from "vitest";

import { describeDownloadError } from "./downloadError";

describe("describeDownloadError", () => {
    it("uses the HTTP status of an error response", () => {
        const error = Object.assign(new Error("Response returned an error code"), {
            response: new Response(null, { status: 404, statusText: "Not Found" }),
        });
        expect(describeDownloadError(error)).toBe("HTTP 404 Not Found");
    });

    it("omits an empty status text", () => {
        const error = Object.assign(new Error("Response returned an error code"), {
            response: new Response(null, { status: 401 }),
        });
        expect(describeDownloadError(error)).toBe("HTTP 401");
    });

    it("prefers the underlying cause of a failed request", () => {
        const error = Object.assign(new Error("The request failed"), {
            cause: new TypeError("Failed to fetch"),
        });
        expect(describeDownloadError(error)).toBe("Failed to fetch");
    });

    it("falls back to the error message or string value", () => {
        expect(describeDownloadError(new Error("boom"))).toBe("boom");
        expect(describeDownloadError("plain")).toBe("plain");
    });
});
