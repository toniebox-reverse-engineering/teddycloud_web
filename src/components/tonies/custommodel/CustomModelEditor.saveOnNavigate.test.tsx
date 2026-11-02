// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const { apiMock, notify } = vi.hoisted(() => ({
    apiMock: {
        apiGetTeddyCloudApiRaw: vi.fn(),
        apiPostTeddyCloudRaw: vi.fn(),
    },
    notify: vi.fn(),
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("../../../api", () => ({
    TeddyCloudApi: class {
        apiGetTeddyCloudApiRaw = apiMock.apiGetTeddyCloudApiRaw;
        apiPostTeddyCloudRaw = apiMock.apiPostTeddyCloudRaw;
    },
}));
vi.mock("../../../config/defaultApiConfig", () => ({ defaultAPIConfig: vi.fn(() => ({})) }));
vi.mock("../../../provider/TeddyCloudProvider", () => ({
    useTeddyCloud: () => ({ addNotification: notify, invalidateTonies: vi.fn() }),
}));
vi.mock("../common/modals/SelectImageModal", () => ({ default: () => null }));
vi.mock("../common/modals/SelectAudioModal", () => ({ SelectAudioModal: () => null }));

import { CustomModelEditor } from "./CustomModelEditor";

const entry = (n: number, series: string) => ({
    no: String(n - 1),
    model: `custom-${n}`,
    audio_id: [`10000000${n}`],
    hash: [`${String(n).repeat(40)}`],
    title: `Title ${n}`,
    series,
    episodes: `Episode ${n}`,
    tracks: ["Track 1"],
    release: "0",
    language: "de-de",
    category: "custom",
    pic: "",
});

const ENTRIES = [entry(1, "Alpha"), entry(2, "Beta")];

const json = (body: unknown, ok = true) =>
    ({ ok, status: ok ? 200 : 500, json: async () => body, text: async () => "" }) as any;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const flush = async (ms = 0) => {
    await act(async () => {
        await sleep(ms);
    });
};

const byId = (id: string) => document.getElementById(id) as HTMLInputElement | null;

const setInput = async (id: string, value: string) => {
    const el = byId(id)!;
    await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
        setter.call(el, value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
    });
};

const footerButton = (icon: string) =>
    document
        .querySelector(`.ant-modal-footer .anticon-${icon}`)!
        .closest("button") as HTMLButtonElement;

const click = async (el: Element | null) => {
    await act(async () => {
        (el as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
};

const checkSaveOnNavigate = async () => {
    const box = document.querySelector(".ant-modal-footer input[type=checkbox]");
    expect(box, "save-on-navigate checkbox must exist").not.toBeNull();
    await click(box);
};

describe("CustomModelEditor: save on navigate", () => {
    let container: HTMLDivElement;
    let root: Root;
    let posts: Array<{ path: string; body: any }>;

    // Delay of the POST response, to vary request/response timing.
    const mount = async (postDelayMs: number, postOk = true) => {
        apiMock.apiPostTeddyCloudRaw.mockImplementation(async (path: string, body: string) => {
            await sleep(postDelayMs);
            posts.push({ path, body: JSON.parse(body) });
            return json({}, postOk);
        });
        await act(async () => {
            root.render(
                <CustomModelEditor open onClose={() => {}} mode="full" initialModel="custom-1" />,
            );
        });
        await flush(20);
        expect(byId("model")?.value).toBe("custom-1");
    };

    beforeEach(() => {
        Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: (q: string) => ({
                matches: false,
                media: q,
                addEventListener: () => {},
                removeEventListener: () => {},
                addListener: () => {},
                removeListener: () => {},
                dispatchEvent: () => false,
            }),
        });
        posts = [];
        notify.mockReset();
        apiMock.apiGetTeddyCloudApiRaw.mockImplementation(async (path: string) =>
            path.startsWith("/api/toniesCustomJson")
                ? json(ENTRIES.map((e) => ({ ...e })))
                : json([]),
        );
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        document.body.innerHTML = "";
        vi.clearAllMocks();
    });

    // The race does not depend on network timing, but the fix must hold for any timing.
    it.each([0, 1, 25, 100])(
        "saves the edited entry and moves to the next one (POST latency %ims)",
        async (latency) => {
            await mount(latency);
            await checkSaveOnNavigate();
            await setInput("series", "Alpha edited");

            await click(footerButton("arrow-right"));
            await flush(latency + 50);

            // the *edited* entry, not the next one, was persisted
            expect(posts).toHaveLength(1);
            expect(posts[0].path).toBe("/api/toniesCustomJsonUpsert");
            expect(posts[0].body.model).toBe("custom-1");
            expect(posts[0].body.series).toBe("Alpha edited");

            // no bogus validation message on the page
            expect(document.querySelector(".ant-alert-error")).toBeNull();
            expect(notify).not.toHaveBeenCalled();

            // modal stays open and shows the next entry
            expect(document.querySelector(".ant-modal-footer")).not.toBeNull();
            expect(byId("model")?.value).toBe("custom-2");
            expect(byId("series")?.value).toBe("Beta");
        },
    );

    // Control: proves the harness itself works, independent of save-on-navigate.
    it("control: the plain Save button persists the edited entry", async () => {
        await mount(0);
        await setInput("series", "Alpha edited");
        const save = [...document.querySelectorAll(".ant-modal-footer button")].find(
            (b) => b.textContent === "tonies.teddystudio.save",
        );
        await click(save!);
        await flush(50);
        expect(posts).toHaveLength(1);
        expect(posts[0].body).toMatchObject({ model: "custom-1", series: "Alpha edited" });
    });

    it("does not touch the next entry when saving on navigate", async () => {
        await mount(10);
        await checkSaveOnNavigate();
        await setInput("series", "Alpha edited");
        await click(footerButton("arrow-right"));
        await flush(80);

        // navigating back shows the saved edit of entry 1 and the untouched entry 2 was never posted
        expect(posts.map((p) => p.body.model)).toEqual(["custom-1"]);
        await click(footerButton("arrow-left"));
        await flush(20);
        expect(byId("model")?.value).toBe("custom-1");
        expect(byId("series")?.value).toBe("Alpha edited");
    });

    it("does not save when nothing changed", async () => {
        await mount(0);
        await checkSaveOnNavigate();
        await click(footerButton("arrow-right"));
        await flush(50);
        expect(posts).toHaveLength(0);
        expect(byId("model")?.value).toBe("custom-2");
    });

    it("does not save when the checkbox is off, but still navigates", async () => {
        await mount(0);
        await setInput("series", "Alpha edited");
        await click(footerButton("arrow-right"));
        await flush(50);
        expect(posts).toHaveLength(0);
        expect(byId("model")?.value).toBe("custom-2");
    });

    it("stays on the current entry when the draft is invalid", async () => {
        await mount(0);
        await checkSaveOnNavigate();
        await setInput("series", "");
        await click(footerButton("arrow-right"));
        await flush(50);
        expect(posts).toHaveLength(0);
        expect(byId("model")?.value).toBe("custom-1");
    });

    it("stays on the current entry when the server rejects the save", async () => {
        await mount(0, false);
        await checkSaveOnNavigate();
        await setInput("series", "Alpha edited");
        await click(footerButton("arrow-right"));
        await flush(50);
        expect(byId("model")?.value).toBe("custom-1");
        expect(byId("series")?.value).toBe("Alpha edited");
    });
});
