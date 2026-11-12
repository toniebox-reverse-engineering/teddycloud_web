/** Track handling based on the start seconds of each track (trackSeconds of a tonie). */

export const trackIndexAt = (trackSeconds: number[], time: number): number => {
    let index = 0;
    for (let i = 0; i < trackSeconds.length; i++) {
        if (trackSeconds[i] <= time + 0.25) index = i;
        else break;
    }
    return index;
};

/** Start time of the track `direction` steps away, or null when there is none. */
export const neighbourTrackStart = (
    trackSeconds: number[],
    time: number,
    direction: 1 | -1,
): number | null => {
    if (!trackSeconds.length) return null;
    const target = trackIndexAt(trackSeconds, time) + direction;
    if (target < 0 || target >= trackSeconds.length) return null;
    return trackSeconds[target];
};
