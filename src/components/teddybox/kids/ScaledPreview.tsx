import React, { useLayoutEffect, useRef, useState } from "react";

import { useViewport } from "../hooks/useViewport";

const MARGIN = 12;

/**
 * The kids view next to the settings, drawn at the full size of this device and scaled down as
 * a whole: buttons, figures and the box keep the proportions the child will see. The space left
 * at the sides stays neutral.
 */
export const ScaledPreview: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { width, height } = useViewport();
    const ref = useRef<HTMLDivElement>(null);
    const [room, setRoom] = useState({ width: 0, height: 0 });

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const update = () => setRoom({ width: el.clientWidth, height: el.clientHeight });
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const scale = Math.min(
        1,
        Math.max(0, room.width - 2 * MARGIN) / width,
        Math.max(0, room.height - 2 * MARGIN) / height,
    );

    return (
        <div
            ref={ref}
            style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#3a424c" }}
        >
            {room.width > 0 && (
                <div
                    style={{
                        position: "absolute",
                        left: (room.width - width * scale) / 2,
                        top: (room.height - height * scale) / 2,
                        width,
                        height,
                        overflow: "hidden",
                        transform: `scale(${scale})`,
                        transformOrigin: "0 0",
                        borderRadius: 12 / scale,
                        boxShadow: "0 6px 24px #00000059",
                        background: "#dfeadf",
                    }}
                >
                    {children}
                </div>
            )}
        </div>
    );
};
