// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { authApiMock } = vi.hoisted(() => ({
    authApiMock: {
        fetchAuthStatus: vi.fn(),
        login: vi.fn(),
        logout: vi.fn(),
        setStoredToken: vi.fn(),
    },
}));

vi.mock("../utils/auth/webAuthApi", () => authApiMock);

vi.mock("../utils/storage/userStorage", () => ({
    setUserStorageScope: vi.fn(),
}));

import { AuthProvider, useAuth } from "./AuthProvider";

type AuthValue = ReturnType<typeof useAuth>;

const status = (overrides: Partial<AuthValue> = {}) => ({
    enabled: false,
    loggedIn: false,
    username: "",
    envOverride: false,
    userCount: 0,
    ...overrides,
});

describe("AuthProvider", () => {
    let container: HTMLDivElement;
    let root: Root;
    let auth: AuthValue;

    const Probe = () => {
        auth = useAuth();
        return null;
    };

    const renderProvider = async () => {
        await act(async () => {
            root.render(
                <AuthProvider>
                    <Probe />
                </AuthProvider>,
            );
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    it("requires a login after a 401 even if login was disabled when the UI was loaded", async () => {
        authApiMock.fetchAuthStatus.mockResolvedValue(status({ enabled: false }));
        await renderProvider();
        expect(auth.needsLogin).toBe(false);

        act(() => {
            window.dispatchEvent(new Event("teddycloud-auth-required"));
        });

        expect(auth.enabled).toBe(true);
        expect(auth.loggedIn).toBe(false);
        expect(auth.needsLogin).toBe(true);
        expect(authApiMock.setStoredToken).toHaveBeenCalledWith(null);
    });

    it("keeps the status unavailable on a 401 when it was never loaded", async () => {
        authApiMock.fetchAuthStatus.mockRejectedValue(new Error("network down"));
        await renderProvider();

        act(() => {
            window.dispatchEvent(new Event("teddycloud-auth-required"));
        });

        expect(auth.statusAvailable).toBe(false);
        expect(auth.needsLogin).toBe(false);
    });

    it("shows the login page after a successful logout", async () => {
        authApiMock.fetchAuthStatus.mockResolvedValueOnce(
            status({ enabled: true, loggedIn: true, username: "alice", userCount: 1 }),
        );
        await renderProvider();
        expect(auth.loggedIn).toBe(true);

        authApiMock.logout.mockResolvedValue(undefined);
        authApiMock.fetchAuthStatus.mockResolvedValueOnce(status({ enabled: true, userCount: 1 }));
        await act(async () => {
            await auth.logout();
        });

        expect(auth.statusAvailable).toBe(true);
        expect(auth.needsLogin).toBe(true);
    });

    it("drops the logged-in status when logging out while the API is unreachable", async () => {
        authApiMock.fetchAuthStatus.mockResolvedValueOnce(
            status({ enabled: true, loggedIn: true, username: "alice", userCount: 1 }),
        );
        await renderProvider();
        expect(auth.loggedIn).toBe(true);

        authApiMock.logout.mockRejectedValue(new Error("network down"));
        authApiMock.fetchAuthStatus.mockRejectedValue(new Error("network down"));
        await act(async () => {
            await expect(auth.logout()).resolves.toBeUndefined();
        });

        expect(auth.statusAvailable).toBe(false);
        expect(auth.loggedIn).toBe(false);
        expect(auth.error).toBe("network down");
    });
});
