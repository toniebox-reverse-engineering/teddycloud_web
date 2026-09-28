const TOKEN_KEY = "teddycloud_web_token";

export type AuthStatus = {
    enabled: boolean;
    loggedIn: boolean;
    username: string;
    envOverride: boolean;
    userCount: number;
};

export type AuthUsersResponse = {
    users: string[];
    enabled: boolean;
    envOverride: boolean;
};

export function getStoredToken(): string | null {
    try {
        return sessionStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

export function setStoredToken(token: string | null): void {
    try {
        if (token) {
            sessionStorage.setItem(TOKEN_KEY, token);
        } else {
            sessionStorage.removeItem(TOKEN_KEY);
        }
    } catch {
        /* ignore */
    }
}

async function parseJson(response: Response): Promise<any> {
    const text = await response.text();
    if (!text) {
        return {};
    }
    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
}

async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    const token = getStoredToken();
    if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(path, {
        ...init,
        headers,
        credentials: "include",
    });
}

export async function fetchAuthStatus(): Promise<AuthStatus> {
    const response = await authFetch("/api/auth/status");
    const data = await parseJson(response);
    return {
        enabled: !!data.enabled,
        loggedIn: !!data.loggedIn,
        username: data.username || "",
        envOverride: !!data.envOverride,
        userCount: Number(data.userCount || 0),
    };
}

export async function login(username: string, password: string): Promise<AuthStatus> {
    const response = await authFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    const data = await parseJson(response);
    if (!response.ok) {
        if (response.status === 429 || data.error === "rate_limited") {
            throw new Error("rate_limited");
        }
        throw new Error(data.message || "Login failed");
    }
    if (data.token) {
        setStoredToken(data.token);
    }
    return fetchAuthStatus();
}

export async function logout(): Promise<void> {
    try {
        await authFetch("/api/auth/logout");
    } finally {
        setStoredToken(null);
    }
}

export async function fetchAuthUsers(): Promise<AuthUsersResponse> {
    const response = await authFetch("/api/auth/users/get");
    const data = await parseJson(response);
    if (!response.ok) {
        throw new Error(data.message || "Could not load users");
    }
    return {
        users: Array.isArray(data.users) ? data.users : [],
        enabled: !!data.enabled,
        envOverride: !!data.envOverride,
    };
}

export async function createAuthUser(username: string, password: string): Promise<void> {
    const response = await authFetch("/api/auth/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    const data = await parseJson(response);
    if (!response.ok) {
        throw new Error(data.message || "Could not create user");
    }
}

export async function deleteAuthUser(username: string): Promise<{ authDisabled: boolean }> {
    const response = await authFetch("/api/auth/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
    });
    const data = await parseJson(response);
    if (!response.ok) {
        throw new Error(data.message || "Could not delete user");
    }
    return { authDisabled: !!data.authDisabled };
}

export async function changeAuthPassword(username: string, password: string): Promise<void> {
    const response = await authFetch("/api/auth/users/updatePassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    const data = await parseJson(response);
    if (!response.ok) {
        throw new Error(data.message || "Could not change password");
    }
}

export async function setAuthEnabled(enabled: boolean): Promise<void> {
    const response = await authFetch("/api/auth/enabled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
    });
    const data = await parseJson(response);
    if (!response.ok) {
        throw new Error(data.message || "Could not update login setting");
    }
}
