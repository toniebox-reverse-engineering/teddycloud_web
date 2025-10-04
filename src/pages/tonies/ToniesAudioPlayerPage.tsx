import { useEffect, useState, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Tooltip, Button } from "antd";
import { ExportOutlined, ImportOutlined } from "@ant-design/icons";

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
import { useAudioContext } from "../../components/audio/AudioContext";
const api = new TeddyCloudApi(defaultAPIConfig());

type ToniesAudioPlayerPageProps = {
    standalone?: boolean;
};

export const ToniesAudioPlayerPage: React.FC<ToniesAudioPlayerPageProps> = ({ standalone = false }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const tonieRuid = searchParams.get("ruid");
    const startPosition = Number(searchParams.get("position")) || 0;
    const linkOverlay = searchParams.get("overlay");

    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();
    const { playAudio } = useAudioContext();
    const { overlay } = useTonieboxContent(linkOverlay);

    const contentRef = useRef<HTMLDivElement>(null);

    const [tonies, setTonies] = useState<TonieCardProps[]>([]);
    const [loading, setLoading] = useState(true);

    const [currentPlayPosition, setCurrentPlayPosition] = useState<number | undefined>(0);
    const [currentTonie, setCurrentTonie] = useState<TonieCardProps>();
    const [playerKey, setPlayerKey] = useState(0);

    const openStandalone = () => {
        if (currentTonie) {
            const params = new URLSearchParams();
            params.set("ruid", currentTonie.ruid);
            params.set("position", (currentPlayPosition ?? 0).toString());
            window.open(`tcplayer?${params.toString()}`, "_blank");
        } else {
            window.open("tcplayer", "_blank");
        }
        navigate("/");
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

    const playableTonieCards = useMemo(() => {
        return tonies
            .filter((tonie) => tonie.type === "tag")
            .filter((tonie) => tonie.hide === false)
            .filter((tonie) => tonie.valid || tonie.source.startsWith("http"));
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

    const toniesAudioPlayerContent = (
        <StyledContent
            ref={contentRef}
            style={{
                overflow: "auto",
                height: "100%",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1>{t("tonies.toniesaudioplayer.title")}</h1>
                <div style={{ display: "flex", gap: 8 }}>
                    {currentTonie && !standalone && (
                        <Tooltip title={t("tonies.toniesaudioplayer.continueInFooterAudioPlayer")}>
                            <ImportOutlined
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
                        </Tooltip>
                    )}
                    {!standalone && (
                        <Tooltip title={t("tonies.toniesaudioplayer.openStandalone")}>
                            <Button type="text" icon={<ExportOutlined />} onClick={openStandalone} />
                        </Tooltip>
                    )}
                </div>
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : (
                <ToniesAudioPlayer
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
                items={[{ title: t("home.navigationTitle") }, { title: t("tonies.toniesaudioplayer.standaloneTitle") }]}
            />
            {toniesAudioPlayerContent}
        </>
    ) : (
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
                {toniesAudioPlayerContent}
            </StyledLayout>
        </>
    );
};
