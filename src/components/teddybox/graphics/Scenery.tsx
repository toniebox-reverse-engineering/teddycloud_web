import React, { useId } from "react";

import { TEDDYBOX_PLAIN_DEFAULT_COLOR } from "../../../constants/teddybox";
import { TeddyBoxBackground } from "../../../types/teddyboxTypes";
import { toImageSrc } from "../../tonies/common/utils/imagePathUtils";
import { shade } from "./colors";
import { sceneFit } from "../../../utils/teddybox/sceneFit";
import { Canvas, Cloud, fill } from "./sceneParts";
import { Autumn, Christmas, Easter, Spring, Summer, Winter } from "./seasonScenes";

/*
 * Backgrounds of the kids view. All are drawn on a square canvas: phones in portrait show its
 * middle column, tablets in landscape its middle band. The horizon sits at about y = 1000 and
 * details stay near the edges, so the TeddyBox and the tonies in the middle stand out.
 */

const Room: React.FC = () => {
    const id = useId().replace(/:/g, "");
    return (
        <Canvas>
            <defs>
                <pattern id={`${id}-dots`} width="90" height="90" patternUnits="userSpaceOnUse">
                    <circle cx="20" cy="20" r="6" fill="#ecd9c3" />
                    <circle cx="65" cy="65" r="6" fill="#ecd9c3" />
                </pattern>
                <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#9fd0ef" />
                    <stop offset="1" stopColor="#d6eefa" />
                </linearGradient>
                <pattern id={`${id}-planks`} width="200" height="70" patternUnits="userSpaceOnUse">
                    <rect width="200" height="70" fill="#e4c49a" />
                    <rect y="66" width="200" height="4" fill="#d2ad7e" />
                    <rect x="120" width="4" height="70" fill="#d8b688" />
                </pattern>
            </defs>
            {/* wall */}
            <rect y="-1600" width="1600" height="2680" fill="#f6eadb" />
            <rect y="-1600" width="1600" height="2680" fill={`url(#${id}-dots)`} />
            <rect y="1000" width="1600" height="30" fill="#e9d3b6" />
            {/* window with curtains (left) */}
            <rect x="430" y="380" width="300" height="360" rx="18" fill={`url(#${id}-sky)`} />
            <Cloud x={520} y={470} s={0.7} />
            <Cloud x={650} y={560} s={0.5} />
            <rect
                x="430"
                y="380"
                width="300"
                height="360"
                rx="18"
                fill="none"
                stroke="#ffffff"
                strokeWidth="22"
            />
            <rect x="573" y="380" width="14" height="360" fill="#ffffff" />
            <rect x="430" y="553" width="300" height="14" fill="#ffffff" />
            <rect x="400" y="350" width="360" height="22" rx="11" fill="#c9a274" />
            <path d="M400 360 q40 200 10 420 l70 0 q-20 -230 20 -420 z" fill="#f2a59a" />
            <path d="M760 360 q-40 200 -10 420 l-70 0 q20 -230 -20 -420 z" fill="#f2a59a" />
            {/* picture with a sun (right) */}
            <rect
                x="1040"
                y="430"
                width="170"
                height="140"
                rx="10"
                fill="#ffffff"
                stroke="#c9a274"
                strokeWidth="12"
            />
            <circle cx="1125" cy="500" r="30" fill="#f6c453" />
            <path
                d="M1060 555 l40 -40 l30 30 l25 -20 l40 30"
                fill="none"
                stroke="#8cc084"
                strokeWidth="10"
                strokeLinejoin="round"
            />
            {/* garland of little flags */}
            <path d="M380 250 Q800 330 1220 250" fill="none" stroke="#c9a274" strokeWidth="4" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                const x = 430 + i * 105;
                const y = 262 + Math.sin((i / 7) * Math.PI) * 48;
                const colors = ["#f2a59a", "#8fc7d9", "#f6c453", "#a7cf9a"];
                return (
                    <path
                        key={i}
                        d={`M${x - 26} ${y} L${x + 26} ${y} L${x} ${y + 52} Z`}
                        fill={colors[i % colors.length]}
                    />
                );
            })}
            {/* floor */}
            <rect y="1030" width="1600" height="2170" fill={`url(#${id}-planks)`} />
            <ellipse cx="800" cy="1260" rx="420" ry="120" fill="#a9d3cc" />
            <ellipse
                cx="800"
                cy="1260"
                rx="340"
                ry="90"
                fill="none"
                stroke="#ffffff"
                strokeWidth="10"
                strokeDasharray="22 18"
                opacity="0.7"
            />
            {/* plant (right) and ball (left) */}
            <path d="M1150 1060 l70 0 l-12 90 l-46 0 z" fill="#d98c6f" />
            <g fill="#7fb77e">
                <ellipse cx="1165" cy="990" rx="22" ry="60" transform="rotate(-25 1165 990)" />
                <ellipse cx="1205" cy="980" rx="22" ry="66" transform="rotate(20 1205 980)" />
                <ellipse cx="1185" cy="960" rx="20" ry="70" />
            </g>
            <circle cx="470" cy="1110" r="48" fill="#8fc7d9" />
            <path d="M424 1100 q46 -30 92 0" fill="none" stroke="#ffffff" strokeWidth="10" />
            <path d="M470 1062 q-18 48 0 96" fill="none" stroke="#f6c453" strokeWidth="10" />
        </Canvas>
    );
};

