// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TonieCardProps } from "../../types/tonieTypes";

const { apiMock } = vi.hoisted(() => ({
    apiMock: {
        apiGetTeddyCloudApiRaw: vi.fn(),
    },
}));

vi.mock("../../api", () => ({
    TeddyCloudApi: class {
        apiGetTeddyCloudApiRaw = apiMock.apiGetTeddyCloudApiRaw;
    },
}));

vi.mock("../../config/defaultApiConfig", () => ({
    defaultAPIConfig: vi.fn(() => ({})),
}));

import { fetchAllTAFsInLibrary, fetchUnusedTAFsInLibrary } from "./fetchTAFsInLibrary";

const response = (files: any[], status = 200) =>
    new Response(JSON.stringify({ files }), {
        status,
        headers: { "Content-Type": "application/json" },
    });

const file = (name: string, isDir = false) => ({
    name,
    isDir,
    date: 0,
    tafHeader: {},
    tonieInfo: { series: "", episode: "", language: "", model: "", picture: "", tracks: [] },
});

const tonieWithSource = (source: string) => ({ source }) as TonieCardProps;

describe("fetchTAFsInLibrary", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("recursively walks subdirectories and assigns fullPath", async () => {
        apiMock.apiGetTeddyCloudApiRaw.mockImplementation(async (url: string) => {
            if (url.includes("path=&")) {
                return response([file("A", true), file("root.taf")]);
            }
            if (url.includes("path=A&")) {
                return response([file("nested.taf"), file("..", true)]);
            }
            throw new Error(`Unexpected URL: ${url}`);
        });

        const result = await fetchAllTAFsInLibrary();

        expect(result.map((entry) => entry.fullPath)).toEqual([
            "A",
            "root.taf",
            "A/nested.taf",
            "A/..",
        ]);
        expect(apiMock.apiGetTeddyCloudApiRaw).toHaveBeenCalledTimes(2);
    });

    it("passes special and overlay through recursive requests", async () => {
        apiMock.apiGetTeddyCloudApiRaw
            .mockResolvedValueOnce(response([file("Sub Dir", true)]))
            .mockResolvedValueOnce(response([]));

        await fetchAllTAFsInLibrary({ special: "library", overlay: "box-1" });

        expect(apiMock.apiGetTeddyCloudApiRaw).toHaveBeenNthCalledWith(
            1,
            "/api/fileIndexV2?path=&special=library&overlay=box-1",
        );
        expect(apiMock.apiGetTeddyCloudApiRaw).toHaveBeenNthCalledWith(
            2,
            "/api/fileIndexV2?path=Sub%20Dir&special=library&overlay=box-1",
        );
    });

    it("returns an empty result for a non-ok directory response", async () => {
        apiMock.apiGetTeddyCloudApiRaw.mockResolvedValue(new Response(null, { status: 500 }));

        await expect(fetchAllTAFsInLibrary()).resolves.toEqual([]);
    });

    it("returns only unused TAF files and normalizes lib paths", async () => {
        apiMock.apiGetTeddyCloudApiRaw.mockImplementation(async (url: string) => {
            if (url.includes("path=&")) {
                return response([
                    file("Used.TAF"),
                    file("unused.taf"),
                    file("note.mp3"),
                    file("folder", true),
                ]);
            }
            if (url.includes("path=folder&")) {
                return response([]);
            }
            throw new Error(`Unexpected URL: ${url}`);
        });

        const result = await fetchUnusedTAFsInLibrary([
            tonieWithSource("lib:///Used.TAF"),
            tonieWithSource("LIB://does-not-exist.taf"),
        ]);

        expect(result.map((entry) => entry.name)).toEqual(["unused.taf"]);
    });

    it("normalizes encoded paths and backslashes when matching used files", async () => {
        apiMock.apiGetTeddyCloudApiRaw
            .mockResolvedValueOnce(response([file("Folder", true)]))
            .mockResolvedValueOnce(response([file("My File.taf")]));

        const result = await fetchUnusedTAFsInLibrary([
            tonieWithSource("lib://Folder%2FMy%20File.taf"),
            tonieWithSource("lib://folder\\my file.taf"),
        ]);

        expect(result).toEqual([]);
    });
});
