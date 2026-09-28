/**
 * localStorage wrapper that keeps GUI settings (theme, language, filters, ...) per web user.
 *
 * Without web login (or while logged out) the scope is empty and keys are used as before, so
 * existing installations keep their settings. After a login the keys are stored as
 * `user:<username>:<key>`. The first time a user is seen in a browser, the unscoped settings are
 * copied once so the user starts with the settings that were already in use.
 */

const USER_KEY_PREFIX = "user:";
const SEEDED_KEY = "__seeded";

export const USER_STORAGE_SCOPE_EVENT = "teddycloud-user-storage-scope-changed";

let scope = "";

const scopePrefix = (username: string) => `${USER_KEY_PREFIX}${encodeURIComponent(username)}:`;

const scopedKey = (key: string) => (scope ? `${scopePrefix(scope)}${key}` : key);

const seedScope = (username: string) => {
    const prefix = scopePrefix(username);
    if (localStorage.getItem(`${prefix}${SEEDED_KEY}`) !== null) return;

    const unscopedKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith(USER_KEY_PREFIX)) unscopedKeys.push(key);
    }
    unscopedKeys.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value !== null) localStorage.setItem(`${prefix}${key}`, value);
    });
    localStorage.setItem(`${prefix}${SEEDED_KEY}`, "1");
};

/** Select whose settings are used. Pass an empty string when nobody is logged in. */
export const setUserStorageScope = (username: string) => {
    if (username === scope) return;
    try {
        if (username) seedScope(username);
    } catch (e) {
        console.error("Could not prepare user settings", e);
    }
    scope = username;
    window.dispatchEvent(new Event(USER_STORAGE_SCOPE_EVENT));
};

export const userStorage = {
    getItem: (key: string): string | null => localStorage.getItem(scopedKey(key)),
    setItem: (key: string, value: string): void => localStorage.setItem(scopedKey(key), value),
    removeItem: (key: string): void => localStorage.removeItem(scopedKey(key)),
    /** All keys of the current scope, without the user prefix. */
    keys: (): string[] => {
        const prefix = scope ? scopePrefix(scope) : "";
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (scope) {
                if (key.startsWith(prefix) && key !== `${prefix}${SEEDED_KEY}`) {
                    keys.push(key.slice(prefix.length));
                }
            } else if (!key.startsWith(USER_KEY_PREFIX)) {
                keys.push(key);
            }
        }
        return keys;
    },
};
