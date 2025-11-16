import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { StatsList, TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { HomeSubNav } from "../../components/home/HomeSubNav";
import { Link } from "react-router-dom";
import { Card, Statistic } from "antd";

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
                <BreadcrumbWrapper
                    items={[
                        { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                        { title: t("home.stats.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("home.stats.title")}</h1>

                    {stats?.stats?.map((stat) => (
                        <Card key={stat.iD} style={{ marginBottom: 16, borderRadius: 12 }}>
                            <Statistic title={t("home.stats." + stat.iD)} value={stat.value} />
                        </Card>
                    ))}
                </StyledContent>
            </StyledLayout>
        </>
    );
};
