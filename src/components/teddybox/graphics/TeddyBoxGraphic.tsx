import React, { useId } from "react";

import { shade } from "./colors";

export type TeddyBoxEar = "small" | "large";

interface TeddyBoxGraphicProps {
    color: string;
    pressedEar?: TeddyBoxEar | null;
    sleeping?: boolean;
    onEar?: (ear: TeddyBoxEar) => void;
    earLabels?: Record<TeddyBoxEar, string>;
    /** Track position, shown as lights at the bottom of the grille. */
    tracks?: { index: number; count: number };
    /** Volume shown on the grille for a moment after an ear was pressed. */
    volume?: { value: number; max: number; steps: number } | null;
    className?: string;
    style?: React.CSSProperties;
}

/** Most tracks shown as single lights; more get a progress bar. */
export const TEDDYBOX_TRACK_LIGHTS = 12;
const LIGHT_Y = 282;

/** Track lights in one row on the grille, always in one line. */
const TrackLights: React.FC<{ index: number; count: number; cream: string }> = ({
    index,
    count,
    cream,
}) => {
    if (count <= TEDDYBOX_TRACK_LIGHTS) {
        const gap = Math.min(30, 196 / Math.max(1, count - 1));
        const start = 200 - (gap * (count - 1)) / 2;
        return (
            <g>
                {Array.from({ length: count }, (_, i) => (
                    <circle
                        key={i}
                        cx={start + i * gap}
                        cy={LIGHT_Y}
                        r={i === index ? (count > 8 ? 7 : 9) : count > 8 ? 5.5 : 7}
                        fill={i === index ? "#ffd34d" : cream}
                        opacity={i === index ? 1 : i < index ? 0.9 : 0.35}
                    />
                ))}
            </g>
        );
    }
    const progress = (index + 1) / count;
    return (
        <g strokeLinecap="round" strokeWidth={10}>
            <line x1={115} x2={285} y1={LIGHT_Y} y2={LIGHT_Y} stroke={cream} opacity={0.35} />
            <line x1={115} x2={115 + 170 * progress} y1={LIGHT_Y} y2={LIGHT_Y} stroke="#ffd34d" />
        </g>
    );
};

/** Volume bars on the grille, growing from left to right up to the allowed maximum. */
const VolumeBars: React.FC<{ value: number; max: number; steps: number; cream: string }> = ({
    value,
    max,
    steps,
    cream,
}) => {
    const width = 16;
    const gap = 8;
    const start = 200 - (max * width + (max - 1) * gap) / 2;
    return (
        <g>
            {Array.from({ length: max }, (_, i) => {
                const height = 18 + ((i + 1) / steps) * 70;
                return (
                    <rect
                        key={i}
                        x={start + i * (width + gap)}
                        y={268 - height}
                        width={width}
                        height={height}
                        rx={4}
                        fill={i < value ? "#ffd34d" : cream}
                        opacity={i < value ? 1 : 0.3}
                    />
                );
            })}
        </g>
    );
};

/** Platform center in viewBox units, used to place the figure on top of the box. */
export const TEDDYBOX_VIEWBOX = { width: 400, height: 360, platformX: 200, platformY: 112 };

const FUR = [
    "M-10 -6 q4 -8 10 -10",
    "M-4 4 q4 -9 12 -10",
    "M-14 6 q3 -6 8 -8",
    "M2 12 q5 -6 10 -6",
];

const Ear: React.FC<{
    cx: number;
    cy: number;
    r: number;
    color: string;
    pressed: boolean;
    label?: string;
    onPress?: () => void;
    uid: string;
}> = ({ cx, cy, r, color, pressed, label, onPress, uid }) => {
    const interactive = !!onPress;
    return (
        <g
            role={interactive ? "button" : undefined}
            aria-label={label}
            tabIndex={interactive ? 0 : undefined}
            onPointerDown={
                interactive
                    ? (e) => {
                          e.preventDefault();
                          onPress?.();
                      }
                    : undefined
            }
            onKeyDown={
                interactive
                    ? (e) => {
                          if (e.key === "Enter" || e.key === " ") onPress?.();
                      }
                    : undefined
            }
            style={{
                cursor: interactive ? "pointer" : undefined,
                transformBox: "fill-box",
                transformOrigin: "50% 100%",
                transform: pressed ? "scale(0.86) translateY(8px)" : "none",
                transition: "transform 120ms ease-out",
                outline: "none",
                // no blue rectangle on phones when tapped: the ear moves instead
                WebkitTapHighlightColor: "transparent",
            }}
        >
            {/* generous invisible hit area for small fingers */}
            {interactive && <circle cx={cx} cy={cy} r={r * 1.35} fill="transparent" />}
            <ellipse cx={cx} cy={cy} rx={r} ry={r * 1.08} fill={shade(color, -0.22)} />
            <ellipse
                cx={cx - r * 0.12}
                cy={cy - r * 0.18}
                rx={r * 0.82}
                ry={r * 0.86}
                fill={shade(color, -0.12)}
            />
            <ellipse
                cx={cx}
                cy={cy + r * 0.06}
                rx={r * 0.58}
                ry={r * 0.64}
                fill={`url(#${uid}-inner)`}
            />
            <g
                transform={`translate(${cx} ${cy + r * 0.08}) scale(${r / 40})`}
                fill="none"
                stroke={shade(color, 0.55)}
                strokeWidth={2.2}
                strokeLinecap="round"
                opacity={0.8}
            >
                {FUR.map((d) => (
                    <path key={d} d={d} />
                ))}
            </g>
            <path
                d={`M ${cx - r * 0.86} ${cy - r * 0.1} A ${r * 0.9} ${r * 0.98} 0 0 1 ${cx + r * 0.86} ${cy - r * 0.1}`}
                fill="none"
                stroke={shade(color, 0.35)}
                strokeWidth={2.5}
                strokeDasharray="5 6"
                strokeLinecap="round"
                opacity={0.7}
            />
        </g>
    );
};

