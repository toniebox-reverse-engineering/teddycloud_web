import React, { useEffect, useRef, useState } from "react";
import { Carousel, Card, Slider } from "antd";
import { LeftOutlined, PlayCircleOutlined, RightOutlined } from "@ant-design/icons";
import { theme } from "antd";
import { TonieCardProps } from "../../types/tonieTypes";
import StandAloneAudioPlayer from "../audio/StandAloneAudioPlayer";
import { CarouselRef } from "antd/es/carousel";
import { t } from "i18next";

const { useToken } = theme;

type ArrowProps = {
    onClick?: React.MouseEventHandler<HTMLDivElement>;
};

export const ToniesAudioPlayer: React.FC<{
    tonieCards: TonieCardProps[];
    overlay: string;
    preselectedTonieCard?: TonieCardProps;
    preselectedPlayPosition?: number;
    onToniesChange?: (toniecard: TonieCardProps | undefined) => void;
    onPlayPositionChange?: (position: number) => void;
}> = ({ tonieCards, overlay, preselectedTonieCard, preselectedPlayPosition, onToniesChange, onPlayPositionChange }) => {
    const { token } = useToken();
    const carouselRef = useRef<CarouselRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const total = tonieCards.length;
    const [currentTonie, setCurrentTonie] = useState<TonieCardProps | undefined>(preselectedTonieCard);
    const [playPosition, setPlayPosition] = useState<number>(preselectedPlayPosition ?? 0);
    const [hoveredTonieRUID, setHoveredTonieRUID] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [slidesToShow, setSlidesToShow] = useState(6);

    const CustomPrevArrow: React.FC<ArrowProps> = ({ onClick }) => (
        <div
            onClick={onClick}
            style={{
                position: "absolute",
                left: -32,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                cursor: "pointer",
            }}
        >
            <LeftOutlined style={{ fontSize: 24, color: "#666" }} />
        </div>
    );

    const CustomNextArrow: React.FC<ArrowProps> = ({ onClick }) => (
        <div
            onClick={onClick}
            style={{
                position: "absolute",
                right: -32,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                cursor: "pointer",
            }}
        >
            <RightOutlined style={{ fontSize: 24, color: "#666" }} />
        </div>
    );

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

    const settings = {
        arrows: true,
        infinite: false,
        slidesToShow: 6,
        slidesToScroll: 1,
        draggable: true,
        swipeToSlide: true,
        dots: false,
        touchMove: true,
        nextArrow: <CustomNextArrow />,
        prevArrow: <CustomPrevArrow />,
        responsive: [
            { breakpoint: 1024, settings: { slidesToShow: 4 } },
            { breakpoint: 500, settings: { slidesToShow: 2 } },
        ],
    };

    useEffect(() => {
        if (!preselectedTonieCard) {
            setCurrentTonie(undefined);
            return;
        }
        handlePlay(preselectedTonieCard);
    }, [preselectedTonieCard]);

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

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (!carouselRef.current) return;

            if (e.deltaY < 0) {
                carouselRef.current.prev();
            } else if (e.deltaY > 0) {
                carouselRef.current.next();
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener("wheel", handleWheel, { passive: false });
        }

        return () => {
            if (container) {
                container.removeEventListener("wheel", handleWheel);
            }
        };
    }, []);

    useEffect(() => {
        function handleResize() {
            const width = window.innerWidth;
            let newSlidesToShow = settings.slidesToShow;

            for (const bp of settings.responsive || []) {
                if (width <= bp.breakpoint) {
                    newSlidesToShow = bp.settings.slidesToShow;
                }
            }

            setSlidesToShow(newSlidesToShow);
        }

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [settings]);

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <StandAloneAudioPlayer
                    tonieCard={currentTonie}
                    playPosition={playPosition}
                    onPlayPositionChange={onPlayPositionChange}
                />
            </div>

            <div className="tonies-carousel" style={{ padding: "0 24px" }} ref={containerRef}>
                <Carousel {...settings} ref={carouselRef} afterChange={(next) => setCurrentIndex(next)}>
                    {tonieCards.map((tonie) => {
                        const series =
                            tonie.sourceInfo?.series || tonie.tonieInfo.series || t("tonies.toniesaudioplayer.unknown");
                        const episode = tonie.sourceInfo?.episode || tonie.tonieInfo.episode || "";
                        const picture = tonie.sourceInfo?.picture || tonie.tonieInfo.picture || "/img_unknown.png";

                        return (
                            <div key={tonie.ruid} style={{ padding: "0 4px", height: 230 }}>
                                <Card
                                    title={series}
                                    size="small"
                                    style={{ height: "100%", margin: "0 8px" }}
                                    cover={
                                        <div
                                            style={{
                                                position: "relative",
                                                height: 130,
                                                width: "100%",
                                            }}
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
                                                    display: "block",
                                                    padding: 8,
                                                }}
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
                </Carousel>
                <Slider
                    min={0}
                    included={false}
                    tooltip={{ open: false }}
                    max={Math.max(0, total - slidesToShow)}
                    value={currentIndex}
                    onChange={(val) => carouselRef.current?.goTo(val)}
                />
            </div>
        </div>
    );
};
