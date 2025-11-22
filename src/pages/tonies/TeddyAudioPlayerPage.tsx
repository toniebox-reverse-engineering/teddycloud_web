import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "antd";
import { ExportOutlined, ImportOutlined } from "@ant-design/icons";

import { TonieCardProps } from "../../types/tonieTypes";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";
import { useTonieboxContent } from "../../hooks/useTonieboxContent";
import { TeddyAudioPlayer } from "../../components/tonies/TeddyAudioPlayer";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAudioContext } from "../../components/audio/AudioContext";
import { useTonies } from "../../hooks/useTonies";
const api = new TeddyCloudApi(defaultAPIConfig());

type TeddyAudioPlayerPageProps = {
    standalone?: boolean;
};

export const TeddyAudioPlayerPage: React.FC<TeddyAudioPlayerPageProps> = ({ standalone = false }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const tonieRuid = searchParams.get("ruid");
    const startPosition = Number(searchParams.get("position")) || 0;
    const linkOverlay = searchParams.get("overlay");

    const { t } = useTranslation();
    const { playAudio } = useAudioContext();
    const { overlay } = useTonieboxContent(linkOverlay);

    const contentRef = useRef<HTMLDivElement>(null);

    const [currentPlayPosition, setCurrentPlayPosition] = useState<number | undefined>(0);
    const [currentTonie, setCurrentTonie] = useState<TonieCardProps>();
    const [playerKey, setPlayerKey] = useState(0);

    const openStandalone = () => {
        if (currentTonie) {
            const params = new URLSearchParams();
            params.set("ruid", currentTonie.ruid);
            params.set("position", (currentPlayPosition ?? 0).toString());
            window.open(`../audioplayer?${params.toString()}`, "_blank");
        } else {
            window.open("../audioplayer", "_blank");
        }
        navigate("/");
    };

    const sortTonies = (a: TonieCardProps, b: TonieCardProps) => {
        const seriesA = a.sourceInfo?.series || a.tonieInfo.series || "Unknown";
        const seriesB = b.sourceInfo?.series || b.tonieInfo.series || "Unknown";

        if (seriesA < seriesB) return -1;
        if (seriesA > seriesB) return 1;

        const episodeA = a.sourceInfo?.episode || a.tonieInfo.episode || "";
        const episodeB = b.sourceInfo?.episode || b.tonieInfo.episode || "";

        if (episodeA < episodeB) return -1;
        if (episodeA > episodeB) return 1;

        return 0;
    };

    const { tonies, loading } = useTonies({
        overlay: overlay ?? "",
        merged: false,
        sort: sortTonies,
        filter: "tag",
    });

    const playableTonieCards = useMemo(() => {
        return tonies.filter((tonie) => tonie.valid || tonie.source.startsWith("http"));
    }, [tonies]);

    useEffect(() => {
        if (tonieRuid && playableTonieCards) {
            const tonie = playableTonieCards.find((t) => t.ruid === tonieRuid);
            if (!tonie) {
                return;
            }
            const newTonie = {
                ...tonie,
                tonieInfo: {
                    ...tonie.tonieInfo,
                    ...tonie.sourceInfo,
                },
            };
            setCurrentTonie(newTonie);
            setCurrentPlayPosition(startPosition);
            setPlayerKey((prev) => prev + 1);
            navigate(location.pathname, { replace: true });
        }
    }, [location, playableTonieCards, tonieRuid, startPosition]);

    const teddyAudioPlayerContent = (
        <StyledContent
            ref={contentRef}
            style={{
                height: "100%",
                overflowX: "hidden",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1>{t("tonies.teddyaudioplayer.title")}</h1>
                <div style={{ display: "flex", gap: 8 }}>
                    {currentTonie && !standalone && (
                        <ImportOutlined
                            title={t("tonies.teddyaudioplayer.continueInFooterAudioPlayer")}
                            onClick={() => {
                                const newTonie = {
                                    ...currentTonie,
                                    tonieInfo: {
                                        ...currentTonie.tonieInfo,
                                        ...currentTonie.sourceInfo,
                                    },
                                };
                                playAudio(
                                    import.meta.env.VITE_APP_TEDDYCLOUD_API_URL + newTonie.audioUrl,
                                    newTonie.tonieInfo,
                                    newTonie,
                                    currentPlayPosition
                                );
                                setCurrentTonie(undefined);
                                setCurrentPlayPosition(0);
                                setPlayerKey((prev) => prev + 1);
                            }}
                        />
                    )}
                    {!standalone && (
                        <Button
                            title={t("tonies.teddyaudioplayer.openStandalone")}
                            type="text"
                            icon={<ExportOutlined />}
                            onClick={openStandalone}
                        />
                    )}
                </div>
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : (
                <TeddyAudioPlayer
                    key={playerKey}
                    tonieCards={playableTonieCards}
                    overlay={overlay}
                    preselectedTonieCard={currentTonie}
                    preselectedPlayPosition={currentPlayPosition}
                    onToniesChange={(tonie) => setCurrentTonie(tonie)}
                    onPlayPositionChange={(pos) => setCurrentPlayPosition(pos)}
                />
            )}
        </StyledContent>
    );

    return standalone ? (
        <>
            <style>
                {`
                    .ant-layout-header,
                    .ant-breadcrumb,
                    .additional-footer-padding, 
                    .ant-layout-footer  {
                        display: none !important;
                    }
                `}
            </style>
            <BreadcrumbWrapper
                items={[
                    { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                    { title: t("tonies.teddyaudioplayer.standaloneTitle") },
                ]}
            />
            {teddyAudioPlayerContent}
        </>
    ) : (
        <>
            <StyledSider>
                <ToniesSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                        { title: <Link to="/tonies">{t("tonies.navigationTitle")}</Link> },
                        { title: t("tonies.teddyaudioplayer.navigationTitle") },
                    ]}
                />
                {teddyAudioPlayerContent}
            </StyledLayout>
        </>
    );
};
