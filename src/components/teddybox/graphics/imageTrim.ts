import { useEffect, useState } from "react";

/**
 * Transparent margins of a picture as parts of its size, plus its aspect ratio. Tonie pictures
 * often have empty space around the figure; without it a figure would float above the shelf.
 */
export type ImageTrim = {
    top: number;
    right: number;
    bottom: number;
    left: number;
    aspect: number;
};

const SAMPLE = 96;
const ALPHA_MIN = 24;
const cache = new Map<string, Promise<ImageTrim | null>>();

const measure = (src: string): Promise<ImageTrim | null> =>
    new Promise((resolve) => {
        const image = new Image();
        // pictures from another server can only be read with CORS; without it there is no trim
        try {
            if (new URL(src, window.location.href).origin !== window.location.origin) {
                image.crossOrigin = "anonymous";
            }
        } catch {
            resolve(null);
            return;
        }
        image.onerror = () => resolve(null);
        image.onload = () => {
            try {
                const scale = SAMPLE / Math.max(image.naturalWidth, image.naturalHeight);
                const width = Math.max(1, Math.round(image.naturalWidth * scale));
                const height = Math.max(1, Math.round(image.naturalHeight * scale));
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const context = canvas.getContext("2d", { willReadFrequently: true });
                if (!context) return resolve(null);
                context.drawImage(image, 0, 0, width, height);
                const { data } = context.getImageData(0, 0, width, height);
                let top = height;
                let bottom = -1;
                let left = width;
                let right = -1;
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        if (data[(y * width + x) * 4 + 3] < ALPHA_MIN) continue;
                        if (y < top) top = y;
                        if (y > bottom) bottom = y;
                        if (x < left) left = x;
                        if (x > right) right = x;
                    }
                }
                if (bottom < 0) return resolve(null);
                resolve({
                    top: top / height,
                    bottom: (height - 1 - bottom) / height,
                    left: left / width,
                    right: (width - 1 - right) / width,
                    aspect: image.naturalWidth / image.naturalHeight,
                });
            } catch {
                // canvas tainted: the server does not allow reading the picture
                resolve(null);
            }
        };
        image.src = src;
    });

/** Margins of the picture, measured once per address; null while unknown or not readable. */
export const useImageTrim = (src: string): ImageTrim | null => {
    const [trim, setTrim] = useState<ImageTrim | null>(null);
    useEffect(() => {
        setTrim(null);
        if (!src) return;
        let active = true;
        if (!cache.has(src)) cache.set(src, measure(src));
        void cache.get(src)?.then((value) => active && setTrim(value));
        return () => {
            active = false;
        };
    }, [src]);
    return trim;
};

/** The visible part fills the box up to this share, leaving a small gap. */
const FILL = 0.96;

/**
 * Position of the picture inside a box (in percent of the box), so that its visible part stands
 * on the bottom edge (or is centered) and is as large as the box allows. Narrow figures (most
 * original tonies) get as tall as round coins are wide, and taller where the box is higher than
 * wide, up to `maxHeight` box widths.
 *
 * @param ratio width / height of the box
 */
export const trimmedPlacement = (
    trim: ImageTrim,
    centered: boolean,
    ratio = 1,
    maxHeight = 1,
): { left: string; top: string; width: string; height: string } => {
    // in units of the box height: the box is `ratio` wide and 1 high
    const contentWidth = 1 - trim.left - trim.right;
    const contentHeight = 1 - trim.top - trim.bottom;
    // height of the whole picture so that its visible part fits
    const height = Math.min(
        FILL / contentHeight,
        (FILL * ratio) / (contentWidth * trim.aspect),
        (maxHeight * ratio * FILL) / contentHeight,
    );
    const width = height * trim.aspect;
    const left = ratio / 2 - (trim.left + contentWidth / 2) * width;
    const top = centered
        ? 0.5 - (trim.top + contentHeight / 2) * height
        : 1 - (1 - trim.bottom) * height;
    const pct = (value: number) => `${value * 100}%`;
    return {
        left: pct(left / ratio),
        top: pct(top),
        width: pct(width / ratio),
        height: pct(height),
    };
};
