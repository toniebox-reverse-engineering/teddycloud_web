import { describe, expect, it } from "vitest";

import { SCENE_SIZE, sceneFit } from "./sceneFit";

const RUG = 1260;

/** Scene height (of 1600) shown at screen position y. */
const sceneAt = (fit: ReturnType<typeof sceneFit>, y: number) =>
    ((y - fit.top) / fit.size) * SCENE_SIZE;

describe("sceneFit", () => {
    const cases: [string, number, number, number][] = [
        ["phone", 390, 844, 530],
        ["phone landscape", 844, 300, 220],
        ["tablet", 768, 920, 600],
        ["tablet landscape", 1024, 660, 430],
    ];

    cases.forEach(([name, width, height, y]) => {
        it(`fills the ${name} width and puts the box on its spot`, () => {
            const fit = sceneFit(width, height, y, RUG);
            expect(fit.size).toBeGreaterThanOrEqual(width - 0.01);
            expect(fit.size).toBeGreaterThanOrEqual(height * 0.7 - 0.01);
            expect(sceneAt(fit, y)).toBeCloseTo(RUG);
        });
    });

    it("shows most of the width on a phone in portrait", () => {
        const fit = sceneFit(390, 844, 530, RUG);
        expect((390 / fit.size) * SCENE_SIZE).toBeGreaterThan(1000);
    });
});
