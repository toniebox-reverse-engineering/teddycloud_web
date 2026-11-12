import { useCallback, useEffect, useState } from "react";

import { isIOS } from "../../../utils/browser/browserUtils";

/*
 * The TeddyBox is installable as its own app ("TeddyBox" icon, starts in the kids mode).
 * On its route the manifest and icons of the admin app are swapped for the TeddyBox ones.
 */

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// The event can fire before the TeddyBox page mounts, so it is captured at module load.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        deferredPrompt = event as BeforeInstallPromptEvent;
        listeners.forEach((l) => l());
    });
    window.addEventListener("appinstalled", () => {
        deferredPrompt = null;
        listeners.forEach((l) => l());
    });
}

const setHeadLink = (rel: string, href: string): (() => void) => {
    const existing = Array.from(document.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`));
    const previous = existing.map((link) => link.getAttribute("href"));
    existing.forEach((link) => link.setAttribute("href", href));
    return () => existing.forEach((link, i) => link.setAttribute("href", previous[i] ?? ""));
};

const setMeta = (name: string, content: string): (() => void) => {
    const meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
    if (!meta) return () => undefined;
    const previous = meta.getAttribute("content");
    meta.setAttribute("content", content);
    return () => meta.setAttribute("content", previous ?? "");
};

/** Swaps manifest, icons and title while the TeddyBox is open. Paths resolve against <base>. */
export const useTeddyBoxManifest = (name: string, color: string) => {
    useEffect(() => {
        const restore = [
            setHeadLink("manifest", "teddybox.webmanifest"),
            setHeadLink("apple-touch-icon", "teddybox-icon-180.png"),
            setMeta("apple-mobile-web-app-title", "Teddybox"),
            setMeta("theme-color", color),
        ];
        const previousTitle = document.title;
        document.title = name || "Teddybox";
        return () => {
            restore.forEach((fn) => fn());
            document.title = previousTitle;
        };
    }, [name, color]);
};

export type TeddyBoxInstallState = "installed" | "available" | "ios" | "insecure" | "unsupported";

export const isStandalone = () =>
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;

/** Whether and how the TeddyBox can be installed on this device. */
export const useTeddyBoxInstall = () => {
    const [, rerender] = useState(0);

    useEffect(() => {
        const listener = () => rerender((n) => n + 1);
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }, []);

    let state: TeddyBoxInstallState;
    if (isStandalone()) state = "installed";
    else if (deferredPrompt) state = "available";
    else if (isIOS()) state = "ios";
    else if (!window.isSecureContext) state = "insecure";
    else state = "unsupported";

    const install = useCallback(async () => {
        const prompt = deferredPrompt;
        if (!prompt) return;
        await prompt.prompt();
        await prompt.userChoice.catch(() => undefined);
        deferredPrompt = null;
        rerender((n) => n + 1);
    }, []);

    return { state, install };
};
