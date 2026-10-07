import { describe, expect, it } from "vitest";
import type { CustomEntry, FormValues } from "../types/customModelEditorTypes";
import {
    areStringArraysEqual,
    buildBaseEntryIndex,
    buildSuggestedModel,
    cloneEntry,
    filterValueForEntry,
    findOverriddenBaseEntry,
    isImageFile,
    normalizeAudioPairs,
    normalizeEntryFromApi,
    normalizeTracks,
    sortValueForEntry,
    toEntry,
    toFormValues,
} from "./customModelEditorUtils";

const entry = (overrides: Partial<CustomEntry> = {}): CustomEntry => ({
    model: "custom-1",
    series: "Series",
    ...overrides,
});

describe("customModelEditorUtils", () => {
    it("deep-clones entries", () => {
        const original = entry({ tracks: ["A"], audio_id: ["1"], hash: ["ABC"] });
        const cloned = cloneEntry(original);

        cloned.tracks![0] = "Changed";
        cloned.audio_id![0] = "2";

        expect(original.tracks).toEqual(["A"]);
        expect(original.audio_id).toEqual(["1"]);
    });

    it("normalizes audio pairs and hashes", () => {
        expect(
            normalizeAudioPairs(entry({ audio_id: [" 123 ", ""], hash: [" AABB ", ""] })),
        ).toEqual(["123::aabb"]);
    });

    it("normalizes tracks, keeps unnamed tracks in between and drops trailing empty rows", () => {
        expect(normalizeTracks(entry({ tracks: [" One ", "", "  Two", " ", ""] }))).toEqual([
            "One",
            "",
            "Two",
        ]);
        expect(normalizeTracks(entry({ tracks: ["", " "] }))).toEqual([]);
    });

    it("finds the original entry a custom entry overrides by audio or by model", () => {
        const original = entry({ model: "01-0004", audio_id: ["42"], hash: ["ABC"] });
        const index = buildBaseEntryIndex([original]);

        expect(findOverriddenBaseEntry(entry({ audio_id: ["42"], hash: ["abc"] }), index)).toBe(
            original,
        );
        expect(findOverriddenBaseEntry(entry({ model: "01-0004" }), index)).toBe(original);
        expect(
            findOverriddenBaseEntry(entry({ audio_id: ["43"], hash: ["abc"] }), index),
        ).toBeUndefined();
    });

    it("builds the next custom model id and ignores unrelated models", () => {
        expect(
            buildSuggestedModel([
                entry({ model: "custom-2" }),
                entry({ model: "CUSTOM-9" }),
                entry({ model: "official-100" }),
            ]),
        ).toBe("custom-10");
    });

    it("normalizes malformed API entries into a stable CustomEntry", () => {
        expect(
            normalizeEntryFromApi({
                model: 123,
                series: " Series ",
                audio_id: "42",
                hash: [" ABC ", ""],
                tracks: " Single Track ",
                no: " ",
            }),
        ).toEqual({
            no: undefined,
            model: "123",
            audio_id: ["42"],
            hash: ["ABC"],
            title: undefined,
            series: "Series",
            episodes: undefined,
            tracks: ["Single Track"],
            release: undefined,
            language: undefined,
            category: undefined,
            pic: undefined,
        });
    });

    it("converts form values to an entry and drops incomplete audio pairs", () => {
        const values: FormValues = {
            model: " custom-4 ",
            series: " My Series ",
            title: " Title ",
            language: "de-de",
            audioPairs: [
                { audio_id: " 123 ", hash: " ABC " },
                { audio_id: "456", hash: "" },
            ],
            tracks: [{ track: " One " }, { track: "" }],
        };

        const result = toEntry(values);

        expect(result.model).toBe("custom-4");
        expect(result.series).toBe("My Series");
        expect(result.title).toBe("Title");
        expect(result.audio_id).toEqual(["123"]);
        expect(result.hash).toEqual(["ABC"]);
        expect(result.tracks).toEqual(["One"]);
        expect(result.language?.toLowerCase()).toBe("de-de");
    });

    it("always provides at least one empty form row for missing audio and tracks", () => {
        const values = toFormValues(entry());

        expect(values.audioPairs).toEqual([{ audio_id: "", hash: "", path: "" }]);
        expect(values.tracks).toEqual([{ track: "" }]);
    });

    it("provides stable sort/filter values and recognizes image extensions", () => {
        const value = entry({ model: " Custom-7 ", title: " Zebra ", series: " Beta " });

        expect(sortValueForEntry(value, "title")).toBe("zebra");
        expect(filterValueForEntry(value, "series")).toBe("Beta");
        expect(isImageFile("cover.PNG")).toBe(true);
        expect(isImageFile("cover.txt")).toBe(false);
        expect(areStringArraysEqual(["a", "b"], ["a", "b"])).toBe(true);
        expect(areStringArraysEqual(["a", "b"], ["b", "a"])).toBe(false);
    });
});
