import { Card, Statistic } from "antd";
import { useTranslation } from "react-i18next";
import { useStats } from "./hooks/useStats";

export const Stats = () => {
    const { t } = useTranslation();
    const stats = useStats(10_000); // 10s polling

    return (
        <>
            <h1>{t("home.stats.title")}</h1>

            {stats?.stats?.map((stat) => (
                <Card key={stat.iD} style={{ marginBottom: 16, borderRadius: 12 }}>
                    <Statistic title={t("home.stats." + stat.iD)} value={stat.value} />
                </Card>
            ))}
        </>
    );
};
