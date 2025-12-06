import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Card, Empty, Input, theme } from "antd";
import { LeftOutlined, PlayCircleOutlined, RightOutlined, SearchOutlined } from "@ant-design/icons";

import { TonieCardProps } from "../../../types/tonieTypes";
import StandAloneAudioPlayer from "./elements/AudioPlayer";
import { useHoldToScroll } from "./hooks/useHoldToScroll";
import { useHorizontalDragScroll } from "./hooks/useHorizontalDragScroll";
import { usePageLoaded } from "./hooks/usePageLoaded";
import { useWheelHorizontalScroll } from "./hooks/useWheelHorizontalScroll";
import { useTranslation } from "react-i18next";
import { useDebouncedCallback } from "../common/hooks/useDebouncedCallback";

const { useToken } = theme;

export interface TeddyAudioPlayerProps {
    tonieCards: TonieCardProps[];
    overlay: string;
    preselectedTonieCard?: TonieCardProps;
    preselectedPlayPosition?: number;
    onToniesChange?: (toniecard: TonieCardProps | undefined) => void;
    onPlayPositionChange?: (position: number) => void;
}

export const TeddyAudioPlayer: React.FC<TeddyAudioPlayerProps> = ({
    tonieCards,
    overlay,
    preselectedTonieCard,
    preselectedPlayPosition,
    onToniesChange,
    onPlayPositionChange,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [currentTonie, setCurrentTonie] = useState<TonieCardProps | undefined>(preselectedTonieCard);
    const [playPosition, setPlayPosition] = useState<number>(preselectedPlayPosition ?? 0);
    const [hoveredTonieRUID, setHoveredTonieRUID] = useState<string | null>(null);

    const scrollSpeed = 20;
    const allLoaded = usePageLoaded();

    useHorizontalDragScroll(containerRef);
    useWheelHorizontalScroll(containerRef);
    const { startScrollLeft, startScrollRight, stopScrolling } = useHoldToScroll(containerRef, scrollSpeed);

    useEffect(() => {
        if (!preselectedTonieCard) {
            setCurrentTonie(undefined);
            return;
        }
        handlePlay(preselectedTonieCard);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preselectedTonieCard]);

    const handlePlay = (tonie: TonieCardProps | undefined) => {
        onToniesChange?.(tonie);

        if (!tonie) {
            setCurrentTonie(undefined);
            return;
        }

        if (!allLoaded) return;

        const newTonie: TonieCardProps = {
            ...tonie,
            tonieInfo: {
                ...tonie.tonieInfo,
                ...tonie.sourceInfo,
            },
        };

        setPlayPosition(0);
        setCurrentTonie(newTonie);
    };

    const [searchText, setSearchText] = useState("");
    const [searchDraft, setSearchDraft] = useState("");

    const setSearchTextDebounced = useDebouncedCallback((value: string) => setSearchText(value), 250);

    const q = searchText.trim().toLowerCase();

    const filteredTonieCards = tonieCards.filter((tonie) => {
        const series = tonie.sourceInfo?.series ?? tonie.tonieInfo?.series ?? t("tonies.teddyaudioplayer.unknown");

        const episode = tonie.sourceInfo?.episode ?? tonie.tonieInfo?.episode ?? ""; // keep as string

        // if filter is empty, show all
        if (!q) return true;

        return series.toLowerCase().includes(q) || episode.toLowerCase().includes(q);
    });

    const [contentOverflows, setContentOverflows] = useState(false);

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const update = () => setContentOverflows(el.scrollWidth > el.clientWidth);

        update();

        const ro = new ResizeObserver(update);
        ro.observe(el);

        window.addEventListener("load", update);

        return () => {
            ro.disconnect();
            window.removeEventListener("load", update);
        };
    }, []);

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        setContentOverflows(el.scrollWidth > el.clientWidth);
    }, [filteredTonieCards.length]);

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <StandAloneAudioPlayer
                    tonieCard={currentTonie}
                    playPosition={playPosition}
                    onPlayPositionChange={(pos) => {
                        setPlayPosition(pos);
                        onPlayPositionChange?.(pos);
                    }}
                />
            </div>

            <div style={{ position: "relative", width: "100%" }}>
                <div
                    onMouseDown={startScrollLeft}
                    onTouchStart={startScrollLeft}
                    onMouseUp={stopScrolling}
                    onMouseLeave={stopScrolling}
                    onTouchEnd={stopScrolling}
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

                <Input
                    id="search-field"
                    placeholder={t("tonies.tonies.filterBar.searchPlaceholder")}
                    value={searchDraft}
                    onChange={(e) => {
                        const v = e.target.value;
                        setSearchDraft(v);
                        setSearchTextDebounced(v);
                    }}
                    allowClear
                    style={{ marginBottom: 8 }}
                />

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
                        justifyContent: !contentOverflows ? "center" : "flex-start",
                    }}
                >
                    {filteredTonieCards.length > 0 ? (
                        filteredTonieCards.map((tonie) => {
                            const series =
                                tonie.sourceInfo?.series ||
                                tonie.tonieInfo.series ||
                                t("tonies.teddyaudioplayer.unknown");
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
                        })
                    ) : (
                        <div style={{ padding: 24, width: "100%" }}>
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("tonies.noData")} />
                        </div>
                    )}
                </div>

                <div
                    onMouseDown={startScrollRight}
                    onTouchStart={startScrollRight}
                    onMouseUp={stopScrolling}
                    onMouseLeave={stopScrolling}
                    onTouchEnd={stopScrolling}
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
