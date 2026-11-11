import React, { useLayoutEffect, useRef, useState } from "react";

import { TEDDYBOX_FIGURE_COLORS } from "../../../constants/teddybox";
import { TonieCardProps } from "../../../types/tonieTypes";
import { toImageSrc } from "../../tonies/common/utils/imagePathUtils";
import { colorFromId, shade } from "./colors";
import { trimmedPlacement, useImageTrim } from "./imageTrim";

/** Teddy figure for tonies without a usable picture (e.g. creative tonies). */
export const PlaceholderFigure: React.FC<{ color: string }> = ({ color }) => (
    <svg viewBox="0 0 240 240" style={{ width: "100%", height: "100%" }} aria-hidden>
        <path d="M76 206 C 70 150, 90 120, 120 120 C 150 120, 170 150, 164 206 Z" fill={color} />
        <path d="M120 128 v 76" stroke={shade(color, -0.2)} strokeWidth="4" opacity="0.5" />
        <circle cx="82" cy="54" r="22" fill={color} />
        <circle cx="158" cy="54" r="22" fill={color} />
        <circle cx="82" cy="54" r="11" fill={shade(color, 0.45)} />
        <circle cx="158" cy="54" r="11" fill={shade(color, 0.45)} />
        <circle cx="120" cy="88" r="48" fill="#f3d3b3" />
        <ellipse cx="120" cy="104" rx="22" ry="16" fill="#fbe7d6" />
        <circle cx="103" cy="82" r="5.5" fill="#2a2a2a" />
        <circle cx="137" cy="82" r="5.5" fill="#2a2a2a" />
        <ellipse cx="120" cy="98" rx="7" ry="5" fill="#2a2a2a" />
        <path
            d="M112 110 q8 7 16 0"
            fill="none"
            stroke="#2a2a2a"
            strokeWidth="3.5"
            strokeLinecap="round"
        />
    </svg>
);

const pictureOf = (tonie: TonieCardProps): string => {
    const picture = tonie.tonieInfo?.picture?.trim() || tonie.sourceInfo?.picture?.trim() || "";
    return picture.endsWith("img_unknown.png") ? "" : picture;
};

/**
 * The tonie picture standing on a small round base, as on a shelf or on the box. Centered
 * without a base (e.g. in the round collection buttons), round pictures keep an even margin.
 */
export const TonieFigure: React.FC<{
    tonie: TonieCardProps;
    size?: string;
    centered?: boolean;
    /** Milky round disc behind the figure, so it stands out on a busy background. */
    backdrop?: boolean;
    /** Only a pale placeholder (the tonie is on the box); the disc stays as it is. */
    faded?: boolean;
    /**
     * Fill the whole parent instead of a square (shelf compartments): narrow figures grow into
     * the height, up to this many box widths.
     */
    fill?: number;
    /** Dragged by this many px: only the figure moves, its disc stays in place. */
    offset?: { x: number; y: number };
}> = ({
    tonie,
    size = "100%",
    centered: centeredProp = false,
    backdrop = false,
    faded = false,
    fill,
    offset,
}) => {
    // on a disc the figure sits in its middle, with an even rim all around
    const centered = centeredProp || backdrop;
    const inner = backdrop ? "84%" : centered || fill ? "100%" : "92%";
    const innerRef = useRef<HTMLDivElement>(null);
    const [ratio, setRatio] = useState(1);
    useLayoutEffect(() => {
        const el = innerRef.current;
        if (!fill || !el) return;
        const update = () => el.clientHeight && setRatio(el.clientWidth / el.clientHeight);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, [fill]);
    const picture = pictureOf(tonie);
    const [failed, setFailed] = useState(false);
    const src = picture ? toImageSrc(picture) : "";
    // stands on its visible lower edge instead of the edge of the picture
    const trim = useImageTrim(src);
    const color = colorFromId(tonie.ruid, TEDDYBOX_FIGURE_COLORS);

    return (
        <div
            style={{
                position: "relative",
                width: fill ? "100%" : size,
                height: fill ? "100%" : undefined,
                aspectRatio: fill ? undefined : "1",
                display: "flex",
                alignItems: centered ? "center" : "flex-end",
                justifyContent: "center",
            }}
        >
            {backdrop && (
                <div
                    style={{
                        position: "absolute",
                        inset: "3%",
                        borderRadius: "50%",
                        background: "#ffffff73",
                        backdropFilter: "blur(4px)",
                        WebkitBackdropFilter: "blur(4px)",
                        boxShadow: "0 2px 8px #0000001f",
                    }}
                />
            )}
            {!centered && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "1%",
                        left: "14%",
                        right: "14%",
                        height: "14%",
                        borderRadius: "50%",
                        background: "radial-gradient(#00000038, #00000000 70%)",
                        opacity: faded ? 0.25 : 1,
                    }}
                />
            )}
            <div
                ref={innerRef}
                data-figure=""
                style={{
                    position: "relative",
                    zIndex: 1,
                    // a dragged figure is shown in full, even when it is the one on the box
                    opacity: faded && !offset ? 0.25 : 1,
                    transform: offset
                        ? `translate(${offset.x}px, ${offset.y}px) scale(1.1)`
                        : undefined,
                    // follows the finger at once, glides back when let go elsewhere
                    transition: offset ? "none" : "opacity 200ms, transform 200ms ease-out",
                    width: inner,
                    height: inner,
                }}
            >
                {picture && !failed ? (
                    <img
                        src={src}
                        alt=""
                        draggable={false}
                        onError={() => setFailed(true)}
                        style={{
                            position: "absolute",
                            objectFit: "contain",
                            pointerEvents: "none",
                            ...(trim
                                ? trimmedPlacement(trim, centered, ratio, fill ?? 1)
                                : {
                                      left: 0,
                                      top: 0,
                                      width: "100%",
                                      height: "100%",
                                      objectPosition: centered ? "50% 50%" : "50% 100%",
                                  }),
                        }}
                    />
                ) : fill ? (
                    // a square at the bottom of the compartment
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            aspectRatio: "1",
                        }}
                    >
                        <PlaceholderFigure color={color} />
                    </div>
                ) : (
                    <PlaceholderFigure color={color} />
                )}
            </div>
        </div>
    );
};
