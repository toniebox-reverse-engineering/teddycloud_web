import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TonieCardProps } from "../../types/tonieTypes";

import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { ToniesList } from "../../components/tonies/tonieslist/ToniesList";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";

import { TonieboxOverlaySelect } from "../../components/tonies/common/TonieboxOverlaySelect";
import { useTonieboxContentOverlay } from "../../hooks/useTonieboxContentOverlay";

const api = new TeddyCloudApi(defaultAPIConfig());

export const SystemSoundsPage = () => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();
    const { overlay, tonieBoxContentDirs, changeOverlay } = useTonieboxContentOverlay();

    const [tonies, setTonies] = useState<TonieCardProps[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTonies = async () => {
            setLoading(true);
            try {
                // Perform API call to fetch Tonie data
                const tonieData = await api.apiGetTagIndex(overlay ? overlay : "");
                setTonies(
                    tonieData.sort((a, b) => {
                        if (a.tonieInfo.series < b.tonieInfo.series) {
                            return -1;
                        }
                        if (a.tonieInfo.series > b.tonieInfo.series) {
                            return 1;
                        }
                        if (a.tonieInfo.episode < b.tonieInfo.episode) {
                            return -1;
                        }
                        if (a.tonieInfo.episode > b.tonieInfo.episode) {
                            return 1;
                        }
                        return 0;
                    })
                );
            } catch (error) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("tonies.errorFetchingSystemSounds"),
                    t("tonies.errorFetchingSystemSounds") + ": " + error,
                    t("tonies.navigationTitle")
                );
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
                        { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                        { title: <Link to="/tonies">{t("tonies.navigationTitle")}</Link> },
                        { title: t("tonies.system-sounds.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignContent: "center",
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 8,
                            alignItems: "center",
                            marginBottom: 8,
                        }}
                    >
                        <h1>{t("tonies.system-sounds.title")}</h1>
                        <TonieboxOverlaySelect
                            tonieBoxContentDirs={tonieBoxContentDirs}
                            overlay={overlay}
                            onChange={changeOverlay}
                            selectProps={{ size: "small", style: { maxWidth: 300 } }}
                        />
                    </div>
                    {loading ? (
                        <LoadingSpinner />
                    ) : (
                        <ToniesList
                            showFilter={false}
                            showPagination={true}
                            tonieCards={tonies.filter((tonie) => tonie.type === "system")}
                            overlay={overlay}
                            readOnly={false}
                            noLastRuid={true}
                        />
                    )}
                </StyledContent>
            </StyledLayout>
        </>
    );
};
