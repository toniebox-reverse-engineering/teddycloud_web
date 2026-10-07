import { describe, expect, it } from "vitest";

import { createAltPortPatch, isValidAltPort } from "./altPortPatch";

const replaced = (port: number) =>
    JSON.parse(createAltPortPatch(port)).searchAndReplace.map((entry: { replace: string[] }) =>
        entry.replace.filter((b) => b !== "??").join(" "),
    );

describe("createAltPortPatch", () => {
    it("encodes 8443 in every entry", () => {
        // checked against the disassembly of the patched firmware images
        expect(replaced(8443)).toEqual([
            "4f f6 20 33", // movw r3, #0xfb20 (htons)
            "20 fb", // sockaddr port, big endian
            "42 f2 fb 03", // movw r3, #8443
            "42 f2 fb 0a", // movw sl, #8443
        ]);
    });

    it("keeps the original bytes for 443", () => {
        const patch = JSON.parse(createAltPortPatch(443));
        expect(replaced(443)).toEqual([
            "4b f6 01 33",
            "01 bb",
            "40 f2 bb 13",
            "40 f2 bb 1a",
        ]);
        for (const entry of patch.searchAndReplace) {
            expect(entry.replace).toHaveLength(entry.search.length);
        }
    });

    it("accepts only ports 1..65535", () => {
        expect(isValidAltPort(0)).toBe(false);
        expect(isValidAltPort(1)).toBe(true);
        expect(isValidAltPort(65535)).toBe(true);
        expect(isValidAltPort(65536)).toBe(false);
    });
});
