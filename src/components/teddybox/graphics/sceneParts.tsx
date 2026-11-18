import React from "react";

/*
 * Building blocks of the background scenes. All scenes are drawn on a square canvas of
 * 1600 x 1600: phones in portrait show about its middle column (x 360 to 1240), tablets in
 * landscape its middle band. The horizon sits at about y = 1000; details stay beside and above
 * the box, so the TeddyBox and the tonies in the middle stand out.
 */

export const fill: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    display: "block",
};

export const Canvas: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    // walls and floors reach beyond the canvas, so a cut below or above it still shows them
    <svg
        viewBox="0 0 1600 1600"
        preserveAspectRatio="xMidYMid slice"
        style={{ ...fill, overflow: "visible" }}
        aria-hidden
    >
        {children}
    </svg>
);

export const Cloud: React.FC<{ x: number; y: number; s?: number; color?: string }> = ({
    x,
    y,
    s = 1,
    color = "#ffffff",
}) => (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
        <ellipse cx="0" cy="20" rx="70" ry="34" />
        <circle cx="-34" cy="6" r="34" />
        <circle cx="16" cy="-8" r="44" />
        <circle cx="56" cy="10" r="30" />
    </g>
);
