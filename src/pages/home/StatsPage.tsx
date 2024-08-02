import React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    HiddenDesktop,
    StyledBreadcrumb,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { HomeSubNav } from "../../components/home/HomeSubNav";
import { StatsList, TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export const StatsPage = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState<StatsList | undefined>();

    const fetchStats = async () => {
        const statsRequest = (await api.apiStatsGet()) as StatsList;
        if (statsRequest?.stats?.length && statsRequest?.stats?.length > 0) {
            setStats(statsRequest);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchStats();
        }, 1000 * 10);
        return () => clearInterval(interval);
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
                <StyledBreadcrumb
                    items={[{ title: t("home.navigationTitle") }, { title: t("home.stats.navigationTitle") }]}
                />
                <StyledContent>
                    <h1>{t(`home.stats.title`)}</h1>
                    {stats?.stats?.map((stat) => {
                        return (
                            <div key={stat.iD}>
                                <h2>{t("home.stats." + stat.iD)}</h2>
                                <p>{stat.value}</p>
                            </div>
                        );
                    })}
                </StyledContent>
            </StyledLayout>
        </>
    );
};
