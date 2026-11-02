import { describe, expect, it } from "vitest";
import { createTeddyStudioPdfFilename } from "./printFile";

describe("createTeddyStudioPdfFilename", () => {
    it("uses local date and time in a filesystem-safe filename", () => {
        const date = new Date(2026, 9, 17, 8, 49, 48);

        expect(createTeddyStudioPdfFilename(date)).toBe(
            "teddystudio_labels_2026-10-17_08-49-48.pdf",
        );
    });
});
