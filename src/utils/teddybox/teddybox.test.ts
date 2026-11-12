import { describe, expect, it } from "vitest";

import { createPin, sha256Hex, verifyPin } from "./pin";
import {
    fittingTonies,
    normalizeTeddyBoxFile,
    sceneryOf,
    shelfCapacity,
    visibleShelves,
} from "./teddyboxConfig";
import { neighbourTrackStart, trackIndexAt } from "./tracks";

describe("sha256Hex", () => {
    it("matches known digests", () => {
        expect(sha256Hex("")).toBe(
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        );
        expect(sha256Hex("abc")).toBe(
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
        );
        expect(sha256Hex("a".repeat(1000))).toBe(
            "41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3",
        );
    });
});

describe("pin", () => {
    it("verifies only the right pin", () => {
        const stored = createPin("1234");
        expect(stored.hash).not.toContain("1234");
        expect(verifyPin("1234", stored)).toBe(true);
        expect(verifyPin("4321", stored)).toBe(false);
    });
});

describe("normalizeTeddyBoxFile", () => {
    it("fills defaults and drops invalid entries", () => {
        const file = normalizeTeddyBoxFile({
            teddyboxes: [
                { id: "a", name: "Emma", color: "red", shelves: [{ tonies: ["x", "x", 3, "y"] }] },
                { id: "a", name: "duplicate" },
                { name: "no id" },
                null,
            ],
        });
        expect(file.teddyboxes).toHaveLength(1);
        const box = file.teddyboxes[0];
        expect(box.color).toMatch(/^#[0-9a-f]{6}$/i);
        expect(box.background).toBe("room");
        expect(box.shelves[0].tonies).toEqual(["x", "y"]);
        expect(box.options.switching).toEqual({ buttons: false, swipe: false, overview: false });
        expect(box.options.pin).toBeNull();
    });

    it("keeps start volume below the maximum", () => {
        const box = normalizeTeddyBoxFile({
            teddyboxes: [{ id: "a", options: { maxVolume: 3, startVolume: 7 } }],
        }).teddyboxes[0];
        expect(box.options.maxVolume).toBe(3);
        expect(box.options.startVolume).toBe(3);
    });

    it("returns an empty list for garbage", () => {
        expect(normalizeTeddyBoxFile("nope").teddyboxes).toEqual([]);
    });
});

describe("visibleShelves", () => {
    const box = normalizeTeddyBoxFile({
        teddyboxes: [
            {
                id: "a",
                shelves: [1, 2, 3, 4, 5, 6].map((n) => ({ id: `s${n}`, tonies: [] })),
            },
        ],
    }).teddyboxes[0];

    it("shows only the active shelf when switching is off", () => {
        expect(visibleShelves(box, "s3").map((s) => s.id)).toEqual(["s3"]);
        expect(visibleShelves(box, "missing").map((s) => s.id)).toEqual(["s1"]);
    });

    it("shows all shelves with any way to switch", () => {
        box.options.switching = { buttons: true, swipe: false, overview: false };
        expect(visibleShelves(box)).toHaveLength(6);
        box.options.switching = { buttons: false, swipe: true, overview: false };
        expect(visibleShelves(box)).toHaveLength(6);
        box.options.switching = { buttons: false, swipe: false, overview: true };
        expect(visibleShelves(box)).toHaveLength(6);
    });

    it("takes the switching from the old single choice", () => {
        const of = (shelfSwitching: string) =>
            normalizeTeddyBoxFile({ teddyboxes: [{ id: "a", options: { shelfSwitching } }] })
                .teddyboxes[0].options.switching;
        expect(of("off")).toEqual({ buttons: false, swipe: false, overview: false });
        expect(of("simple")).toEqual({ buttons: true, swipe: false, overview: false });
        expect(of("advanced")).toEqual({ buttons: true, swipe: true, overview: true });
    });
});

describe("collection display", () => {
    it("clamps the tonies per row and derives the capacity", () => {
        const box = normalizeTeddyBoxFile({
            teddyboxes: [{ id: "a", shelves: [{ columns: 9 }, { columns: 1 }, {}] }],
        }).teddyboxes[0];
        expect(box.shelves.map((s) => s.columns)).toEqual([4, 2, 3]);
        expect(box.shelves.map((s) => s.display)).toEqual(["shelf", "shelf", "shelf"]);
        expect(shelfCapacity("shelf", 4)).toBe(12);
        expect(shelfCapacity("shelf", 2)).toBe(6);
        expect(shelfCapacity("circle", 2)).toBe(8);
    });

    it("takes the display from the old box-wide layout", () => {
        const many = Array.from({ length: 9 }, (_, i) => `t${i}`);
        const shelves = [{ tonies: ["a"] }, { tonies: many }];
        const of = (layout: string) =>
            normalizeTeddyBoxFile({
                teddyboxes: [{ id: "a", shelves, options: { layout } }],
            }).teddyboxes[0].shelves.map((s) => s.display);
        expect(of("carousel")).toEqual(["circle", "circle"]);
        expect(of("auto")).toEqual(["circle", "shelf"]);
        expect(of("shelf")).toEqual(["shelf", "shelf"]);
    });

    it("keeps only the tonies that fit the display", () => {
        const shelf = normalizeTeddyBoxFile({
            teddyboxes: [
                {
                    id: "a",
                    shelves: [
                        {
                            display: "circle",
                            tonies: Array.from({ length: 10 }, (_, i) => `t${i}`),
                        },
                    ],
                },
            ],
        }).teddyboxes[0].shelves[0];
        expect(fittingTonies(shelf)).toHaveLength(8);
        expect(fittingTonies({ ...shelf, display: "shelf", columns: 2 })).toHaveLength(6);
    });
});

describe("backgrounds", () => {
    const box = normalizeTeddyBoxFile({
        teddyboxes: [
            {
                id: "a",
                background: "space",
                shelves: [
                    {},
                    { background: "ocean" },
                    { background: "image", backgroundImage: "/custom_img/sea.png" },
                    { background: "image" },
                    { background: "lava" },
                ],
            },
        ],
    }).teddyboxes[0];

    it("uses the own background of a collection, else the one of the box", () => {
        expect(box.background).toBe("space");
        expect(box.shelves.map((s) => sceneryOf(box, s))).toEqual([
            { background: "space" },
            { background: "ocean" },
            { background: "space", image: "/custom_img/sea.png" },
            { background: "space" },
            { background: "space" },
        ]);
    });
});

describe("own picture of the box", () => {
    it("is used by collections without an own background", () => {
        const box = normalizeTeddyBoxFile({
            teddyboxes: [
                {
                    id: "a",
                    background: "winter",
                    backgroundImage: "/custom_img/garden.png",
                    shelves: [{}, { background: "ocean" }],
                },
            ],
        }).teddyboxes[0];
        expect(box.shelves.map((s) => sceneryOf(box, s))).toEqual([
            { background: "winter", image: "/custom_img/garden.png" },
            { background: "ocean" },
        ]);
    });
});

describe("plain background color", () => {
    it("keeps valid colors of the plain background only", () => {
        const box = normalizeTeddyBoxFile({
            teddyboxes: [
                {
                    id: "a",
                    background: "plain",
                    backgroundColor: "#123456",
                    shelves: [
                        {},
                        { background: "plain", backgroundColor: "#abcdef" },
                        { background: "plain", backgroundColor: "red" },
                    ],
                },
            ],
        }).teddyboxes[0];
        expect(box.shelves.map((s) => sceneryOf(box, s))).toEqual([
            { background: "plain", color: "#123456" },
            { background: "plain", color: "#abcdef" },
            { background: "plain" },
        ]);
    });
});

describe("tracks", () => {
    const starts = [0, 100, 250, 400];

    it("finds the current track", () => {
        expect(trackIndexAt(starts, 0)).toBe(0);
        expect(trackIndexAt(starts, 99)).toBe(0);
        expect(trackIndexAt(starts, 100)).toBe(1);
        expect(trackIndexAt(starts, 999)).toBe(3);
    });

    it("finds neighbour tracks", () => {
        expect(neighbourTrackStart(starts, 120, 1)).toBe(250);
        expect(neighbourTrackStart(starts, 120, -1)).toBe(0);
        expect(neighbourTrackStart(starts, 10, -1)).toBeNull();
        expect(neighbourTrackStart(starts, 450, 1)).toBeNull();
        expect(neighbourTrackStart([], 10, 1)).toBeNull();
    });
});
