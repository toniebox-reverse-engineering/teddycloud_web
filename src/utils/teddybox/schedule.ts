/** From a time of day on, the TeddyBox shows this collection (e.g. "18:00" → "Evening"). */
export type TeddyBoxScheduleEntry = { time: string; shelf: string };

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const isScheduleTime = (value: unknown): value is string =>
    typeof value === "string" && TIME.test(value);

const minutesOf = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
};

/** Valid entries, sorted by time. */
export const normalizeSchedule = (raw: unknown): TeddyBoxScheduleEntry[] =>
    (Array.isArray(raw) ? raw : [])
        .filter(
            (entry): entry is TeddyBoxScheduleEntry =>
                !!entry &&
                isScheduleTime(entry.time) &&
                typeof entry.shelf === "string" &&
                !!entry.shelf,
        )
        .map(({ time, shelf }) => ({ time, shelf }))
        .sort((a, b) => minutesOf(a.time) - minutesOf(b.time));

/**
 * Collection the schedule asks for at `now`: the entry whose time passed last, before midnight
 * the one of the previous evening. Undefined without entries for existing collections.
 */
export const scheduledShelf = (
    schedule: TeddyBoxScheduleEntry[] | undefined,
    now: Date,
    shelfIds: string[],
): string | undefined => {
    const entries = normalizeSchedule(schedule).filter((e) => shelfIds.includes(e.shelf));
    if (!entries.length) return undefined;
    const current = now.getHours() * 60 + now.getMinutes();
    const passed = entries.filter((e) => minutesOf(e.time) <= current);
    return (passed.length ? passed[passed.length - 1] : entries[entries.length - 1]).shelf;
};
