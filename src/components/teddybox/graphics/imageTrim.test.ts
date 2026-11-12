import { describe, expect, it } from "vitest";

import { trimmedPlacement } from "./imageTrim";

const num = (value: string) => parseFloat(value) / 100;

/** Visible part of the picture in box units (height 1, width `ratio`). */
const visible = (
    place: ReturnType<typeof trimmedPlacement>,
    trim: { top: number; bottom: number; left: number; right: number },
    ratio = 1,
) => {
    const h = num(place.height);
    const w = num(place.width) * ratio;
    return {
        top: num(place.top) + trim.top * h,
        bottom: num(place.top) + (1 - trim.bottom) * h,
        left: num(place.left) * ratio + trim.left * w,
        right: num(place.left) * ratio + (1 - trim.right) * w,
    };
};

describe("trimmedPlacement", () => {
    // narrow figure in the middle of a square picture, like an original tonie
    const figure = { top: 0.15, bottom: 0.1, left: 0.3, right: 0.3, aspect: 1 };
    // round coin filling its picture
    const coin = { top: 0, bottom: 0, left: 0, right: 0, aspect: 1 };

    it("puts the visible bottom on the bottom edge and fills the height", () => {
        const v = visible(trimmedPlacement(figure, false), figure);
        expect(v.bottom).toBeCloseTo(1);
        expect(v.bottom - v.top).toBeCloseTo(0.96);
        expect((v.left + v.right) / 2).toBeCloseTo(0.5);
    });

    it("lets narrow figures grow into a high box, up to the limit", () => {
        // shelf compartment twice as high as wide
        const place = trimmedPlacement(figure, false, 0.5, 1.6);
        const v = visible(place, figure, 0.5);
        expect(v.bottom - v.top).toBeCloseTo(0.5 * 1.6 * 0.96);
        // a coin in the same box stays as wide as the box
        const c = visible(trimmedPlacement(coin, false, 0.5, 1.6), coin, 0.5);
        expect(c.right - c.left).toBeCloseTo(0.5 * 0.96);
    });

    it("centers the visible part when asked", () => {
        const v = visible(trimmedPlacement(figure, true), figure);
        expect((v.top + v.bottom) / 2).toBeCloseTo(0.5);
    });
});
