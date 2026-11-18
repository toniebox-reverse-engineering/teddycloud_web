import { describe, expect, it } from "vitest";

import { normalizeSchedule, scheduledShelf } from "./schedule";

const at = (hours: number, minutes = 0) => new Date(2026, 10, 11, hours, minutes);

describe("schedule", () => {
    const schedule = [
        { time: "18:00", shelf: "evening" },
        { time: "07:00", shelf: "day" },
    ];
    const shelves = ["day", "evening"];

    it("shows the collection of the time that passed last", () => {
        expect(scheduledShelf(schedule, at(7), shelves)).toBe("day");
        expect(scheduledShelf(schedule, at(12, 30), shelves)).toBe("day");
        expect(scheduledShelf(schedule, at(18), shelves)).toBe("evening");
        expect(scheduledShelf(schedule, at(23, 59), shelves)).toBe("evening");
    });

    it("keeps the evening collection after midnight", () => {
        expect(scheduledShelf(schedule, at(2), shelves)).toBe("evening");
    });

    it("ignores invalid entries and removed collections", () => {
        expect(scheduledShelf(schedule, at(12), ["evening"])).toBe("evening");
        expect(scheduledShelf([], at(12), shelves)).toBeUndefined();
        expect(normalizeSchedule([{ time: "25:00", shelf: "x" }, { time: "08:00" }, null])).toEqual(
            [],
        );
    });
});