/** The TeddyBox: a cube speaker with a small and a large teddy ear and a paw on the grille. */
export const TeddyBoxGraphic: React.FC<TeddyBoxGraphicProps> = ({
    color,
    pressedEar = null,
    sleeping = false,
    onEar,
    earLabels,
    tracks,
    volume,
    className,
    style,
}) => {
    const uid = useId().replace(/:/g, "");
    const body = color;
    const dark = shade(color, -0.25);
    const darker = shade(color, -0.4);
    const light = shade(color, 0.25);
    const cream = "#fdeee6";

    return (
        <svg
            viewBox={`0 0 ${TEDDYBOX_VIEWBOX.width} ${TEDDYBOX_VIEWBOX.height}`}
            className={className}
            style={{ WebkitTapHighlightColor: "transparent", ...style }}
            aria-hidden={onEar ? undefined : true}
        >
            <defs>
                <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={light} />
                    <stop offset="0.35" stopColor={body} />
                    <stop offset="1" stopColor={shade(color, -0.12)} />
                </linearGradient>
                <radialGradient id={`${uid}-inner`} cx="0.5" cy="0.4" r="0.6">
                    <stop offset="0" stopColor="#ffd2c4" />
                    <stop offset="1" stopColor="#f1a08c" />
                </radialGradient>
                <linearGradient id={`${uid}-grille`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={dark} />
                    <stop offset="1" stopColor={shade(color, -0.18)} />
                </linearGradient>
                <pattern
                    id={`${uid}-dots`}
                    width="14"
                    height="14"
                    patternUnits="userSpaceOnUse"
                    x="2"
                    y="4"
                >
                    <circle cx="7" cy="7" r="2.8" fill={darker} />
                    <circle cx="6.2" cy="6.2" r="1" fill={shade(color, 0.1)} opacity="0.5" />
                </pattern>
                <radialGradient id={`${uid}-platform`} cx="0.5" cy="0.35" r="0.7">
                    <stop offset="0" stopColor={shade(color, 0.35)} />
                    <stop offset="1" stopColor={shade(color, 0.05)} />
                </radialGradient>
            </defs>

            <ellipse cx="200" cy="338" rx="160" ry="15" fill="#000" opacity="0.14" />

            <Ear
                uid={uid}
                cx={90}
                cy={84}
                r={42}
                color={color}
                pressed={pressedEar === "small"}
                label={earLabels?.small}
                onPress={onEar ? () => onEar("small") : undefined}
            />
            <Ear
                uid={uid}
                cx={312}
                cy={68}
                r={58}
                color={color}
                pressed={pressedEar === "large"}
                label={earLabels?.large}
                onPress={onEar ? () => onEar("large") : undefined}
            />

            {/* feet */}
            <rect x="92" y="312" width="52" height="22" rx="10" fill={darker} />
            <rect x="256" y="312" width="52" height="22" rx="10" fill={darker} />

            {/* body */}
            <rect x="52" y="112" width="296" height="212" rx="52" fill={`url(#${uid}-body)`} />
            <path
                d="M 70 150 Q 72 124 104 120 L 296 120 Q 328 124 330 150"
                fill="none"
                stroke="#fff"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.22"
            />
            <rect
                x="66"
                y="146"
                width="268"
                height="164"
                rx="40"
                fill="none"
                stroke={shade(color, 0.3)}
                strokeWidth="2.5"
                strokeDasharray="7 7"
                opacity="0.6"
            />

            {/* grille */}
            <rect x="88" y="160" width="224" height="136" rx="32" fill={`url(#${uid}-grille)`} />
            <rect x="88" y="160" width="224" height="136" rx="32" fill={`url(#${uid}-dots)`} />
            <rect
                x="88"
                y="160"
                width="224"
                height="136"
                rx="32"
                fill="none"
                stroke={darker}
                strokeWidth="3"
                opacity="0.5"
            />

            {volume ? (
                <VolumeBars {...volume} cream={cream} />
            ) : sleeping ? (
                <g fill="none" stroke={cream} strokeWidth="7" strokeLinecap="round">
                    <path d="M 142 222 q 20 18 40 0" />
                    <path d="M 218 222 q 20 18 40 0" />
                    <ellipse cx="200" cy="262" rx="12" ry="7" fill={cream} stroke="none" />
                </g>
            ) : (
                <g>
                    <g fill={darker} opacity="0.35" transform="translate(2 3)">
                        <ellipse cx="200" cy="246" rx="27" ry="21" />
                        <circle cx="171" cy="214" r="10" />
                        <circle cx="191" cy="202" r="10.5" />
                        <circle cx="211" cy="202" r="10.5" />
                        <circle cx="230" cy="214" r="10" />
                    </g>
                    <g fill={cream}>
                        <ellipse cx="200" cy="246" rx="27" ry="21" />
                        <circle cx="171" cy="214" r="10" />
                        <circle cx="191" cy="202" r="10.5" />
                        <circle cx="211" cy="202" r="10.5" />
                        <circle cx="230" cy="214" r="10" />
                    </g>
                </g>
            )}

            {tracks && tracks.count > 1 && (
                <TrackLights index={tracks.index} count={tracks.count} cream={cream} />
            )}

            {/* platform for the figure */}
            <ellipse cx="200" cy="116" rx="80" ry="17" fill={darker} />
            <ellipse cx="200" cy="112" rx="72" ry="13" fill={`url(#${uid}-platform)`} />
            <ellipse
                cx="200"
                cy="112"
                rx="56"
                ry="8"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                opacity="0.35"
            />
        </svg>
    );
};
