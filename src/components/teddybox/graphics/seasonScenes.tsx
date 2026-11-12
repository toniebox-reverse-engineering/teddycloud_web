import React, { useId } from "react";

import { Canvas, Cloud } from "./sceneParts";

/*
 * Backgrounds for the seasons and holidays. Same layout as the other scenes: horizon at about
 * y = 1000, floor below it, details beside the box (x 360 to 560 and 1040 to 1240, visible on
 * phones in portrait) and in the sky.
 */

const useUid = () => useId().replace(/:/g, "");

const Sky: React.FC<{ id: string; top: string; bottom: string }> = ({ id, top, bottom }) => (
    <>
        <defs>
            <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={top} />
                <stop offset="1" stopColor={bottom} />
            </linearGradient>
        </defs>
        <rect width="1600" height="1600" fill={`url(#${id}-sky)`} />
    </>
);

/** Small flower on a stem, standing at (x, y). */
const Flower: React.FC<{ x: number; y: number; color: string; s?: number }> = ({
    x,
    y,
    color,
    s = 1,
}) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
        <rect x="-3" y="0" width="6" height="40" fill="#4f8a43" />
        {[0, 72, 144, 216, 288].map((angle) => (
            <circle
                key={angle}
                cx={Math.cos((angle * Math.PI) / 180) * 12}
                cy={Math.sin((angle * Math.PI) / 180) * 12}
                r="10"
                fill={color}
            />
        ))}
        <circle r="8" fill="#f6b73c" />
    </g>
);

const Tulip: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => (
    <g transform={`translate(${x} ${y})`}>
        <path d="M0 0 v70" stroke="#4f8a43" strokeWidth="7" />
        <path d="M0 50 q-26 -6 -30 -30 q22 4 30 26" fill="#5d9a4f" />
        <path d="M-20 -30 q0 34 20 34 q20 0 20 -34 l-10 12 l-10 -16 l-10 16 z" fill={color} />
    </g>
);

/** Decorated egg standing at (x, y). */
const Egg: React.FC<{ x: number; y: number; color: string; stripe: string; tilt?: number }> = ({
    x,
    y,
    color,
    stripe,
    tilt = 0,
}) => (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
        <ellipse cx="0" cy="-34" rx="26" ry="34" fill={color} />
        <path
            d="M-24 -38 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l8 8"
            fill="none"
            stroke={stripe}
            strokeWidth="5"
            strokeLinejoin="round"
        />
        <path d="M-22 -20 q22 8 44 0" fill="none" stroke={stripe} strokeWidth="5" />
    </g>
);

