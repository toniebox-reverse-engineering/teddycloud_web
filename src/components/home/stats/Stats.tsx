import { useMemo } from "react";
import { Card, Col, Divider, Row, Statistic, theme, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useStats } from "./hooks/useStats";
import { useHomeData } from "../home/data/useHomeData";
import { TonieCardProps } from "../../../types/tonieTypes";
import { PieChartWithLegend } from "./elements/SimplePieCharts";
import { generateColorPalette } from "../../../utils/helper";

const { Title } = Typography;
const { useToken } = theme;

export const Stats = () => {
    const { t } = useTranslation();
    const { token } = useToken();
    const statsResult = useStats(10_000); // 10s polling

    const { tonies, tonieboxes } = useHomeData();

    const getTagStats = (tags: TonieCardProps[]) => {
        const usable = tags.filter((t) => t.type === "tag");

        const total = usable.length;
        const cloudEnabled = usable.filter((t) => !t.nocloud).length;
        const cloudDisabled = usable.filter((t) => t.nocloud).length;

        const live = usable.filter((t) => t.live).length;
        const notLive = total - live;

        const claimed = usable.filter((t) => t.claimed).length;
        const unclaimed = total - claimed;

        const languageCounts = usable.reduce((acc, t) => {
            const lang = t.sourceInfo?.language || t.tonieInfo?.language || "unknown";
            acc[lang] = (acc[lang] ?? 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total,
            cloud: { enabled: cloudEnabled, disabled: cloudDisabled },
            live: { live, notLive },
            claimed: { claimed, unclaimed },
            languages: languageCounts,
        };
    };

    const tagStats = useMemo(() => getTagStats(tonies), [tonies]);

    const stats = statsResult?.stats ?? [];

    const cloudChartData = [
        {
            title: t("home.stats.cloudEnabled"),
            value: tagStats.cloud.enabled,
            color: token.colorSuccess,
        },
        {
            title: t("home.stats.cloudDisabled"),
            value: tagStats.cloud.disabled,
            color: token.colorError,
        },
    ];

    const liveChartData = [
        {
            title: t("home.stats.live"),
            value: tagStats.live.live,
            color: token.colorPrimary,
        },
        {
            title: t("home.stats.notLive"),
            value: tagStats.live.notLive,
            color: token.colorWarning,
        },
    ];

    const claimedChartData = [
        {
            title: t("home.stats.claimed"),
            value: tagStats.claimed.claimed,
            color: token.colorSuccess,
        },
        {
            title: t("home.stats.unclaimed"),
            value: tagStats.claimed.unclaimed,
            color: token.colorInfo,
        },
    ];
    const lightness = token.colorBgBase === "#000000" ? 60 : 45;
    const palette = generateColorPalette(Object.entries(tagStats.languages).length, 70, lightness);

    const languageChartData = Object.entries(tagStats.languages).map(([lang, count], i) => ({
        title: lang,
        value: count,
        color: palette[i % palette.length],
    }));

    return (
        <>
            <Title level={1}>{t("home.stats.title")}</Title>

            <Row gutter={[16, 16]}>
                <Divider>{t("home.stats.serverStats")}</Divider>

                {stats.map((stat: any) => (
                    <Col
                        key={stat.iD}
                        style={{
                            flex: "1 0 20%",
                            minWidth: "250px",
                            display: "flex",
                        }}
                    >
                        <Card style={{ flex: 1 }}>
                            <Statistic title={t("home.stats." + stat.iD)} value={stat.value} />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[16, 16]}>
                <Divider>{t("home.stats.toniesStats")}</Divider>

                <Col
                    style={{
                        flex: "1 0 20%",
                        minWidth: "250px",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Card style={{ flex: 1 }}>
                        <Statistic title={t("home.stats.totalTonieBoxes")} value={tonieboxes.length} />
                    </Card>
                    <Card style={{ flex: 1, marginTop: 16 }}>
                        <Statistic title={t("home.stats.totalTonies")} value={tagStats.total} />
                    </Card>
                </Col>

                <Col
                    style={{
                        flex: "1 0 20%",
                        minWidth: "250px",
                        display: "flex",
                    }}
                >
                    <Card style={{ flex: 1 }}>
                        <PieChartWithLegend title={t("home.stats.cloudTitle")} data={cloudChartData} />
                    </Card>
                </Col>

                <Col
                    style={{
                        flex: "1 0 20%",
                        minWidth: "250px",
                        display: "flex",
                    }}
                >
                    <Card style={{ flex: 1 }}>
                        <PieChartWithLegend title={t("home.stats.liveTitle")} data={liveChartData} />
                    </Card>
                </Col>

                <Col
                    style={{
                        flex: "1 0 20%",
                        minWidth: "250px",
                        display: "flex",
                    }}
                >
                    <Card style={{ flex: 1 }}>
                        <PieChartWithLegend title={t("home.stats.claimedTitle")} data={claimedChartData} />
                    </Card>
                </Col>

                <Col
                    style={{
                        flex: "1 0 20%",
                        minWidth: "250px",
                        display: "flex",
                    }}
                >
                    <Card style={{ flex: 1 }}>
                        <PieChartWithLegend title={t("home.stats.languageTitle")} data={languageChartData} />
                    </Card>
                </Col>
            </Row>
        </>
    );
};
