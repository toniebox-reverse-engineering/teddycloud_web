import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TonieCardProps } from "../../types/tonieTypes";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/common/StyledComponents";
import { ToniesList } from "../../components/tonies/tonieslist/ToniesList";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import LoadingSpinner from "../../components/common/elements/LoadingSpinner";

import { TonieboxOverlaySelect } from "../../components/tonies/common/elements/TonieboxOverlaySelect";
import { useTonieboxContentOverlay } from "../../hooks/useTonieboxContentOverlay";
import { useTonies } from "../../hooks/useTonies";

export const SystemSoundsPage = () => {
    const { t } = useTranslation();
    const { overlay, tonieBoxContentDirs, changeOverlay } = useTonieboxContentOverlay();

    const sortTonies = (a: TonieCardProps, b: TonieCardProps) => {
        if (a.tonieInfo.series < b.tonieInfo.series) return -1;
        if (a.tonieInfo.series > b.tonieInfo.series) return 1;

        if (a.tonieInfo.episode < b.tonieInfo.episode) return -1;
        if (a.tonieInfo.episode > b.tonieInfo.episode) return 1;

        return 0;
    };

    const { tonies, loading } = useTonies({
        overlay: overlay ?? "",
        merged: false,
        sort: sortTonies,
        filter: "system",
    });

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
                            tonieCards={tonies}
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