/** Leaf as a small rotated drop. */
const Leaf: React.FC<{ x: number; y: number; color: string; angle: number; s?: number }> = ({
    x,
    y,
    color,
    angle,
    s = 1,
}) => (
    <path
        transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`}
        d="M0 -18 q14 10 0 36 q-14 -26 0 -36 z"
        fill={color}
    />
);

const SNOWFLAKES: [number, number, number][] = [
    [420, 160, 7],
    [560, 300, 5],
    [700, 120, 6],
    [860, 260, 8],
    [1000, 140, 5],
    [1150, 280, 7],
    [1260, 170, 5],
    [480, 520, 6],
    [640, 640, 5],
    [960, 560, 7],
    [1100, 700, 5],
    [780, 760, 6],
    [400, 820, 5],
    [1220, 520, 6],
    [560, 900, 4],
    [1060, 880, 5],
];

export const Winter: React.FC = () => {
    const id = useUid();
    return (
        <Canvas>
            <Sky id={id} top="#bcd6ea" bottom="#eef5fb" />
            <circle cx="1150" cy="380" r="70" fill="#fff6d8" opacity="0.9" />
            <Cloud x={560} y={400} s={0.9} />
            {/* snowy hills far away */}
            <path d="M0 990 Q400 880 800 960 T1600 930 L1600 3200 L0 3200 Z" fill="#e3edf6" />
            {/* pine trees (left) */}
            {[
                [410, 1000, 1],
                [520, 1030, 0.75],
            ].map(([x, y, s]) => (
                <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
                    <rect x="-14" y="-10" width="28" height="60" fill="#7a5638" />
                    <path d="M0 -260 L90 -90 L-90 -90 Z" fill="#3d6b5a" />
                    <path d="M0 -190 L110 -10 L-110 -10 Z" fill="#355e4f" />
                    <path d="M0 -260 L42 -180 Q0 -170 -42 -180 Z" fill="#ffffff" />
                    <path d="M-70 -120 Q0 -100 70 -120 L56 -95 Q0 -82 -56 -95 Z" fill="#ffffff" />
                </g>
            ))}
            {/* snow */}
            <path d="M0 1060 Q800 990 1600 1060 L1600 3200 L0 3200 Z" fill="#ffffff" />
            <path
                d="M0 1260 Q500 1210 1000 1250 T1600 1240"
                fill="none"
                stroke="#dde9f3"
                strokeWidth="10"
            />
            {/* snowman (right) */}
            <g transform="translate(1150 1080)">
                <circle cx="0" cy="-40" r="70" fill="#ffffff" stroke="#cfdfea" strokeWidth="6" />
                <circle cx="0" cy="-150" r="50" fill="#ffffff" stroke="#cfdfea" strokeWidth="6" />
                <circle cx="0" cy="-235" r="38" fill="#ffffff" stroke="#cfdfea" strokeWidth="6" />
                <rect x="-34" y="-300" width="68" height="16" rx="4" fill="#33414f" />
                <rect x="-22" y="-350" width="44" height="54" rx="6" fill="#33414f" />
                <circle cx="-13" cy="-242" r="5" fill="#33414f" />
                <circle cx="13" cy="-242" r="5" fill="#33414f" />
                <path d="M0 -232 l30 8 l-30 6 z" fill="#f08a3c" />
                <path d="M-42 -190 q42 22 84 0 l-6 18 q-36 16 -72 0 z" fill="#e0573f" />
                <circle cx="0" cy="-150" r="6" fill="#33414f" />
                <circle cx="0" cy="-125" r="6" fill="#33414f" />
            </g>
            {/* snowflakes */}
            <g fill="#ffffff">
                {SNOWFLAKES.map(([x, y, r]) => (
                    <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
                ))}
            </g>
        </Canvas>
    );
};

export const Christmas: React.FC = () => {
    const id = useUid();
    return (
        <Canvas>
            <defs>
                <pattern id={`${id}-wall`} width="120" height="120" patternUnits="userSpaceOnUse">
                    <rect width="120" height="120" fill="#f6e6d2" />
                    <path
                        d="M30 22 l4 10 l10 0 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 l10 0 z"
                        fill="#ecd3b4"
                    />
                    <circle cx="90" cy="88" r="5" fill="#ecd3b4" />
                </pattern>
                <linearGradient id={`${id}-night`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#24346b" />
                    <stop offset="1" stopColor="#4b5ea3" />
                </linearGradient>
                <pattern id={`${id}-planks`} width="200" height="70" patternUnits="userSpaceOnUse">
                    <rect width="200" height="70" fill="#d1a476" />
                    <rect y="66" width="200" height="4" fill="#b98c5e" />
                    <rect x="120" width="4" height="70" fill="#c19568" />
                </pattern>
            </defs>
            <rect y="-1600" width="1600" height="2680" fill={`url(#${id}-wall)`} />
            <rect y="1000" width="1600" height="30" fill="#e2c7a6" />
            {/* window with snow at night (left) */}
            <rect x="380" y="400" width="240" height="320" rx="16" fill={`url(#${id}-night)`} />
            <g fill="#ffffff">
                {[
                    [420, 450, 5],
                    [480, 520, 4],
                    [560, 470, 6],
                    [440, 620, 4],
                    [590, 600, 5],
                    [520, 660, 4],
                ].map(([x, y, r]) => (
                    <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
                ))}
            </g>
            <path d="M380 690 q120 -40 240 0 v30 h-240 z" fill="#ffffff" />
            <rect
                x="380"
                y="400"
                width="240"
                height="320"
                rx="16"
                fill="none"
                stroke="#ffffff"
                strokeWidth="18"
            />
            <rect x="493" y="400" width="14" height="320" fill="#ffffff" />
            {/* garland with lights */}
            <path
                d="M360 250 Q800 340 1240 250"
                fill="none"
                stroke="#3f7a4a"
                strokeWidth="22"
                strokeLinecap="round"
            />
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                const x = 400 + i * 100;
                const y = 262 + Math.sin((i / 8) * Math.PI) * 52;
                const colors = ["#e0573f", "#f6c453", "#3b8fd9", "#d94f8f"];
                return (
                    <circle key={i} cx={x} cy={y + 18} r="12" fill={colors[i % colors.length]} />
                );
            })}
            {/* Christmas tree (right) */}
            <g transform="translate(1140 1040)">
                <rect x="-22" y="-60" width="44" height="70" fill="#7a5638" />
                <path d="M0 -600 L150 -330 L-150 -330 Z" fill="#2f7a4c" />
                <path d="M0 -480 L190 -180 L-190 -180 Z" fill="#2a6e44" />
                <path d="M0 -360 L230 -50 L-230 -50 Z" fill="#256339" />
                <path
                    d="M0 -650 l18 36 l40 4 l-30 26 l10 40 l-38 -22 l-38 22 l10 -40 l-30 -26 l40 -4 z"
                    fill="#f6c453"
                />
                {[
                    [-60, -420, "#e0573f"],
                    [70, -360, "#f6c453"],
                    [-100, -250, "#3b8fd9"],
                    [40, -230, "#e0573f"],
                    [130, -120, "#d94f8f"],
                    [-150, -100, "#f6c453"],
                    [-20, -120, "#ffffff"],
                ].map(([x, y, c]) => (
                    <circle key={`${x}-${y}`} cx={x} cy={y} r="18" fill={String(c)} />
                ))}
            </g>
            {/* floor with a rug and presents */}
            <rect y="1030" width="1600" height="2170" fill={`url(#${id}-planks)`} />
            <ellipse cx="800" cy="1260" rx="420" ry="120" fill="#c94f4a" />
            <ellipse
                cx="800"
                cy="1260"
                rx="340"
                ry="90"
                fill="none"
                stroke="#f6e6d2"
                strokeWidth="10"
                strokeDasharray="22 18"
                opacity="0.7"
            />
            {[
                [1050, 1060, 90, 80, "#3b8fd9", "#f6c453"],
                [1170, 1080, 110, 70, "#e0573f", "#ffffff"],
                [1250, 1050, 70, 90, "#f6c453", "#e0573f"],
            ].map(([x, y, w, h, c, r]) => (
                <g key={String(x)}>
                    <rect
                        x={Number(x)}
                        y={Number(y)}
                        width={Number(w)}
                        height={Number(h)}
                        rx="6"
                        fill={String(c)}
                    />
                    <rect
                        x={Number(x) + Number(w) / 2 - 8}
                        y={Number(y)}
                        width="16"
                        height={Number(h)}
                        fill={String(r)}
                    />
                    <rect
                        x={Number(x)}
                        y={Number(y) + Number(h) / 2 - 8}
                        width={Number(w)}
                        height="16"
                        fill={String(r)}
                    />
                </g>
            ))}
        </Canvas>
    );
};

