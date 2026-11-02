import { describe, expect, it } from "vitest";
import { buildPdfFromJpegPages } from "./pdfDocument";

describe("buildPdfFromJpegPages", () => {
    it("writes fixed PDF page dimensions and a valid cross-reference table", () => {
        const bytes = buildPdfFromJpegPages([
            {
                jpeg: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
                pixelWidth: 1,
                pixelHeight: 1,
                widthPt: 595.276,
                heightPt: 841.89,
            },
        ]);
        const text = new TextDecoder("latin1").decode(bytes);

        expect(text.startsWith("%PDF-1.4")).toBe(true);
        expect(text).toContain("/MediaBox [0 0 595.276 841.89]");
        expect(text).toContain("/Filter /DCTDecode");
        expect(text).toContain("/PrintScaling /None");
        expect(text).toContain("xref\n0 6");
        expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    });
});
