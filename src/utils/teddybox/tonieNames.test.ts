import { describe, expect, it } from "vitest";

import { TonieCardProps } from "../../types/tonieTypes";
import { compareTonies, tonieLabel, tonieRank } from "./tonieNames";

const info = (series = "", episode = "", model = "") => ({
    series,
    episode,
    model,
    language: "",
    picture: "",
    tracks: [],
});

const tonie = (ruid: string, patch: Partial<TonieCardProps> = {}) =>
    ({ ruid, source: "", tonieInfo: info(), sourceInfo: info(), ...patch }) as TonieCardProps;

describe("tonie names", () => {
    const official = tonie("e1", { tonieInfo: info("Die Playmos", "Die Würfel", "2000002060") });
    const custom = tonie("e2", { tonieInfo: info("Testtonie", "", "custom_150") });
    const idOnly = tonie("e3", { tonieInfo: info("431165030", "", "custom_007") });
    const fileOnly = tonie("e4", { source: "lib://Hoerspiele/R%C3%A4uber%20Hotzenplotz.taf" });
    const nothing = tonie("e001001f0000001f");

    it("uses the figure, then the audio file, then the id", () => {
        expect(tonieLabel(official)).toBe("Die Playmos – Die Würfel");
        expect(tonieLabel(idOnly)).toBe("e3");
        expect(tonieLabel(fileOnly)).toBe("Räuber Hotzenplotz");
        expect(tonieLabel(nothing)).toBe("e001001f0000001f");
        expect(tonieLabel(undefined, "missing")).toBe("missing");
    });

    it("sorts numbers naturally", () => {
        const coin = (n: number) =>
            tonie(`c${n}`, { tonieInfo: info(`Coin ${n}`, "", "custom_x") });
        expect([coin(10), coin(2), coin(1)].sort(compareTonies).map((t) => tonieLabel(t))).toEqual([
            "Coin 1",
            "Coin 2",
            "Coin 10",
        ]);
    });

    it("lists named tonies first", () => {
        expect([official, custom, fileOnly, idOnly].map(tonieRank)).toEqual([0, 1, 2, 3]);
        const sorted = [nothing, fileOnly, idOnly, custom, official].sort(compareTonies);
        expect(sorted.map((t) => t.ruid)).toEqual(["e1", "e2", "e4", "e3", "e001001f0000001f"]);
    });
});