export const Easter: React.FC = () => {
    const id = useUid();
    return (
        <Canvas>
            <Sky id={id} top="#b9e2f6" bottom="#f2fbff" />
            <circle cx="1160" cy="400" r="76" fill="#fde58a" />
            <Cloud x={520} y={420} s={0.9} />
            <Cloud x={900} y={300} s={0.6} />
            <path d="M0 1000 Q400 900 800 980 T1600 950 L1600 3200 L0 3200 Z" fill="#c5e6a6" />
            <path d="M0 1110 Q500 1010 900 1100 T1600 1080 L1600 3200 L0 3200 Z" fill="#acd98b" />
            <path d="M0 1270 Q600 1180 1600 1260 L1600 3200 L0 3200 Z" fill="#9acd78" />
            {/* bunny (left) */}
            <g transform="translate(450 1110)" fill="#ffffff">
                <ellipse cx="0" cy="-60" rx="62" ry="58" />
                <circle cx="44" cy="-130" r="40" />
                <ellipse cx="30" cy="-210" rx="14" ry="48" transform="rotate(-12 30 -210)" />
                <ellipse cx="62" cy="-206" rx="14" ry="48" transform="rotate(14 62 -206)" />
                <ellipse
                    cx="30"
                    cy="-210"
                    rx="6"
                    ry="34"
                    fill="#f6c2cf"
                    transform="rotate(-12 30 -210)"
                />
                <ellipse
                    cx="62"
                    cy="-206"
                    rx="6"
                    ry="34"
                    fill="#f6c2cf"
                    transform="rotate(14 62 -206)"
                />
                <circle cx="-58" cy="-62" r="18" />
                <circle cx="58" cy="-136" r="5" fill="#33414f" />
                <circle cx="80" cy="-124" r="6" fill="#f2a0b5" />
            </g>
            {/* tulips and eggs (right) */}
            <Tulip x={1080} y={1060} color="#f28bb0" />
            <Tulip x={1150} y={1040} color="#fbd560" />
            <Tulip x={1220} y={1070} color="#c9a7e8" />
            <Egg x={1120} y={1200} color="#8fd0e8" stripe="#ffffff" tilt={-8} />
            <Egg x={1200} y={1230} color="#fbd560" stripe="#e8799b" tilt={10} />
            <Egg x={520} y={1220} color="#f6b2c6" stripe="#ffffff" tilt={6} />
            <Egg x={420} y={1250} color="#b9e08f" stripe="#3b8fd9" tilt={-12} />
            <Flower x={600} y={1300} color="#ffffff" s={0.9} />
            <Flower x={1000} y={1320} color="#f28bb0" s={0.9} />
        </Canvas>
    );
};