const Meadow: React.FC = () => {
    const id = useId().replace(/:/g, "");
    return (
        <Canvas>
            <defs>
                <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#8fcdf0" />
                    <stop offset="1" stopColor="#e2f4fb" />
                </linearGradient>
            </defs>
            <rect width="1600" height="1600" fill={`url(#${id}-sky)`} />
            <circle cx="1130" cy="420" r="80" fill="#fbd560" />
            <circle cx="1130" cy="420" r="120" fill="#fbd560" opacity="0.25" />
            <Cloud x={520} y={430} />
            <Cloud x={820} y={560} s={0.7} />
            <path d="M0 1000 Q400 860 800 980 T1600 940 L1600 3200 L0 3200 Z" fill="#a9d18e" />
            <path d="M0 1120 Q500 1000 900 1110 T1600 1080 L1600 3200 L0 3200 Z" fill="#8cc275" />
            <path d="M0 1260 Q600 1160 1600 1250 L1600 3200 L0 3200 Z" fill="#78b562" />
            {/* tree (left) */}
            <rect x="452" y="840" width="36" height="190" rx="10" fill="#a47148" />
            <circle cx="470" cy="800" r="110" fill="#6aa75a" />
            <circle cx="410" cy="850" r="70" fill="#5d9a4f" />
            {/* flowers */}
            {[
                [560, 1180, "#f28b8b"],
                [640, 1230, "#fbd560"],
                [980, 1200, "#ffffff"],
                [1060, 1250, "#f28b8b"],
                [1140, 1190, "#c9a7e8"],
                [470, 1300, "#ffffff"],
                [1200, 1320, "#fbd560"],
            ].map(([x, y, c]) => (
                <g key={`${x}-${y}`}>
                    <rect x={Number(x) - 3} y={Number(y)} width="6" height="34" fill="#4f8a43" />
                    <circle cx={x} cy={y} r="16" fill={String(c)} />
                    <circle cx={x} cy={y} r="6" fill="#f6b73c" />
                </g>
            ))}
        </Canvas>
    );
};

