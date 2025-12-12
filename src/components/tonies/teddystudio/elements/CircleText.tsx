import React, { useEffect, useId, useMemo, useRef, useState } from "react";

type CircleTextProps = {
    text: string;
    color?: string;
    size?: number;
    padding?: number;
    fontSize?: number;
    minFontSize?: number;
    rotateDeg?: number;
    showCircle?: boolean;
    innerFactor?: number;
};

export function CircleText({
    text,
    color = "#000",
    size = 220,
    padding = 4,
    fontSize = 24,
    minFontSize = 10,
    rotateDeg = 0,
    showCircle = true,
    innerFactor = 0.75,
}: CircleTextProps) {
    const id = useId();
    const pathRef = useRef<SVGPathElement | null>(null);
    const textRef = useRef<SVGTextElement | null>(null);
    const [fitFontSize, setFitFontSize] = useState(fontSize);

    const outerR = (size - 2 * padding) / 2;
    const cx = size / 2;
    const cy = size / 2;

    const textR = useMemo(() => Math.max(1, outerR - fitFontSize * innerFactor), [outerR, fitFontSize, innerFactor]);

    const d = useMemo(
        () =>
            `M ${cx} ${cy + textR} A ${textR} ${textR} 0 1 1 ${cx} ${cy - textR} A ${textR} ${textR} 0 1 1 ${cx} ${
                cy + textR
            }`,
        [cx, cy, textR]
    );

    useEffect(() => {
        const pathEl = pathRef.current;
        const textEl = textRef.current;
        if (!pathEl || !textEl) return;

        const fits = (fs: number) => {
            textEl.style.fontSize = `${fs}px`;

            const r = Math.max(1, outerR - fs * innerFactor);
            const dd = `M ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r}`;
            pathEl.setAttribute("d", dd);

            const pathLen = pathEl.getTotalLength();
            const textLen = textEl.getComputedTextLength();
            return textLen <= pathLen;
        };

        requestAnimationFrame(() => {
            let lo = minFontSize;
            let hi = fontSize;
            let best = minFontSize;

            for (let i = 0; i < 12; i++) {
                const mid = Math.floor((lo + hi) / 2);
                if (fits(mid)) {
                    best = mid;
                    lo = mid + 1;
                } else {
                    hi = mid - 1;
                }
            }

            setFitFontSize(best);
        });
    }, [text, fontSize, minFontSize, outerR, innerFactor, cx, cy]);

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
            <g transform={`rotate(${rotateDeg} ${cx} ${cy})`}>
                {showCircle && <circle cx={cx} cy={cy} r={outerR} fill="none" />}
                <path ref={pathRef} id={id} d={d} fill="none" />
                <text ref={textRef} fontSize={fitFontSize} fill={color}>
                    <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
                        {text}
                    </textPath>
                </text>
            </g>
        </svg>
    );
}
