import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Select } from "antd";

import { TonieCardProps } from "../../types/tonieTypes";

import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { ToniesList } from "../../components/tonies/tonieslist/ToniesList";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";
import { useTonieboxContent } from "../../hooks/useTonieboxContentOverlay";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Option } = Select;

export const SystemSoundsPage = () => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();

    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const linkOverlay = searchParams.get("overlay");
    const { tonieBoxContentDirs, overlay, handleContentOverlayChange } = useTonieboxContent(linkOverlay);

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
                        {tonieBoxContentDirs.length > 1 ? (
                            <Select
                                id="contentDirectorySelect"
                                defaultValue=""
                                onChange={handleContentOverlayChange}
                                style={{ maxWidth: "300px" }}
                                value={overlay}
                                title={t("tonies.content.showToniesOfBoxes")}
                            >
                                {tonieBoxContentDirs.map(([contentDir, boxNames, boxId]) => (
                                    <Option key={boxId} value={boxId}>
                                        {boxNames.join(", ")}
                                    </Option>
                                ))}
                            </Select>
                        ) : (
                            ""
                        )}
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