const Ocean: React.FC = () => {
    const id = useId().replace(/:/g, "");
    return (
        <Canvas>
            <defs>
                <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#5cc2dc" />
                    <stop offset="1" stopColor="#1f7fa6" />
                </linearGradient>
            </defs>
            <rect width="1600" height="1600" fill={`url(#${id}-water)`} />
            {/* light rays */}
            <g fill="#ffffff" opacity="0.1">
                <path d="M520 0 L640 0 L520 1000 L380 1000 Z" />
                <path d="M900 0 L980 0 L1040 1000 L920 1000 Z" />
                <path d="M1150 0 L1200 0 L1380 1000 L1300 1000 Z" />
            </g>
            {/* sand */}
            <path d="M0 1180 Q800 1080 1600 1180 L1600 3200 L0 3200 Z" fill="#f0d9a8" />
            {/* seaweed */}
            <g fill="none" stroke="#3fa36b" strokeWidth="22" strokeLinecap="round">
                <path d="M460 1200 q-40 -80 0 -160 q40 -80 0 -160" />
                <path d="M520 1200 q40 -70 0 -140 q-40 -70 0 -140" />
                <path d="M1130 1200 q-40 -90 0 -180 q40 -90 0 -180" />
            </g>
            <circle cx="1210" cy="1180" r="34" fill="#f2a59a" />
            {/* fish */}
            <g transform="translate(560 520)">
                <ellipse rx="56" ry="34" fill="#f6c453" />
                <path d="M50 0 l46 -30 l0 60 z" fill="#f6c453" />
                <circle cx="-26" cy="-8" r="7" fill="#2a2a2a" />
            </g>
            <g transform="translate(1100 720) scale(-0.7 0.7)">
                <ellipse rx="56" ry="34" fill="#f28b8b" />
                <path d="M50 0 l46 -30 l0 60 z" fill="#f28b8b" />
                <circle cx="-26" cy="-8" r="7" fill="#2a2a2a" />
            </g>
            {/* bubbles */}
            <g fill="none" stroke="#ffffff" strokeWidth="5" opacity="0.6">
                <circle cx="480" cy="760" r="18" />
                <circle cx="500" cy="680" r="11" />
                <circle cx="1160" cy="520" r="16" />
                <circle cx="1140" cy="440" r="9" />
            </g>
        </Canvas>
    );
};

const Space: React.FC = () => {
    const id = useId().replace(/:/g, "");
    return (
        <Canvas>
            <defs>
                <radialGradient id={`${id}-sky`} cx="0.5" cy="0.4" r="0.8">
                    <stop offset="0" stopColor="#3b2f7a" />
                    <stop offset="1" stopColor="#161339" />
                </radialGradient>
            </defs>
            <rect width="1600" height="1600" fill={`url(#${id}-sky)`} />
            <g fill="#ffffff">
                {[
                    [450, 300, 4],
                    [600, 520, 3],
                    [760, 280, 5],
                    [1020, 380, 3],
                    [1180, 640, 4],
                    [480, 900, 3],
                    [1150, 950, 5],
                    [700, 760, 2.5],
                    [900, 620, 2.5],
                    [560, 1120, 3],
                    [1040, 1180, 3],
                ].map(([x, y, r]) => (
                    <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
                ))}
            </g>
            {/* ringed planet (left) */}
            <circle cx="520" cy="560" r="90" fill="#f2a59a" />
            <ellipse
                cx="520"
                cy="560"
                rx="160"
                ry="34"
                fill="none"
                stroke="#f6c453"
                strokeWidth="14"
                transform="rotate(-18 520 560)"
            />
            {/* moon (right) */}
            <circle cx="1150" cy="420" r="70" fill="#e8e4f4" />
            <circle cx="1130" cy="400" r="14" fill="#cfc9e6" />
            <circle cx="1175" cy="445" r="10" fill="#cfc9e6" />
            {/* small planet at the bottom */}
            <circle cx="1120" cy="1240" r="50" fill="#8fc7d9" />
            {/* comet */}
            <path
                d="M700 1000 L420 1160"
                stroke="#ffffff"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.5"
            />
            <circle cx="700" cy="1000" r="10" fill="#ffffff" />
        </Canvas>
    );
};

