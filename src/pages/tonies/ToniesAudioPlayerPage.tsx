import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Tooltip, Button } from "antd";
import { FullscreenOutlined, FullscreenExitOutlined } from "@ant-design/icons";

import { TonieCardProps } from "../../types/tonieTypes";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";
import { useTonieboxContent } from "../../components/utils/OverlayContentDirectories";
import { ToniesAudioPlayer } from "../../components/tonies/ToniesAudioPlayer";
import LoadingSpinner from "../../components/utils/LoadingSpinner";
import { useFullscreen } from "../../utils/browserUtils";

const api = new TeddyCloudApi(defaultAPIConfig());

export const ToniesAudioPlayerPage = () => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();
    const contentRef = useRef<HTMLDivElement>(null);
    const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(contentRef);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const linkOverlay = searchParams.get("overlay");
    const { overlay } = useTonieboxContent(linkOverlay);

    const [tonies, setTonies] = useState<TonieCardProps[]>([]);
    const [loading, setLoading] = useState(true);
    //const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement && contentRef.current) {
            contentRef.current.requestFullscreen();
            enterFullscreen();
        } else {
            document.exitFullscreen();
            exitFullscreen();
        }
    };

    useEffect(() => {
        const fetchTonies = async () => {
            setLoading(true);
            try {
                const tonieData = (await api.apiGetTagIndex(overlay ? overlay : "", true)).filter((item) => !item.hide);
                setTonies(
                    tonieData.sort((a, b) => {
                        const seriesA = a.sourceInfo?.series || a.tonieInfo.series || "Unknown";
                        const seriesB = b.sourceInfo?.series || b.tonieInfo.series || "Unknown";

                        if (seriesA < seriesB) return -1;
                        if (seriesA > seriesB) return 1;

                        const episodeA = a.sourceInfo?.episode || a.tonieInfo.episode || "";
                        const episodeB = b.sourceInfo?.episode || b.tonieInfo.episode || "";

                        if (episodeA < episodeB) return -1;
                        if (episodeA > episodeB) return 1;

                        return 0;
                    })
                );
            } catch (error) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("tonies.errorFetchingTonies"),
                    t("tonies.errorFetchingTonies") + ": " + error,
                    t("tonies.toniesaudioplayer.navigationTitle")
                );
                console.log("error: fetching tonies failed: " + error);
            } finally {
                setLoading(false);
            }
        };

        fetchTonies();
    }, [overlay]);

    return (
        <>
            <StyledSider>
                <ToniesSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("tonies.navigationTitle") },
                        { title: t("tonies.toniesaudioplayer.navigationTitle") },
                    ]}
                />
                <StyledContent
                    ref={contentRef}
                    className={isFullscreen ? "pseudo-fullscreen" : ""}
                    style={{
                        overflow: "auto",
                        height: "100%",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h1>{t("tonies.toniesaudioplayer.title")}</h1>
                        <Tooltip
                            title={
                                isFullscreen
                                    ? t("tonies.toniesaudioplayer.exitFullscreen")
                                    : t("tonies.toniesaudioplayer.enterFullscreen")
                            }
                        >
                            <Button
                                type="text"
                                icon={
                                    isFullscreen ? (
                                        <FullscreenExitOutlined style={{ fontSize: 20 }} />
                                    ) : (
                                        <FullscreenOutlined style={{ fontSize: 20 }} />
                                    )
                                }
                                onClick={toggleFullscreen}
                            />
                        </Tooltip>
                    </div>

                    {loading ? (
                        <LoadingSpinner />
                    ) : (
                        <ToniesAudioPlayer
                            tonieCards={tonies
                                .filter((tonie) => tonie.type === "tag")
                                .filter((tonie) => tonie.hide === false)}
                            overlay={overlay}
                        />
                    )}
                </StyledContent>
            </StyledLayout>
        </>
    );
};
