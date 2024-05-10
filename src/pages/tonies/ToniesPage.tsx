import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    HiddenDesktop,
    StyledBreadcrumb,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { TonieCardProps } from "../../components/tonies/TonieCard"; // Import the TonieCard component and its props type
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";
import { ToniesList } from "../../components/tonies/ToniesList";

import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";

const api = new TeddyCloudApi(defaultAPIConfig());

export const ToniesPage = () => {
    const { t } = useTranslation();

    // Define the state with TonieCardProps[] type
    const [tonies, setTonies] = useState<TonieCardProps[]>([]);

    useEffect(() => {
        const fetchTonies = async () => {
            // Perform API call to fetch Tonie data
            const tonieData = await api.apiGetTagIndex();
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
        };

        fetchTonies();
    }, []);

    return (
        <>
            <StyledSider>
                <ToniesSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <ToniesSubNav />
                </HiddenDesktop>
                <StyledBreadcrumb
                    items={[{ title: t("home.navigationTitle") }, { title: t("tonies.navigationTitle") }]}
                />
                <StyledContent>
                    <h1>{t("tonies.title")}</h1>
                    <ToniesList showFilter={true} tonieCards={tonies.filter((tonie) => tonie.type === "tag")} />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
