/*
 * Places the tonies of the circle view around the TeddyBox. They fill the long sides of the
 * screen first (above and below the box in portrait, left and right in landscape), where there
 * is room, and never cover what the child taps on the box: the ears on top and the knock areas
 * left and right of it. The corners at the top hold the overview button and the parent lock.
 */

/** Height of the box drawing per width (viewBox 400 x 360). */
const BOX_RATIO = 360 / 400;
/** The knock areas reach this far beside the box, per box width (see BodyKnock). */
const KNOCK_REACH = 0.3;
/** ... and this far below it, per box width. */
const KNOCK_BELOW = 0.04;
/** The tap areas of the ears reach a little above the drawing, per box width. */
const EAR_REACH = 0.06;
const MARGIN = 10;
const GAP = 10;
/** Room at the top for the overview button and the parent lock. */
const TOP_RESERVED = 64;
const FIGURE_MIN = 64;
const FIGURE_MAX = 150;
const FIGURE_STEP = 4;

export type RingLayout = {
    /** Width of the box drawing in px; the box is centered on the screen. */
    box: number;
    /** Size of one figure in px. */
    figure: number;
    /** Centers of the figures in px, in the order of the tonies. */
    positions: [number, number][];
};

type Band = {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    /** Side of the box the band lies on: lines run parallel to it, the first one closest. */
    side: "top" | "bottom" | "left" | "right";
};

const horizontal = (band: Band) => band.side === "top" || band.side === "bottom";

/** Figures per line and number of lines that fit into a band. */
const gridOf = (band: Band, figure: number) => {
    const across = Math.floor((band.x1 - band.x0 + GAP) / (figure + GAP));
    const down = Math.floor((band.y1 - band.y0 + GAP) / (figure + GAP));
    return horizontal(band)
        ? { perLine: Math.max(0, across), lines: Math.max(0, down) }
        : { perLine: Math.max(0, down), lines: Math.max(0, across) };
};

const capacityOf = (band: Band, figure: number) => {
    const { perLine, lines } = gridOf(band, figure);
    return perLine * lines;
};

/**
 * Positions of `count` figures in a band: lines parallel to the box, the closest first, each
 * centered on the box and bent a little away from it, so together they ring the box.
 */
const placeInBand = (band: Band, count: number, figure: number, cx: number, cy: number) => {
    const { perLine } = gridOf(band, figure);
    const positions: [number, number][] = [];
    const step = figure + GAP;
    // only a single line is bent; with more lines it would run into the next one
    const curved = count <= perLine;
    let left = count;
    for (let line = 0; left > 0; line++) {
        const inLine = Math.min(perLine, left);
        left -= inLine;
        // centered on the box, moved only as far as needed to keep the whole line in the band
        const half = ((inLine - 1) / 2) * step;
        const [from, to, middle] = horizontal(band)
            ? [band.x0 + figure / 2, band.x1 - figure / 2, cx]
            : [band.y0 + figure / 2, band.y1 - figure / 2, cy];
        const center = Math.min(to - half, Math.max(from + half, middle));
        for (let i = 0; i < inLine; i++) {
            const offset = (i - (inLine - 1) / 2) * step;
            const t = inLine > 1 ? Math.abs(offset) / (((inLine - 1) / 2) * step) : 0;
            if (horizontal(band)) {
                const free = band.y1 - band.y0 - figure - line * step;
                const bend = curved ? Math.min(figure * 0.25, Math.max(0, free)) * t * t : 0;
                const x = center + offset;
                const y =
                    band.side === "top"
                        ? band.y1 - figure / 2 - line * step - bend
                        : band.y0 + figure / 2 + line * step + bend;
                positions.push([x, y]);
            } else {
                const free = band.x1 - band.x0 - figure - line * step;
                const bend = curved ? Math.min(figure * 0.25, Math.max(0, free)) * t * t : 0;
                const y = center + offset;
                const x =
                    band.side === "left"
                        ? band.x1 - figure / 2 - line * step - bend
                        : band.x0 + figure / 2 + line * step + bend;
                positions.push([x, y]);
            }
        }
    }
    return positions;
};

