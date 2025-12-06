import { RefObject, useEffect, useRef } from "react";

export function useHoldToScroll(
    containerRef: RefObject<HTMLDivElement | null>,
    scrollSpeed: number
): {
    startScrollLeft: () => void;
    startScrollRight: () => void;
    stopScrolling: () => void;
} {
    const stopScrollRef = useRef<(() => void) | null>(null);

    const scrollByHold = (speed: number) => {
        const container = containerRef.current;
        if (!container) return () => {};

        let active = true;

        const step = () => {
            if (!active) return;
            container.scrollLeft += speed;
            requestAnimationFrame(step);
        };

        requestAnimationFrame(step);

        return () => {
            active = false;
        };
    };

    const startScrollLeft = () => {
        stopScrollRef.current?.();
        stopScrollRef.current = scrollByHold(-scrollSpeed);
    };

    const startScrollRight = () => {
        stopScrollRef.current?.();
        stopScrollRef.current = scrollByHold(scrollSpeed);
    };

    const stopScrolling = () => {
        stopScrollRef.current?.();
    };

    useEffect(() => {
        const stop = () => stopScrolling();

        document.addEventListener("mouseup", stop);
        document.addEventListener("touchend", stop);
        document.addEventListener("touchcancel", stop);

        return () => {
            document.removeEventListener("mouseup", stop);
            document.removeEventListener("touchend", stop);
            document.removeEventListener("touchcancel", stop);
        };
    }, []);

    return { startScrollLeft, startScrollRight, stopScrolling };
}