export const Spring: React.FC = () => {
    const id = useUid();
    const petals: [number, number][] = [
        [600, 700],
        [680, 820],
        [560, 900],
        [760, 760],
        [640, 980],
    ];
    return (
        <Canvas>
            <Sky id={id} top="#a7dbf4" bottom="#ebf8fd" />
            <circle cx="1170" cy="380" r="78" fill="#fbd560" />
            <Cloud x={900} y={420} s={0.7} />
            {/* birds */}
            <g fill="none" stroke="#4a5568" strokeWidth="6" strokeLinecap="round">
                <path d="M780 260 q20 -20 40 0 q20 -20 40 0" />
                <path d="M900 330 q14 -14 28 0 q14 -14 28 0" />
            </g>
            <path d="M0 1000 Q400 880 800 970 T1600 940 L1600 3200 L0 3200 Z" fill="#b4e08f" />
            <path d="M0 1120 Q500 1010 900 1110 T1600 1080 L1600 3200 L0 3200 Z" fill="#9ed37a" />
            <path d="M0 1270 Q600 1170 1600 1250 L1600 3200 L0 3200 Z" fill="#8bc66a" />
            {/* cherry tree in blossom (left) */}
            <path d="M440 1080 q-10 -160 20 -290 l30 0 q-20 140 0 290 z" fill="#8a5a3b" />
            <path d="M460 860 q-60 -40 -90 -110" stroke="#8a5a3b" strokeWidth="18" fill="none" />
            {[
                [460, 690, 120, "#f7c6d9"],
                [370, 760, 80, "#f2a7c3"],
                [560, 760, 90, "#f2a7c3"],
                [470, 600, 70, "#fbdbe7"],
            ].map(([x, y, r, c]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={String(c)} />
            ))}
            <g fill="#f7c6d9">
                {petals.map(([x, y]) => (
                    <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="9" ry="6" />
                ))}
            </g>
            {/* butterflies (right) */}
            {[
                [1120, 820, "#f6a04d"],
                [1230, 700, "#8fb8f0"],
            ].map(([x, y, c]) => (
                <g key={String(x)} transform={`translate(${x} ${y})`}>
                    <ellipse cx="-16" cy="-8" rx="20" ry="14" fill={String(c)} />
                    <ellipse cx="16" cy="-8" rx="20" ry="14" fill={String(c)} />
                    <ellipse cx="-12" cy="10" rx="12" ry="9" fill={String(c)} />
                    <ellipse cx="12" cy="10" rx="12" ry="9" fill={String(c)} />
                    <rect x="-3" y="-16" width="6" height="34" rx="3" fill="#33414f" />
                </g>
            ))}
            <Flower x={1100} y={1180} color="#ffffff" />
            <Flower x={1190} y={1230} color="#f28bb0" />
            <Flower x={1050} y={1290} color="#fbd560" />
            <Flower x={540} y={1220} color="#ffffff" />
            <Flower x={430} y={1290} color="#c9a7e8" />
        </Canvas>
    );
};

