import { useEffect, useLayoutEffect, useRef, useState } from "react";

export function useAutoFitFontSize(opts: { text: string; maxFontSize: number; minFontSize: number }) {
    const { text, maxFontSize, minFontSize } = opts;
    const ref = useRef<HTMLDivElement | null>(null);
    const [fontSize, setFontSize] = useState(maxFontSize);

    const clamp = (v: number) => Math.max(minFontSize, Math.min(maxFontSize, v));

    useLayoutEffect(() => {
        setFontSize(clamp(maxFontSize));
    }, [text, maxFontSize, minFontSize]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const fit = () => {
            let fs = clamp(maxFontSize);
            el.style.fontSize = `${fs}px`;

            let safety = 60;
            while (safety-- > 0 && fs > minFontSize && el.scrollWidth > el.clientWidth) {
                fs = clamp(fs - 1);
                el.style.fontSize = `${fs}px`;
            }
            setFontSize(fs);
        };

        requestAnimationFrame(fit);

        const ro = new ResizeObserver(() => fit());
        ro.observe(el);

        return () => ro.disconnect();
    }, [text, maxFontSize, minFontSize]);

    return { ref, fontSize };
}
