/*
 * Fits a square background scene (1600 x 1600) into the screen so that the box stands on a
 * chosen spot of its floor (e.g. the rug) and as much of the scene as possible stays visible.
 * In portrait the scene is drawn smaller than the screen height, so that most of its width
 * shows; above and below it the sky (or wall) and the floor continue (see SceneryBackground).
 */

export const SCENE_SIZE = 1600;
/** The scene keeps at least this part of the screen height, so it does not get too small. */
const MIN_HEIGHT = 0.7;

export type SceneFit = { left: number; top: number; size: number };

/**
 * @param y screen position (px from the top) where the box touches the floor
 * @param spot height in the scene (of 1600) where the box stands
 */
export const sceneFit = (width: number, height: number, y: number, spot: number): SceneFit => {
    // always the full screen width, otherwise as small as allowed
    const size = Math.max(width, height * MIN_HEIGHT);
    return { left: (width - size) / 2, top: y - (spot / SCENE_SIZE) * size, size };
};