export const Summer: React.FC = () => {
    const id = useUid();
    return (
        <Canvas>
            <Sky id={id} top="#5fbcec" bottom="#cbeefc" />
            {/* sun with rays */}
            <g transform="translate(1160 360)">
                {Array.from({ length: 12 }, (_, i) => (
                    <rect
                        key={i}
                        x="-8"
                        y="-150"
                        width="16"
                        height="44"
                        rx="8"
                        fill="#fbd560"
                        transform={`rotate(${i * 30})`}
                    />
                ))}
                <circle r="90" fill="#fbd560" />
            </g>
            <Cloud x={700} y={300} s={0.8} />
            {/* kite (left) */}
            <g transform="translate(470 420) rotate(-10)">
                <path d="M0 -90 L64 0 L0 110 L-64 0 Z" fill="#e0573f" />
                <path d="M0 -90 L0 110 M-64 0 L64 0" stroke="#ffffff" strokeWidth="5" />
                <path
                    d="M0 110 q30 60 -10 120 q-40 60 0 130"
                    fill="none"
                    stroke="#33414f"
                    strokeWidth="4"
                />
                {[160, 220, 290].map((y, i) => (
                    <path key={y} d={`M${i % 2 ? 14 : -18} ${y} l20 -10 l0 20 z`} fill="#3b8fd9" />
                ))}
            </g>
            <path d="M0 990 Q400 890 800 960 T1600 930 L1600 3200 L0 3200 Z" fill="#cfe27a" />
            <path d="M0 1110 Q500 1010 900 1100 T1600 1070 L1600 3200 L0 3200 Z" fill="#b5d65a" />
            <path d="M0 1270 Q600 1180 1600 1250 L1600 3200 L0 3200 Z" fill="#a3c94a" />
            {/* sunflowers (right) */}
            {[
                [1080, 1100, 0.9],
                [1170, 1060, 1.1],
                [1250, 1110, 0.8],
            ].map(([x, y, s]) => (
                <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
                    <rect x="-5" y="-220" width="10" height="230" fill="#5d9a4f" />
                    <path d="M0 -110 q-50 -10 -60 -50 q40 0 60 40" fill="#6aa75a" />
                    {Array.from({ length: 12 }, (_, i) => (
                        <ellipse
                            key={i}
                            cx="0"
                            cy="-284"
                            rx="14"
                            ry="34"
                            fill="#f6c43c"
                            transform={`rotate(${i * 30} 0 -240)`}
                        />
                    ))}
                    <circle cx="0" cy="-240" r="30" fill="#7a4f2a" />
                </g>
            ))}
            <Flower x={480} y={1200} color="#ffffff" />
            <Flower x={560} y={1260} color="#f28b8b" />
        </Canvas>
    );
};