const Beach: React.FC = () => {
    const id = useId().replace(/:/g, "");
    return (
        <Canvas>
            <defs>
                <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#7cc6ee" />
                    <stop offset="1" stopColor="#d9f1fb" />
                </linearGradient>
            </defs>
            <rect width="1600" height="1000" fill={`url(#${id}-sky)`} />
            <circle cx="1120" cy="420" r="90" fill="#fbd560" />
            <Cloud x={560} y={420} s={0.8} />
            {/* sea and sand */}
            <rect y="900" width="1600" height="200" fill="#4fb3d9" />
            <path
                d="M0 960 q80 -20 160 0 t160 0 t160 0 t160 0 t160 0 t160 0 t160 0 t160 0 t160 0 t160 0"
                fill="none"
                stroke="#ffffff"
                strokeWidth="8"
                opacity="0.6"
            />
            <path d="M0 1080 Q800 1000 1600 1080 L1600 3200 L0 3200 Z" fill="#f2dba9" />
            {/* palm (left) */}
            <path
                d="M470 1120 q30 -200 -10 -360"
                fill="none"
                stroke="#a47148"
                strokeWidth="30"
                strokeLinecap="round"
            />
            <g fill="#5fae63">
                <path d="M460 760 q-130 -40 -200 40 q110 -10 200 -40 z" />
                <path d="M460 760 q130 -60 220 10 q-120 -10 -220 -10 z" />
                <path d="M460 760 q-40 -130 -160 -150 q90 60 160 150 z" />
                <path d="M460 760 q60 -130 180 -130 q-110 50 -180 130 z" />
            </g>
            {/* shell and starfish */}
            <path d="M1100 1240 q40 -60 80 0 z" fill="#f2a59a" />
            <path
                d="M520 1300 l14 30 l32 4 l-24 22 l6 32 l-28 -16 l-28 16 l6 -32 l-24 -22 l32 -4 z"
                fill="#f6a35a"
            />
        </Canvas>
    );
};

const Night: React.FC = () => {
    const id = useId().replace(/:/g, "");
    return (
        <Canvas>
            <defs>
                <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#1d2550" />
                    <stop offset="1" stopColor="#141a3a" />
                </linearGradient>
                <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0" stopColor="#ffcf8a" stopOpacity="0.32" />
                    <stop offset="1" stopColor="#ffcf8a" stopOpacity="0" />
                </radialGradient>
            </defs>
            <rect width="1600" height="1600" fill={`url(#${id}-sky)`} />
            <rect
                x="430"
                y="380"
                width="300"
                height="360"
                rx="18"
                fill="#222c5a"
                stroke="#2e3a70"
                strokeWidth="22"
            />
            <path d="M610 450 a90 90 0 1 0 66 150 a72 72 0 1 1 -66 -150 z" fill="#f4e7b5" />
            <g fill="#f4e7b5">
                {[
                    [480, 430, 5],
                    [520, 650, 4],
                    [690, 690, 3],
                    [1000, 380, 4],
                    [1150, 520, 3],
                    [1220, 330, 5],
                    [900, 260, 3],
                ].map(([x, y, r]) => (
                    <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
                ))}
            </g>
            <rect y="1030" width="1600" height="2170" fill="#181f45" />
            <ellipse cx="800" cy="1150" rx="520" ry="260" fill={`url(#${id}-glow)`} />
        </Canvas>
    );
};

const Plain: React.FC<{ color?: string }> = ({ color = TEDDYBOX_PLAIN_DEFAULT_COLOR }) => (
    <div
        style={{ ...fill, background: `linear-gradient(${shade(color, 0.25)}, ${color})` }}
        aria-hidden
    />
);

const SCENES: Record<Exclude<TeddyBoxBackground, "plain">, React.FC> = {
    room: Room,
    meadow: Meadow,
    ocean: Ocean,
    space: Space,
    beach: Beach,
    night: Night,
    spring: Spring,
    summer: Summer,
    autumn: Autumn,
    winter: Winter,
    christmas: Christmas,
    easter: Easter,
};

/** Spot of each scene (height of 1600) where the box stands, e.g. the middle of the rug. */
const SPOTS: Record<Exclude<TeddyBoxBackground, "plain">, number> = {
    room: 1260,
    meadow: 1250,
    ocean: 1250,
    space: 1250,
    beach: 1250,
    night: 1180,
    spring: 1250,
    summer: 1250,
    autumn: 1250,
    winter: 1250,
    christmas: 1260,
    easter: 1250,
};

