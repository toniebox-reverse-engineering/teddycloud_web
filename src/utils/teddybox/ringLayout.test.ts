import { describe, expect, it } from "vitest";

import { ringLayout } from "./ringLayout";

const SCREENS: [string, number, number][] = [
    ["small phone", 320, 560],
    ["phone", 390, 740],
    ["phone landscape", 844, 300],
    ["tablet", 768, 920],
    ["tablet landscape", 1024, 660],
];

describe("ringLayout", () => {
    SCREENS.forEach(([name, width, height]) => {
        it(`places 1 to 8 tonies on a ${name} without covering the box`, () => {
            for (let count = 1; count <= 8; count++) {
                const { box, figure, positions } = ringLayout(width, height, count);
                expect(positions).toHaveLength(count);
                const r = figure / 2;
                // box with the knock areas beside and below it
                const boxH = box * 0.9;
                const keepOut = {
                    x0: width / 2 - box * 0.8,
                    x1: width / 2 + box * 0.8,
                    y0: height / 2 - boxH / 2 - box * 0.06,
                    y1: height / 2 + boxH / 2 + box * 0.04,
                };
                positions.forEach(([x, y], i) => {
                    expect(x - r).toBeGreaterThanOrEqual(0);
                    expect(x + r).toBeLessThanOrEqual(width);
                    expect(y + r).toBeLessThanOrEqual(height);
                    // the corners at the top hold the overview button and the lock
                    expect(y - r).toBeGreaterThanOrEqual(64 - 0.5);
                    const overlaps =
                        x + r > keepOut.x0 &&
                        x - r < keepOut.x1 &&
                        y + r > keepOut.y0 &&
                        y - r < keepOut.y1;
                    expect(overlaps, `${name}: tonie ${i + 1} of ${count}`).toBe(false);
                    positions.slice(i + 1).forEach(([x2, y2]) => {
                        expect(Math.hypot(x - x2, y - y2)).toBeGreaterThanOrEqual(figure - 0.5);
                    });
                });
            }
        });
    });

    it("fills the long sides first", () => {
        const portrait = ringLayout(390, 740, 4).positions;
        expect(portrait.every(([, y]) => Math.abs(y - 370) > 100)).toBe(true);
        const landscape = ringLayout(1024, 660, 4).positions;
        expect(landscape.every(([x]) => Math.abs(x - 512) > 150)).toBe(true);
    });
});
