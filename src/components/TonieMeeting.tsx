import { useEffect, useState } from "react";
import { theme } from "antd";

import { defaultAPIConfig } from "../config/defaultApiConfig";
import { TeddyCloudApi } from "../api";

import QuestionMarkSVG from "./utils/QuestionMarkIcon";

const api = new TeddyCloudApi(defaultAPIConfig());
const { useToken } = theme;

interface Image {
    src: string;
    id: number;
    top: string;
    left: string;
}

interface TonieMeetingElementProps {
    maxNoOfGuests: number;
    toniesSize: number;
    showQuestionMark: boolean;
    title?: string;
    description?: string;
    height?: number;
    width?: number;
}

export const TonieMeetingElement: React.FC<TonieMeetingElementProps> = ({
    maxNoOfGuests,
    toniesSize,
    showQuestionMark,
    title,
    description,
    height = document.getElementById("collage-container")?.clientHeight || 0,
    width = document.getElementById("collage-container")?.clientWidth || 0,
}) => {
    const { token } = useToken();
    const [randomizedImages, setRandomizedImages] = useState<Image[]>([]);
    const parentWidth = width;
    const parentHeight = height;
    const centerVertical = 50;
    const centerHorizontal = 50;
    const centerWidth = (document.getElementById("central-text")?.clientWidth || 0) / (parentWidth < 450 ? 3 : 2);
    const centerHeight = (document.getElementById("central-text")?.clientHeight || 0) / (parentHeight < 500 ? 3 : 2);

    useEffect(() => {
        const fetchTonies = async () => {
            // Perform API call to fetch Tonie data
            const tonieData = (await api.apiGetTagIndexMergedAllOverlays(false))
                .sort((a, b) => {
                    if (Math.random() > 0.5) {
                        return Math.floor(-100 * Math.random());
                    } else {
                        return Math.floor(100 * Math.random());
                    }
                })
                .filter(
                    (item) =>
                        !item.tonieInfo.picture.endsWith("/img_unknown.png") &&
                        item.tonieInfo.picture !== null &&
                        item.tonieInfo.picture !== undefined &&
                        item.tonieInfo.picture !== "" &&
                        !item.nocloud
                )
                .slice(0, maxNoOfGuests);

            const allImages = tonieData.flatMap((item) => item.tonieInfo.picture);

            const shuffledImages = allImages.map((src, index) => {
                if (title && description) {
                    let top, left;
                    do {
                        top = Math.random() * (100 - (toniesSize / parentHeight) * 100);
                        left = Math.random() * (100 - (toniesSize / parentWidth) * 100);
                    } while (
                        0 < centerVertical - (centerHeight / parentHeight) * 100 - (toniesSize / parentHeight) * 100 &&
                        0 < centerHorizontal - (centerWidth / parentWidth) * 100 - (toniesSize / parentWidth) * 100 &&
                        top >
                            centerVertical - (centerHeight / parentHeight) * 100 - (toniesSize / parentHeight) * 100 &&
                        top < centerVertical + (centerHeight / parentHeight) * 100 &&
                        left >
                            centerHorizontal - (centerWidth / parentWidth) * 100 - (toniesSize / parentWidth) * 100 &&
                        left < centerHorizontal + (centerWidth / parentWidth) * 100
                    );
                    return {
                        src: src,
                        id: index,
                        top: `${top}%`,
                        left: `${left}%`,
                    };
                } else {
                    const top = Math.random() * (100 - (toniesSize / parentHeight) * 100);
                    const left = Math.random() * (100 - (toniesSize / parentWidth) * 100);

                    return {
                        src: src,
                        id: index,
                        top: `${top}%`,
                        left: `${left}%`,
                    };
                }
            });

            setRandomizedImages(shuffledImages);
        };

        fetchTonies();
    }, [
        centerHeight,
        centerWidth,
        description,
        height,
        maxNoOfGuests,
        parentHeight,
        parentWidth,
        title,
        toniesSize,
        width,
    ]);

    return (
        <div
            id="collage-container"
            className="collage-container"
            style={{
                display: "flex",
                position: "relative",
                width: width ? `${width}px` : "100%",
                height: height ? `${height}px` : "60vh",
            }}
        >
            {title && description && (
                <div
                    id="central-text"
                    className="central-text"
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 1,
                        padding: "8px",
                        textAlign: "center",
                        pointerEvents: "none",
                        borderRadius: 24,
                        textShadow: token.colorBgContainer + " 0 0 8px",
                        background: token.colorBgContainer + "99",
                    }}
                >
                    <h1>{title}</h1>
                    <p>{description}</p>
                </div>
            )}
            {randomizedImages.map((image) => (
                <div
                    key={image.id}
                    className="collage-image-container"
                    style={{
                        position: "absolute",
                        top: image.top,
                        left: image.left,
                        width: "150px",
                        height: "150px",
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    <img
                        src={image.src}
                        alt={`Random ${image.id}`}
                        className="collage-image"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                    {showQuestionMark && (
                        <div
                            className="question-mark-overlay"
                            style={{
                                position: "absolute",
                                top: "5%",
                                right: "20%",
                                width: "30%",
                                height: "30%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <QuestionMarkSVG />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
