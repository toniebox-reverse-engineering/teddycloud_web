// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetBasePathCache } from "../utils/basePath";
import { defaultAPIConfig } from "./defaultApiConfig";

const setBaseHref = (href: string) => {
    document.head.querySelectorAll("base").forEach((el) => el.remove());
    const base = document.createElement("base");
    base.href = href;
    document.head.appendChild(base);
    resetBasePathCache();
};

describe("defaultAPIConfig", () => {
    beforeEach(() => {
        sessionStorage.clear();
        vi.stubEnv("VITE_APP_TEDDYCLOUD_API_URL", "");
        setBaseHref("http://localhost/web/");
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
        sessionStorage.clear();
        resetBasePathCache();
    });

    it("adds the stored bearer token and uses same-origin credentials", async () => {
        sessionStorage.setItem("teddycloud_web_token", "test-token");

        const fetchMock = vi
            .spyOn(globalThis, "fetch")
            .mockResolvedValue(new Response(null, { status: 200 }));

        const config = defaultAPIConfig();
        await config.fetchApi!("/api/fileIndexV2", { method: "GET" });

        expect(fetchMock).toHaveBeenCalledTimes(1);

        const [, init] = fetchMock.mock.calls[0];
        const headers = new Headers(init?.headers);

        expect(headers.get("Authorization")).toBe("Bearer test-token");
        expect(init?.credentials).toBe("same-origin");
    });

    it("does not add Authorization when no token is stored", async () => {
        const fetchMock = vi
            .spyOn(globalThis, "fetch")
            .mockResolvedValue(new Response(null, { status: 200 }));

        const config = defaultAPIConfig();
        await config.fetchApi!("/api/stats", { method: "GET" });

        const [, init] = fetchMock.mock.calls[0];
        expect(new Headers(init?.headers).has("Authorization")).toBe(false);
    });

    it("does not overwrite an explicit Authorization header", async () => {
        sessionStorage.setItem("teddycloud_web_token", "stored-token");

        const fetchMock = vi
            .spyOn(globalThis, "fetch")
            .mockResolvedValue(new Response(null, { status: 200 }));

        const config = defaultAPIConfig();
        await config.fetchApi!("/api/test", {
            headers: { Authorization: "Bearer explicit-token" },
        });

        const [, init] = fetchMock.mock.calls[0];
        const headers = new Headers(init?.headers);

        expect(headers.get("Authorization")).toBe("Bearer explicit-token");
    });

    it("keeps existing request headers while adding Authorization", async () => {
        sessionStorage.setItem("teddycloud_web_token", "token");
        const fetchMock = vi
            .spyOn(globalThis, "fetch")
            .mockResolvedValue(new Response(null, { status: 200 }));

        const config = defaultAPIConfig();
        await config.fetchApi!("/api/test", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Test": "yes" },
        });

        const [, init] = fetchMock.mock.calls[0];
        const headers = new Headers(init?.headers);

        expect(headers.get("Authorization")).toBe("Bearer token");
        expect(headers.get("Content-Type")).toBe("application/json");
        expect(headers.get("X-Test")).toBe("yes");
    });

    it("dispatches auth-required for a protected 401 response", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }));
        const authRequired = vi.fn();
        window.addEventListener("teddycloud-auth-required", authRequired);

        try {
            const config = defaultAPIConfig();
            await config.fetchApi!("/api/fileIndexV2", { method: "GET" });

            expect(authRequired).toHaveBeenCalledTimes(1);
        } finally {
            window.removeEventListener("teddycloud-auth-required", authRequired);
        }
    });

    it("does not dispatch auth-required for auth endpoints", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }));
        const authRequired = vi.fn();
        window.addEventListener("teddycloud-auth-required", authRequired);

        try {
            const config = defaultAPIConfig();
            await config.fetchApi!("/api/auth/status", { method: "GET" });

            expect(authRequired).not.toHaveBeenCalled();
        } finally {
            window.removeEventListener("teddycloud-auth-required", authRequired);
        }
    });

    it("does not dispatch auth-required for a successful protected request", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
        const authRequired = vi.fn();
        window.addEventListener("teddycloud-auth-required", authRequired);

        try {
            const config = defaultAPIConfig();
            await config.fetchApi!("/api/fileIndexV2", { method: "GET" });

            expect(authRequired).not.toHaveBeenCalled();
        } finally {
            window.removeEventListener("teddycloud-auth-required", authRequired);
        }
    });

    it("uses the runtime reverse-proxy prefix as basePath", () => {
        setBaseHref("http://localhost/api/hassio_ingress/abc/web/");

        const config = defaultAPIConfig();

        expect(config.basePath).toBe("/api/hassio_ingress/abc");
    });

    it("prefers VITE_APP_TEDDYCLOUD_API_URL over the runtime prefix", () => {
        setBaseHref("http://localhost/api/hassio_ingress/abc/web/");
        vi.stubEnv("VITE_APP_TEDDYCLOUD_API_URL", "http://teddycloud.local:8080");

        const config = defaultAPIConfig();

        expect(config.basePath).toBe("http://teddycloud.local:8080");
    });
});
