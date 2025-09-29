import React, { useEffect, useRef, useState } from "react";
import { Carousel, Card } from "antd";
import { LeftOutlined, PlayCircleOutlined, RightOutlined } from "@ant-design/icons";
import { theme } from "antd";
import { TonieCardProps } from "../../types/tonieTypes";
import StandAloneAudioPlayer from "../audio/StandAloneAudioPlayer";
import { CarouselRef } from "antd/es/carousel";
import { t } from "i18next";

const { useToken } = theme;

export const ToniesAudioPlayer: React.FC<{ tonieCards: TonieCardProps[]; overlay: string }> = ({ tonieCards }) => {
    const { token } = useToken();
    const carouselRef = useRef<CarouselRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentTonie, setCurrentTonie] = useState<TonieCardProps>();
    const [hoveredTonieRUID, setHoveredTonieRUID] = useState<string | null>(null);

    const [isTracklistVisible, setIsTracklistVisible] = useState(false);

    const openTracklist = (tonie: TonieCardProps) => {
        setIsTracklistVisible(true);
    };

    const closeTracklist = () => {
        setIsTracklistVisible(false);
    };

    type ArrowProps = {
        onClick?: React.MouseEventHandler<HTMLDivElement>;
    };

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

    const handlePlay = (tonie: TonieCardProps) => {
        if (!allLoaded) return;
        const newTonie = {
            ...tonie,
            tonieInfo: {
                ...tonie.tonieInfo,
                ...tonie.sourceInfo,
            },
        };

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

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <StandAloneAudioPlayer tonieCard={currentTonie} />
            </div>

            <div className="tonies-carousel" style={{ padding: "0 24px" }} ref={containerRef}>
                <Carousel {...settings} ref={carouselRef}>
                    {tonieCards
                        .filter((tonie) => tonie.valid || tonie.source.startsWith("http"))
                        .map((tonie) => {
                            const series =
                                tonie.sourceInfo?.series ||
                                tonie.tonieInfo.series ||
                                t("tonies.toniesaudioplayer.unknown");
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
            </div>
        </div>
    );
};