export const Autumn: React.FC = () => {
    const id = useUid();
    const leaves: [number, number, string, number][] = [
        [600, 520, "#e07a3a", 30],
        [700, 700, "#d9502f", -40],
        [920, 600, "#f0b23e", 60],
        [1000, 800, "#e07a3a", -20],
        [820, 880, "#d9502f", 80],
        [560, 860, "#f0b23e", -60],
        [1060, 460, "#d9502f", 10],
    ];
    return (
        <Canvas>
            <Sky id={id} top="#f4c48c" bottom="#fde9cb" />
            <circle cx="1150" cy="380" r="70" fill="#fbe0a0" />
            <Cloud x={760} y={340} s={0.8} color="#fff6ea" />
            <path d="M0 990 Q400 890 800 960 T1600 930 L1600 3200 L0 3200 Z" fill="#e2b06d" />
            {/* trees (left and right) */}
            {[
                [450, 1040, ["#e07a3a", "#d9502f", "#f0b23e"]],
                [1160, 1020, ["#d9502f", "#f0b23e", "#e07a3a"]],
            ].map(([x, y, colors]) => (
                <g key={String(x)} transform={`translate(${x} ${y})`}>
                    <rect x="-18" y="-220" width="36" height="230" rx="10" fill="#7a5638" />
                    <circle cx="0" cy="-300" r="120" fill={(colors as string[])[0]} />
                    <circle cx="-80" cy="-240" r="72" fill={(colors as string[])[1]} />
                    <circle cx="84" cy="-246" r="70" fill={(colors as string[])[2]} />
                </g>
            ))}
            <path d="M0 1100 Q500 1010 900 1090 T1600 1070 L1600 3200 L0 3200 Z" fill="#cf9550" />
            <path d="M0 1270 Q600 1180 1600 1250 L1600 3200 L0 3200 Z" fill="#bf8445" />
            {/* falling leaves */}
            {leaves.map(([x, y, c, a]) => (
                <Leaf key={`${x}-${y}`} x={x} y={y} color={c} angle={a} s={1.4} />
            ))}
            {/* leaves on the ground */}
            {[
                [420, 1180, "#d9502f", 70],
                [540, 1240, "#f0b23e", -30],
                [1060, 1200, "#e07a3a", 20],
                [1250, 1260, "#d9502f", -70],
            ].map(([x, y, c, a]) => (
                <Leaf
                    key={`${x}-${y}`}
                    x={Number(x)}
                    y={Number(y)}
                    color={String(c)}
                    angle={Number(a)}
                    s={1.6}
                />
            ))}
            {/* pumpkins (right) and mushrooms (left) */}
            {[
                [1110, 1150, 1],
                [1210, 1170, 0.75],
            ].map(([x, y, s]) => (
                <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
                    <ellipse cx="-30" cy="0" rx="40" ry="50" fill="#e8822e" />
                    <ellipse cx="30" cy="0" rx="40" ry="50" fill="#e8822e" />
                    <ellipse cx="0" cy="0" rx="40" ry="54" fill="#f0943a" />
                    <rect x="-6" y="-70" width="12" height="24" rx="4" fill="#5d7a3a" />
                </g>
            ))}
            {[
                [520, 1150],
                [580, 1170],
            ].map(([x, y], i) => (
                <g key={x} transform={`translate(${x} ${y}) scale(${i ? 0.7 : 1})`}>
                    <rect x="-12" y="-40" width="24" height="44" rx="8" fill="#f6ead8" />
                    <path d="M-50 -36 q50 -70 100 0 z" fill="#d9502f" />
                    <circle cx="-18" cy="-52" r="7" fill="#ffffff" />
                    <circle cx="14" cy="-58" r="6" fill="#ffffff" />
                </g>
            ))}
        </Canvas>
    );
};
