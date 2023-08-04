import { Breadcrumb } from "antd";
import { useTranslation } from "react-i18next";
import {
  StyledBreadcrumb,
  StyledContent,
  StyledLayout,
  StyledSider,
} from "../../components/StyledComponents";
import { HomeSubNav } from "../../components/home/HomeSubNav";
import { StatsList, TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { useEffect, useState } from "react";
import React from "react";

const api = new TeddyCloudApi(defaultAPIConfig());

export const StatsPage = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<StatsList | undefined>();

  useEffect(() => {
    const fetchStats = async () => {
      const statsRequest = (await api.apiStatsGet()) as StatsList;
      if (statsRequest?.stats?.length && statsRequest?.stats?.length > 0) {
        setStats(statsRequest);
      }
    };

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
        <StyledBreadcrumb>
          <Breadcrumb.Item>{t("home.navigationTitle")}</Breadcrumb.Item>
          <Breadcrumb.Item>{t("home.stats.navigationTitle")}</Breadcrumb.Item>
        </StyledBreadcrumb>
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
