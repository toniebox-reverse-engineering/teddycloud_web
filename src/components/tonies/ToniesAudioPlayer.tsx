import React, { useEffect, useRef, useState } from "react";
import { Card } from "antd";
import { LeftOutlined, PlayCircleOutlined, RightOutlined } from "@ant-design/icons";
import { theme } from "antd";
import { TonieCardProps } from "../../types/tonieTypes";
import StandAloneAudioPlayer from "../audio/StandAloneAudioPlayer";
import { t } from "i18next";
const { useToken } = theme;

export const ToniesAudioPlayer: React.FC<{
    tonieCards: TonieCardProps[];
    overlay: string;
    preselectedTonieCard?: TonieCardProps;
    preselectedPlayPosition?: number;
    onToniesChange?: (toniecard: TonieCardProps | undefined) => void;
    onPlayPositionChange?: (position: number) => void;
}> = ({ tonieCards, overlay, preselectedTonieCard, preselectedPlayPosition, onToniesChange, onPlayPositionChange }) => {
    const { token } = useToken();
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentTonie, setCurrentTonie] = useState<TonieCardProps | undefined>(preselectedTonieCard);
    const [playPosition, setPlayPosition] = useState<number>(preselectedPlayPosition ?? 0);
    const [hoveredTonieRUID, setHoveredTonieRUID] = useState<string | null>(null);
    const stopScroll = useRef<(() => void) | null>(null);
    const scrollSpeed = 20;

    const usePageLoaded = () => {
        const [loaded, setLoaded] = useState(false);

        useEffect(() => {
            const handleLoad = () => setLoaded(true);

            if (document.readyState === "complete") {
                setLoaded(true);
            } else {
                window.addEventListener("load", handleLoad);
                return () => window.removeEventListener("load", handleLoad);
            }
        }, []);

        return loaded;
    };

    const allLoaded = usePageLoaded();

    useEffect(() => {
        if (!preselectedTonieCard) {
            setCurrentTonie(undefined);
            return;
        }
        handlePlay(preselectedTonieCard);
    }, [preselectedTonieCard]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let isDragging = false;
        let startX = 0;
        let scrollStart = 0;

        container.style.userSelect = "none";

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            container.scrollLeft += e.deltaY;
        };

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

        container.addEventListener("wheel", handleWheel, { passive: false });
        container.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        container.style.cursor = "grab";

        return () => {
            container.removeEventListener("wheel", handleWheel);
            container.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    useEffect(() => {
        const stop = () => stopScroll.current?.();

        document.addEventListener("mouseup", stop);
        document.addEventListener("touchend", stop);
        document.addEventListener("touchcancel", stop);

        return () => {
            document.removeEventListener("mouseup", stop);
            document.removeEventListener("touchend", stop);
            document.removeEventListener("touchcancel", stop);
        };
    }, []);

    const handlePlay = (tonie: TonieCardProps | undefined) => {
        if (onToniesChange) {
            onToniesChange(tonie);
        }
        if (!tonie) {
            setCurrentTonie(undefined);
            return;
        }
        if (!allLoaded) return;
        const newTonie = {
            ...tonie,
            tonieInfo: {
                ...tonie.tonieInfo,
                ...tonie.sourceInfo,
            },
        };
        setPlayPosition(0);
        setCurrentTonie(newTonie);
    };

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

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <StandAloneAudioPlayer
                    tonieCard={currentTonie}
                    playPosition={playPosition}
                    onPlayPositionChange={onPlayPositionChange}
                />
            </div>
            <div style={{ position: "relative", width: "100%" }}>
                <div
                    onMouseDown={(e) => {
                        stopScroll.current?.();
                        stopScroll.current = scrollByHold(-scrollSpeed);
                    }}
                    onTouchStart={(e) => {
                        stopScroll.current?.();
                        stopScroll.current = scrollByHold(-scrollSpeed);
                    }}
                    onMouseUp={() => stopScroll.current?.()}
                    onMouseLeave={() => stopScroll.current?.()}
                    onTouchEnd={() => stopScroll.current?.()}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: 2,
                        cursor: "pointer",
                        background: token.colorBgContainer,
                        borderRadius: "50%",
                        padding: 4,
                        WebkitUserSelect: "none",
                        userSelect: "none",
                        WebkitTouchCallout: "none",
                        touchAction: "none",
                    }}
                >
                    <LeftOutlined style={{ fontSize: 24 }} />
                </div>
                <div
                    className="tonies-carousel"
                    ref={containerRef}
                    style={{
                        display: "flex",
                        overflowX: "auto",
                        gap: 8,
                        padding: "8px 16px 24px 16px",
                        scrollBehavior: "auto",
                        WebkitOverflowScrolling: "touch",
                        scrollbarColor: `${token.colorTextDescription} ${token.colorBgContainer}`,
                    }}
                >
                    {tonieCards.map((tonie) => {
                        const series =
                            tonie.sourceInfo?.series || tonie.tonieInfo.series || t("tonies.toniesaudioplayer.unknown");
                        const episode = tonie.sourceInfo?.episode || tonie.tonieInfo.episode || "";
                        const picture = tonie.sourceInfo?.picture || tonie.tonieInfo.picture || "/img_unknown.png";

                        return (
                            <div key={tonie.ruid} style={{ flex: "0 0 auto", width: 150 }}>
                                <Card
                                    title={series}
                                    size="small"
                                    cover={
                                        <div
                                            style={{ position: "relative", height: 100, width: "100%" }}
                                            onMouseEnter={() => setHoveredTonieRUID(tonie.ruid)}
                                            onMouseLeave={() => setHoveredTonieRUID(null)}
                                        >
                                            <img
                                                src={picture}
                                                alt={series}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "contain",
                                                    borderRadius: 4,
                                                    padding: 8,
                                                    userSelect: "none",
                                                    WebkitUserSelect: "none",
                                                    pointerEvents: "auto",
                                                }}
                                                draggable={false}
                                                onDragStart={(e) => e.preventDefault()}
                                            />
                                            {allLoaded && (
                                                <PlayCircleOutlined
                                                    style={{
                                                        fontSize: 48,
                                                        color: token.colorText,
                                                        position: "absolute",
                                                        top: "50%",
                                                        left: "50%",
                                                        transform: "translate(-50%, -50%)",
                                                        borderRadius: "50%",
                                                        opacity: hoveredTonieRUID === tonie.ruid ? 0.8 : 0,
                                                        transition: "opacity 0.3s",
                                                    }}
                                                    onClick={() => handlePlay(tonie)}
                                                />
                                            )}
                                        </div>
                                    }
                                >
                                    <Card.Meta
                                        description={
                                            <div
                                                style={{
                                                    fontSize: "small",
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    lineHeight: "1.1em",
                                                    maxHeight: "2.4em",
                                                    minHeight: "2.4em",
                                                }}
                                            >
                                                {episode}
                                            </div>
                                        }
                                    />
                                </Card>
                            </div>
                        );
                    })}
                </div>

                <div
                    onMouseDown={(e) => {
                        stopScroll.current?.();
                        stopScroll.current = scrollByHold(scrollSpeed);
                    }}
                    onTouchStart={(e) => {
                        stopScroll.current?.();
                        stopScroll.current = scrollByHold(scrollSpeed);
                    }}
                    onMouseUp={() => stopScroll.current?.()}
                    onMouseLeave={() => stopScroll.current?.()}
                    onTouchEnd={() => stopScroll.current?.()}
                    style={{
                        position: "absolute",
                        right: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: 2,
                        cursor: "pointer",
                        background: token.colorBgContainer,
                        borderRadius: "50%",
                        padding: 4,
                        WebkitUserSelect: "none",
                        userSelect: "none",
                        WebkitTouchCallout: "none",
                        touchAction: "none",
                    }}
                >
                    <RightOutlined style={{ fontSize: 24 }} />
                </div>
            </div>
        </div>
    );
};
