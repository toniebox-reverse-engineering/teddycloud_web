import { useEffect, useMemo, useState } from "react";

export const useStickySavePanel = () => {
    const [measuredFooterHeight, setMeasuredFooterHeight] = useState(51);
    const [isFooterVisible, setIsFooterVisible] = useState(false);
    const [showArrow, setShowArrow] = useState(true);

    const footerHeight = useMemo(
        () => (isFooterVisible ? measuredFooterHeight : 0),
        [isFooterVisible, measuredFooterHeight]
    );

    useEffect(() => {
        const footerElement = document.querySelector("footer") as HTMLElement | null;
        if (!footerElement) return;

        const updateArrowState = () => {
            const scrollTop = window.scrollY;
            const windowHeight = window.innerHeight;
            const fullHeight = document.documentElement.scrollHeight;

            setShowArrow(!(scrollTop + windowHeight >= fullHeight - 20));
        };

        setMeasuredFooterHeight(footerElement.offsetHeight || 0);

        const resizeObserver = new ResizeObserver(() => {
            setMeasuredFooterHeight(footerElement.offsetHeight || 0);
            updateArrowState();
        });
        resizeObserver.observe(footerElement);

        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                setIsFooterVisible(entry.isIntersecting);
            },
            {
                root: null,
                threshold: 0,
            }
        );
        intersectionObserver.observe(footerElement);

        window.addEventListener("scroll", updateArrowState, { passive: true });
        window.addEventListener("resize", updateArrowState);

        updateArrowState();

        return () => {
            window.removeEventListener("scroll", updateArrowState);
            window.removeEventListener("resize", updateArrowState);
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
        };
    }, []);

    return { footerHeight, showArrow };
};
