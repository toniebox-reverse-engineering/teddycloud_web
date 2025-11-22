import { RefObject, useEffect } from "react";

export function useHorizontalDragScroll(containerRef: RefObject<HTMLDivElement | null>) {
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let isDragging = false;
        let startX = 0;
        let scrollStart = 0;

        const originalUserSelect = container.style.userSelect;
        const originalCursor = container.style.cursor;

        container.style.userSelect = "none";
        container.style.cursor = "grab";

        const handleMouseDown = (e: MouseEvent) => {
            isDragging = true;
            startX = e.clientX;
            scrollStart = container.scrollLeft;
            container.style.cursor = "grabbing";
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const delta = startX - e.clientX;
            container.scrollLeft = scrollStart + delta;
        };

        const handleMouseUp = () => {
            isDragging = false;
            container.style.cursor = "grab";
        };

        container.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            container.style.userSelect = originalUserSelect;
            container.style.cursor = originalCursor;

            container.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [containerRef]);
}
