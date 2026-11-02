// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
    apiMock: {
        apiGetTeddyCloudApiRaw: vi.fn(),
    },
}));

vi.mock("../../../../api", () => ({
    TeddyCloudApi: class {
        apiGetTeddyCloudApiRaw = apiMock.apiGetTeddyCloudApiRaw;
    },
}));

vi.mock("../../../../config/defaultApiConfig", () => ({
    defaultAPIConfig: vi.fn(() => ({})),
}));

import { useAssignSiblingEpisode } from "./useAssignSiblingEpisode";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

type Result = ReturnType<typeof useAssignSiblingEpisode>;

const file = (
    name: string,
    options: { isDir?: boolean; listened?: boolean; audioId?: number } = {},
) => ({
    date: 0,
    isDir: options.isDir ?? false,
    name,
    listened: options.listened,
    tafHeader: options.audioId === undefined ? {} : { audioId: options.audioId },
    tonieInfo: { series: "", episode: "", language: "", model: "", picture: "", tracks: [] },
});

const jsonResponse = (files: any[]) =>
    new Response(JSON.stringify({ files }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });

function mountHook(source: string) {
    const onSelectedSourceChange = vi.fn();
    const setInputValidationSource = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    let current: Result | undefined;

    function Harness() {
        current = useAssignSiblingEpisode({
            source,
            onSelectedSourceChange,
            setInputValidationSource,
        });
        return null;
    }

    act(() => {
        root.render(React.createElement(Harness));
    });

    return {
        get current() {
            if (!current) throw new Error("Hook not rendered");
            return current;
        },
        onSelectedSourceChange,
        setInputValidationSource,
        unmount() {
            act(() => root.unmount());
            container.remove();
        },
    };
}

async function flushPromises() {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
}

describe("useAssignSiblingEpisode", () => {
    let mounted: ReturnType<typeof mountHook> | undefined;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        mounted?.unmount();
        mounted = undefined;
    });

    it("finds the nearest unlistened previous and next files alphabetically", async () => {
        apiMock.apiGetTeddyCloudApiRaw.mockResolvedValue(
            jsonResponse([
                file("04.taf"),
                file("01.taf"),
                file("02.taf", { listened: true }),
                file("03.taf"),
            ]),
        );

        mounted = mountHook("lib://Series/03.taf");
        await flushPromises();

        expect(apiMock.apiGetTeddyCloudApiRaw).toHaveBeenCalledWith(
            "/api/fileIndexV2?path=Series&special=library",
        );
        expect(mounted.current.prevEpisodeFile?.name).toBe("01.taf");
        expect(mounted.current.nextEpisodeFile?.name).toBe("04.taf");
    });

    it("ignores directories and audio-id named files", async () => {
        apiMock.apiGetTeddyCloudApiRaw.mockResolvedValue(
            jsonResponse([
                file("01.taf"),
                file("folder", { isDir: true }),
                file("123.taf", { audioId: 123 }),
                file("02.taf"),
            ]),
        );

        mounted = mountHook("lib://01.taf");
        await flushPromises();

        expect(mounted.current.nextEpisodeFile?.name).toBe("02.taf");
        expect(mounted.current.prevEpisodeAvailable).toBe(false);
    });

    it("uses the first unlistened file as next when current source is not in the folder", async () => {
        apiMock.apiGetTeddyCloudApiRaw.mockResolvedValue(
            jsonResponse([file("01.taf", { listened: true }), file("02.taf")]),
        );

        mounted = mountHook("lib://missing.taf");
        await flushPromises();

        expect(mounted.current.nextEpisodeFile?.name).toBe("02.taf");
        expect(mounted.current.prevEpisodeAvailable).toBe(false);
    });

    it("assigns the selected sibling and clears source validation", async () => {
        apiMock.apiGetTeddyCloudApiRaw.mockResolvedValue(
            jsonResponse([file("01.taf"), file("02.taf")]),
        );

        mounted = mountHook("lib://Series/01.taf");
        await flushPromises();

        act(() => mounted!.current.handleAssignNextEpisode());

        expect(mounted.onSelectedSourceChange).toHaveBeenCalledWith("lib://Series/02.taf");
        expect(mounted.setInputValidationSource).toHaveBeenCalledWith({
            validateStatus: "",
            help: "",
        });
    });

    it("assigns a sibling in the library root without adding an extra slash", async () => {
        apiMock.apiGetTeddyCloudApiRaw.mockResolvedValue(
            jsonResponse([file("01.taf"), file("02.taf")]),
        );

        mounted = mountHook("lib://01.taf");
        await flushPromises();

        act(() => mounted!.current.handleAssignNextEpisode());

        expect(mounted.onSelectedSourceChange).toHaveBeenCalledWith("lib://02.taf");
    });

    it("clears candidates for a non-ok directory response", async () => {
        apiMock.apiGetTeddyCloudApiRaw.mockResolvedValue(
            new Response(null, { status: 500, statusText: "Internal Server Error" }),
        );

        mounted = mountHook("lib://Series/01.taf");
        await flushPromises();

        expect(mounted.current.loading).toBe(false);
        expect(mounted.current.nextEpisodeAvailable).toBe(false);
        expect(mounted.current.prevEpisodeAvailable).toBe(false);
    });

    it("clears candidates when loading fails", async () => {
        apiMock.apiGetTeddyCloudApiRaw.mockRejectedValue(new Error("offline"));

        mounted = mountHook("lib://Series/01.taf");
        await flushPromises();

        expect(mounted.current.loading).toBe(false);
        expect(mounted.current.nextEpisodeAvailable).toBe(false);
        expect(mounted.current.prevEpisodeAvailable).toBe(false);
    });
});
