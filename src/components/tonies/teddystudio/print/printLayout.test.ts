import { describe, expect, it } from "vitest";
import type { SettingsState } from "../hooks/useSettings";
import { createPrintLayout } from "./printLayout";

const settings = (patch: Partial<SettingsState> = {}): SettingsState => ({
    diameter: "40mm",
    labelShape: "round",
    printMode: "ImageAndText",
    width: "50mm",
    height: "30mm",
    labelSpacingX: "5mm",
    labelSpacingY: "5mm",
    labelBackgroundColor: "#ffffff",
    paperSize: "A4",
    customPaperWidth: "210mm",
    customPaperHeight: "297mm",
    paperMarginTop: "10mm",
    paperMarginLeft: "10mm",
    paperLabelImageBleed: "0mm",
    textFontSize: "14px",
    fontFamily: "sans-serif",
    imagePosition: "center",
    imageScale: 1,
    imageBottom: 0,
    imageLeft: 0,
    contentPadding: "0mm",
    showLanguageFlag: false,
    showModelNo: false,
    showSeriesOnImageLabel: false,
    seriesOnImageLabelRotationDeg: 0,
    seriesOnImageLabelFontSize: "12px",
    printTrackListInsteadTitle: false,
    showLabelBorder: true,
    selectedPaper: undefined,
    ...patch,
});

describe("createPrintLayout", () => {
    it("keeps image/text labels together and wraps groups using millimetres", () => {
        const pages = createPrintLayout(3, settings());

        expect(pages).toHaveLength(1);
        expect(pages[0].placements).toEqual([
            { itemIndex: 0, kind: "image", xMm: 10, yMm: 10, widthMm: 40, heightMm: 40 },
            { itemIndex: 0, kind: "text", xMm: 55, yMm: 10, widthMm: 40, heightMm: 40 },
            { itemIndex: 1, kind: "image", xMm: 100, yMm: 10, widthMm: 40, heightMm: 40 },
            { itemIndex: 1, kind: "text", xMm: 145, yMm: 10, widthMm: 40, heightMm: 40 },
            { itemIndex: 2, kind: "image", xMm: 10, yMm: 55, widthMm: 40, heightMm: 40 },
            { itemIndex: 2, kind: "text", xMm: 55, yMm: 55, widthMm: 40, heightMm: 40 },
        ]);
    });

    it("lays out one label per item in OnlyImage mode", () => {
        const pages = createPrintLayout(5, settings({ printMode: "OnlyImage" }));

        expect(pages[0].placements.map(({ xMm, yMm }) => [xMm, yMm])).toEqual([
            [10, 10],
            [55, 10],
            [100, 10],
            [145, 10],
            [10, 55],
        ]);
    });

    it("stacks image/text labels if the pair cannot fit horizontally", () => {
        const pages = createPrintLayout(
            1,
            settings({
                paperSize: "Custom",
                customPaperWidth: "60mm",
                customPaperHeight: "120mm",
            }),
        );

        expect(pages[0].placements).toEqual([
            { itemIndex: 0, kind: "image", xMm: 10, yMm: 10, widthMm: 40, heightMm: 40 },
            { itemIndex: 0, kind: "text", xMm: 10, yMm: 55, widthMm: 40, heightMm: 40 },
        ]);
    });

    it("starts another PDF page when the next group no longer fits vertically", () => {
        const pages = createPrintLayout(
            2,
            settings({
                printMode: "OnlyImage",
                paperSize: "Custom",
                customPaperWidth: "55mm",
                customPaperHeight: "55mm",
                paperMarginTop: "10mm",
                paperMarginLeft: "10mm",
            }),
        );

        expect(pages).toHaveLength(2);
        expect(pages[0].placements[0]).toMatchObject({ itemIndex: 0, xMm: 10, yMm: 10 });
        expect(pages[1].placements[0]).toMatchObject({ itemIndex: 1, xMm: 10, yMm: 10 });
    });
});
