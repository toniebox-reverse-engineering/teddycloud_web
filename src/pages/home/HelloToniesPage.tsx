import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Typography } from "antd";
import {
    HiddenDesktop,
    StyledBreadcrumb,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { HomeSubNav } from "../../components/home/HomeSubNav";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Paragraph } = Typography;

interface Image {
    src: string;
    id: number;
    top: number;
    left: number;
}

export const HelloToniesPage = () => {
    const { t } = useTranslation();

    const [randomizedImages, setRandomizedImages] = useState<Image[]>([]);

    useEffect(() => {
        const fetchTonies = async () => {
            // Perform API call to fetch Tonie data
            const tonieData = (await api.apiGetTagIndexMergedAllOverlays())
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
                );

            // Generate random positions for the images
            const allImages = tonieData.flatMap((item) => item.tonieInfo.picture);

            const parentWidth = document.getElementById("collage-container")?.clientWidth || 0;
            const parentHeight = document.getElementById("collage-container")?.clientHeight || 0;

            // Generate random positions for the images
            const shuffledImages = allImages.map((src, index) => {
                return {
                    src: src,
                    id: index,
                    top: Math.random() * ((100 * (parentHeight - 200)) / parentHeight), // Random top position percentage
                    left: Math.random() * ((100 * (parentWidth - 200)) / parentWidth), // Random left position percentage
                };
            });

            setRandomizedImages(shuffledImages);
        };
        fetchTonies();
    }, []);

    return (
        <>
            <StyledSider>
                <HomeSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <HomeSubNav />
                </HiddenDesktop>
                <StyledBreadcrumb items={[{ title: t("home.navigationTitle") }]} />
                <StyledContent>
                    <Paragraph>
                        <div
                            id="collage-container"
                            className="collage-container"
                            style={{ display: "flex", position: "relative", width: "100%", height: "550px" }}
                        >
                            {randomizedImages.map((image) => (
                                <img
                                    key={image.id}
                                    src={image.src}
                                    alt={`Random ${image.id}`}
                                    className="collage-image"
                                    style={{
                                        position: "absolute",
                                        top: `${image.top}%`,
                                        left: `${image.left}%`,
                                        width: "200px",
                                        height: "200px",
                                        objectFit: "cover",
                                        transition: "transform 0.3s",
                                    }}
                                />
                            ))}
                        </div>
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