/** Color at the bottom of each scene, continued where the scene ends above the screen edge. */
const FLOOR_COLORS: Record<Exclude<TeddyBoxBackground, "plain">, string> = {
    room: "#e4c49a",
    meadow: "#78b562",
    ocean: "#f0d9a8",
    space: "#181f45",
    beach: "#f2dba9",
    night: "#181f45",
    spring: "#8bc66a",
    summer: "#a3c94a",
    autumn: "#bf8445",
    winter: "#ffffff",
    christmas: "#d1a476",
    easter: "#9acd78",
};

/**
 * Point of the screen (px from the top) where the scene floor should be, so the box stands on
 * it instead of floating.
 */
export type SceneryGround = { y: number; width: number; height: number };

/** Color at the top of each scene (sky or wall), continued above it. */
const TOP_COLORS: Record<Exclude<TeddyBoxBackground, "plain">, string> = {
    room: "#f6eadb",
    meadow: "#8fcdf0",
    ocean: "#5cc2dc",
    space: "#3b2f7a",
    beach: "#7cc6ee",
    night: "#1d2550",
    spring: "#a7dbf4",
    summer: "#5fbcec",
    autumn: "#f4c48c",
    winter: "#bcd6ea",
    christmas: "#f6e6d2",
    easter: "#b9e2f6",
};

/** A built-in background, or a picture (custom_img path or URL) when `image` is set. */
export const SceneryBackground: React.FC<{
    background: TeddyBoxBackground;
    image?: string;
    color?: string;
    ground?: SceneryGround;
}> = ({ background, image, color, ground }) => {
    if (image) {
        return (
            <img
                src={toImageSrc(image)}
                alt=""
                aria-hidden
                draggable={false}
                style={{ ...fill, objectFit: "cover", pointerEvents: "none" }}
            />
        );
    }
    if (background === "plain") return <Plain color={color} />;
    const Scene = SCENES[background] ?? Room;
    if (!ground?.width || !ground.height) return <Scene />;
    const fit = sceneFit(ground.width, ground.height, ground.y, SPOTS[background] ?? SPOTS.room);
    // above the scene the sky (or wall) continues in its color, below it the floor
    const top = TOP_COLORS[background] ?? TOP_COLORS.room;
    const bottom = FLOOR_COLORS[background] ?? FLOOR_COLORS.room;
    const split = Math.max(0, fit.top + fit.size / 2);
    return (
        <div
            style={{
                ...fill,
                background: `linear-gradient(${top} 0, ${top} ${split}px, ${bottom} ${split}px)`,
            }}
            aria-hidden
        >
            <div
                style={{
                    position: "absolute",
                    left: fit.left,
                    top: fit.top,
                    width: fit.size,
                    height: fit.size,
                }}
            >
                <Scene />
            </div>
        </div>
    );
};

/** Hand that knocks against the box, shown once to explain the gesture. */
export const KnockHand: React.FC<{ style?: React.CSSProperties; className?: string }> = ({
    style,
    className,
}) => (
    <svg viewBox="0 0 200 200" style={style} className={className} aria-hidden>
        <g fill="#f6d2b0" stroke="#c98f63" strokeWidth="5" strokeLinejoin="round">
            <rect x="46" y="70" width="110" height="94" rx="38" />
            <rect x="34" y="52" width="40" height="64" rx="20" />
            <rect x="70" y="44" width="40" height="60" rx="20" />
            <rect x="106" y="48" width="38" height="58" rx="19" />
            <path d="M150 104 c 26 -8 34 18 12 34" />
        </g>
        <g stroke="#c98f63" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.7">
            <path d="M18 74 l-14 -6" />
            <path d="M16 98 l-14 2" />
            <path d="M22 122 l-12 8" />
        </g>
    </svg>
);
