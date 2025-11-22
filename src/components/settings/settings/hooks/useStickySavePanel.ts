import { useEffect, useState } from "react";

export const useStickySavePanel = () => {
    const [footerHeight, setFooterHeight] = useState(51);
    const [showArrow, setShowArrow] = useState(true);

    useEffect(() => {
        const footerElement = document.querySelector("footer") as HTMLElement | null;

        const updateFooterHeightAndScrollState = () => {
            if (footerElement) {
                setFooterHeight(footerElement.offsetHeight || 0);
            }

            const scrollTop = window.scrollY;
            const windowHeight = window.innerHeight;
            const fullHeight = document.documentElement.scrollHeight;

            if (scrollTop + windowHeight >= fullHeight - 20) {
                setShowArrow(false);
            } else {
                setShowArrow(true);
            }
        };

        let resizeObserver: ResizeObserver | null = null;

        if (footerElement) {
            setFooterHeight(footerElement.offsetHeight || 0);
            resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const target = entry.target as HTMLElement;
                    if (target === footerElement) {
                        setFooterHeight(target.offsetHeight);
                    }
                }
                updateFooterHeightAndScrollState();
            });
            resizeObserver.observe(footerElement);
        }

        window.addEventListener("scroll", updateFooterHeightAndScrollState);
        window.addEventListener("resize", updateFooterHeightAndScrollState);

        updateFooterHeightAndScrollState();

        return () => {
            window.removeEventListener("scroll", updateFooterHeightAndScrollState);
            window.removeEventListener("resize", updateFooterHeightAndScrollState);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, []);

    return { footerHeight, showArrow };
};
