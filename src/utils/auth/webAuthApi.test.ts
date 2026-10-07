// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
    apiMock: {
        apiGetTeddyCloudApiRaw: vi.fn(),
        apiPostTeddyCloudJsonRaw: vi.fn(),
    },
}));

vi.mock("../../api", () => ({
    TeddyCloudApi: class {
        apiGetTeddyCloudApiRaw = apiMock.apiGetTeddyCloudApiRaw;
        apiPostTeddyCloudJsonRaw = apiMock.apiPostTeddyCloudJsonRaw;
    },
}));

vi.mock("../../config/defaultApiConfig", () => ({
    defaultAPIConfig: vi.fn(() => ({})),
}));

import {
    changeAuthPassword,
    createAuthUser,
    deleteAuthUser,
    fetchAuthStatus,
    fetchAuthUsers,
    getStoredToken,
    login,
    logout,
    setAuthEnabled,
    setStoredToken,
} from "./webAuthApi";

const jsonResponse = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });

describe("webAuthApi", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
    });

    describe("token storage", () => {
        it("stores and returns a token", () => {
            setStoredToken("abc123");
            expect(getStoredToken()).toBe("abc123");
        });

        it("removes the token when null is passed", () => {
            sessionStorage.setItem("teddycloud_web_token", "abc123");
            setStoredToken(null);
            expect(getStoredToken()).toBeNull();
        });
    });

    describe("fetchAuthStatus", () => {
        it("returns a valid authentication status", async () => {
            apiMock.apiGetTeddyCloudApiRaw.mockResolvedValue(
                jsonResponse({
                    enabled: true,
                    loggedIn: true,
                    username: "alice",
                    envOverride: false,
                    userCount: 2,
                }),
            );

            await expect(fetchAuthStatus()).resolves.toEqual({
                enabled: true,
                loggedIn: true,
                username: "alice",
                envOverride: false,
                userCount: 2,
            });

            expect(apiMock.apiGetTeddyCloudApiRaw).toHaveBeenCalledWith("/api/auth/status");
        });

        it("uses defaults for optional fields", async () => {
            apiMock.apiGetTeddyCloudApiRaw.mockResolvedValue(
                jsonResponse({ enabled: false, loggedIn: false }),
            );

            await expect(fetchAuthStatus()).resolves.toEqual({
                enabled: false,
                loggedIn: false,
                username: "",
                envOverride: false,
                userCount: 0,
            });
        });

        it("rejects a failed status request instead of treating auth as disabled", async () => {
            apiMock.apiGetTeddyCloudApiRaw.mockResolvedValue(
                jsonResponse({ message: "backend unavailable" }, 503),
            );

            await expect(fetchAuthStatus()).rejects.toThrow("backend unavailable");
        });

        it("uses an HTTP fallback message when the backend returns no message", async () => {
            apiMock.apiGetTeddyCloudApiRaw.mockResolvedValue(new Response("", { status: 502 }));

            await expect(fetchAuthStatus()).rejects.toThrow(
                "Could not load authentication status (HTTP 502)",
            );
        });

        it("rejects an invalid status payload instead of coercing missing values to false", async () => {
            apiMock.apiGetTeddyCloudApiRaw.mockResolvedValue(jsonResponse({ username: "alice" }));

            await expect(fetchAuthStatus()).rejects.toThrow(
                "Invalid authentication status response",
            );
        });
    });

    describe("login", () => {
        it("posts credentials, stores the token and returns the refreshed status", async () => {
            apiMock.apiPostTeddyCloudJsonRaw.mockResolvedValue(
                jsonResponse({ token: "new-token" }),
            );
            apiMock.apiGetTeddyCloudApiRaw.mockResolvedValue(
                jsonResponse({
                    enabled: true,
                    loggedIn: true,
                    username: "alice",
                    envOverride: false,
                    userCount: 1,
                }),
            );

            await expect(login("alice", "secret")).resolves.toEqual({
                enabled: true,
                loggedIn: true,
                username: "alice",
                envOverride: false,
                userCount: 1,
            });

            expect(apiMock.apiPostTeddyCloudJsonRaw).toHaveBeenCalledWith("/api/auth/login", {
                username: "alice",
                password: "secret",
            });
            expect(sessionStorage.getItem("teddycloud_web_token")).toBe("new-token");
            expect(apiMock.apiGetTeddyCloudApiRaw).toHaveBeenCalledWith("/api/auth/status");
        });

        it("throws rate_limited for HTTP 429", async () => {
            apiMock.apiPostTeddyCloudJsonRaw.mockResolvedValue(
                jsonResponse({ message: "slow down" }, 429),
            );

            await expect(login("alice", "wrong")).rejects.toThrow("rate_limited");
        });

        it("throws rate_limited when the backend returns that error code", async () => {
            apiMock.apiPostTeddyCloudJsonRaw.mockResolvedValue(
                jsonResponse({ error: "rate_limited" }, 401),
            );

            await expect(login("alice", "wrong")).rejects.toThrow("rate_limited");
        });

        it("propagates the backend login error message", async () => {
            apiMock.apiPostTeddyCloudJsonRaw.mockResolvedValue(
                jsonResponse({ message: "invalid credentials" }, 401),
            );

            await expect(login("alice", "wrong")).rejects.toThrow("invalid credentials");
            expect(sessionStorage.getItem("teddycloud_web_token")).toBeNull();
        });
    });

    describe("logout", () => {
        it("clears the stored token after a successful logout", async () => {
            sessionStorage.setItem("teddycloud_web_token", "token");
            apiMock.apiGetTeddyCloudApiRaw.mockResolvedValue(new Response(null, { status: 200 }));

            await logout();

            expect(apiMock.apiGetTeddyCloudApiRaw).toHaveBeenCalledWith("/api/auth/logout");
            expect(sessionStorage.getItem("teddycloud_web_token")).toBeNull();
        });

        it("clears the stored token even when the logout request fails", async () => {
            sessionStorage.setItem("teddycloud_web_token", "token");
            apiMock.apiGetTeddyCloudApiRaw.mockRejectedValue(new Error("network down"));

            await expect(logout()).rejects.toThrow("network down");
            expect(sessionStorage.getItem("teddycloud_web_token")).toBeNull();
        });
    });

    describe("user administration", () => {
        it("loads users and normalizes an invalid users field", async () => {
            apiMock.apiGetTeddyCloudApiRaw.mockResolvedValue(
                jsonResponse({ users: "invalid", enabled: true, envOverride: false }),
            );

            await expect(fetchAuthUsers()).resolves.toEqual({
                users: [],
                enabled: true,
                envOverride: false,
            });
        });

        it("creates a user with the expected payload", async () => {
            apiMock.apiPostTeddyCloudJsonRaw.mockResolvedValue(jsonResponse({}));

            await createAuthUser("bob", "secret");

            expect(apiMock.apiPostTeddyCloudJsonRaw).toHaveBeenCalledWith(
                "/api/auth/users/create",
                { username: "bob", password: "secret" },
            );
        });

        it("returns authDisabled when deleting the last user", async () => {
            apiMock.apiPostTeddyCloudJsonRaw.mockResolvedValue(
                jsonResponse({ authDisabled: true }),
            );

            await expect(deleteAuthUser("bob")).resolves.toEqual({ authDisabled: true });
            expect(apiMock.apiPostTeddyCloudJsonRaw).toHaveBeenCalledWith(
                "/api/auth/users/delete",
                { username: "bob" },
            );
        });

        it("changes a password with the expected payload", async () => {
            apiMock.apiPostTeddyCloudJsonRaw.mockResolvedValue(jsonResponse({}));

            await changeAuthPassword("bob", "new-secret");

            expect(apiMock.apiPostTeddyCloudJsonRaw).toHaveBeenCalledWith(
                "/api/auth/users/updatePassword",
                { username: "bob", password: "new-secret" },
            );
        });

        it("updates the enabled state with the expected payload", async () => {
            apiMock.apiPostTeddyCloudJsonRaw.mockResolvedValue(jsonResponse({}));

            await setAuthEnabled(true);

            expect(apiMock.apiPostTeddyCloudJsonRaw).toHaveBeenCalledWith("/api/auth/enabled", {
                enabled: true,
            });
        });

        it("propagates user administration errors", async () => {
            apiMock.apiPostTeddyCloudJsonRaw.mockResolvedValue(
                jsonResponse({ message: "cannot create user" }, 400),
            );

            await expect(createAuthUser("bob", "x")).rejects.toThrow("cannot create user");
        });
    });
});