/** Bands around a box of width `box`: the long sides of the screen first, then the short ones. */
const bandsAround = (width: number, height: number, box: number): Band[][] => {
    const cx = width / 2;
    const cy = height / 2;
    const boxTop = cy - (box * BOX_RATIO) / 2;
    const boxBottom = cy + (box * BOX_RATIO) / 2 + box * KNOCK_BELOW;
    const reachLeft = cx - box / 2 - box * KNOCK_REACH;
    const reachRight = cx + box / 2 + box * KNOCK_REACH;
    const top: Band = {
        side: "top",
        x0: MARGIN,
        x1: width - MARGIN,
        y0: TOP_RESERVED,
        y1: boxTop - box * EAR_REACH - GAP,
    };
    const bottom: Band = {
        side: "bottom",
        x0: MARGIN,
        x1: width - MARGIN,
        y0: boxBottom + GAP,
        y1: height - MARGIN,
    };
    const left: Band = {
        side: "left",
        x0: MARGIN,
        x1: reachLeft - GAP,
        y0: TOP_RESERVED,
        y1: height - MARGIN,
    };
    const right: Band = {
        side: "right",
        x0: reachRight + GAP,
        x1: width - MARGIN,
        y0: TOP_RESERVED,
        y1: height - MARGIN,
    };
    if (height >= width) {
        // portrait: above and below the box; beside it only next to the box itself
        const beside = { y0: Math.max(TOP_RESERVED, boxTop), y1: boxBottom };
        return [
            [top, bottom],
            [
                { ...left, ...beside },
                { ...right, ...beside },
            ],
        ];
    }
    // landscape: left and right of the box; above and below only over the box itself
    const over = { x0: reachLeft, x1: reachRight };
    return [
        [left, right],
        [
            { ...top, ...over },
            { ...bottom, ...over },
        ],
    ];
};

/** Splits `count` figures between two opposite bands, evenly as long as both have room. */
const split = (count: number, capacities: [number, number]): [number, number] => {
    const first = Math.min(capacities[0], Math.ceil(count / 2));
    const second = Math.min(capacities[1], count - first);
    return [Math.min(capacities[0], count - second), second];
};

/**
 * Layout for `count` tonies on a screen of `width` x `height` px. In reading order: the first
 * band (top or left) before the opposite one, so the order matches the list of the collection.
 */
export const ringLayout = (width: number, height: number, count: number): RingLayout => {
    const portrait = height >= width;
    const preferredBox = portrait
        ? Math.min(width * 0.62, height * 0.34, 460)
        : Math.min(height * 0.6, width * 0.34, 460);
    const figureMax = Math.min(FIGURE_MAX, Math.min(width, height) * 0.26);
    const cx = width / 2;
    const cy = height / 2;

    let last: RingLayout = { box: preferredBox, figure: FIGURE_MIN, positions: [] };
    // shrink the figures first, then the box, until all tonies fit
    for (let shrink = 1; shrink >= 0.6 - 1e-9; shrink -= 0.1) {
        const box = preferredBox * shrink;
        const [primary, secondary] = bandsAround(width, height, box);
        for (let figure = figureMax; figure >= FIGURE_MIN; figure -= FIGURE_STEP) {
            const roomPrimary = primary.map((band) => capacityOf(band, figure)) as [number, number];
            const roomSecondary = secondary.map((band) => capacityOf(band, figure)) as [
                number,
                number,
            ];
            const [a, b] = split(count, roomPrimary);
            const [c, d] = split(count - a - b, roomSecondary);
            last = {
                box,
                figure,
                positions: [
                    ...placeInBand(primary[0], a, figure, cx, cy),
                    ...placeInBand(primary[1], b, figure, cx, cy),
                    ...placeInBand(secondary[0], c, figure, cx, cy),
                    ...placeInBand(secondary[1], d, figure, cx, cy),
                ],
            };
            if (last.positions.length === count) return last;
        }
    }
    // not enough room even for the smallest figures: as many as fit
    return last;
};
