import React, { useEffect, useRef, useState } from "react";
import { theme } from "antd";

type ThumbnailCellProps = {
    src: string;
    alt?: string;
    size?: number;
    onClick?: () => void;
    loadingMargin?: string;
};

/**
 * Compact, lazy-loaded thumbnail cell used in table contexts.
 * Keeps image geometry stable (default 40x40) and isolates layout from global table img styles.
 */
export const ThumbnailCell: React.FC<ThumbnailCellProps> = ({
    src,
    alt = "",
    size = 40,
    onClick,
    loadingMargin = "120px 0px",
}) => {
    const { token } = theme.useToken();
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setIsLoaded(false);
        setHasError(false);
    }, [src]);

    useEffect(() => {
        if (isVisible) return;
        const node = wrapperRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: loadingMargin }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [isVisible, loadingMargin]);

    const isInteractive = typeof onClick === "function";

    return (
        <div
            ref={wrapperRef}
            role={isInteractive ? "button" : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            onClick={(e: React.MouseEvent) => {
                if (!onClick) return;
                e.stopPropagation();
                onClick();
            }}
            onKeyDown={(e) => {
                if (!isInteractive) return;
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onClick!();
                }
            }}
            style={{
                width: size,
                height: size,
                borderRadius: 6,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                position: "relative",
                cursor: isInteractive ? "pointer" : "default",
                flexShrink: 0,
            }}
        >
            {!isLoaded && (
                <div
                    aria-hidden
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        color: token.colorTextDescription,
                        userSelect: "none",
                    }}
                >
                    {hasError ? "!" : "..."}
                </div>
            )}
            {isVisible && (
                <img
                    src={src}
                    alt={alt}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setIsLoaded(true)}
                    onError={() => {
                        setHasError(true);
                        setIsLoaded(false);
                    }}
                    style={{
                        width: size,
                        height: size,
                        objectFit: "contain",
                        display: "block",
                        opacity: isLoaded ? 1 : 0,
                        transition: "opacity 120ms ease",
                    }}
                />
            )}
        </div>
    );
};

export default ThumbnailCell;
