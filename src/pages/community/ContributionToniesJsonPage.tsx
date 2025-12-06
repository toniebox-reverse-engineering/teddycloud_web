import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Typography, Collapse, Flex, Divider } from "antd";

import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/common/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";
import { Link } from "react-router-dom";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Paragraph } = Typography;

interface TonieJsonEntry {
    model: string;
    series: string;
    episodes: string;
    pic: string;
    audio_id: string[];
    category: string;
    language: string;
}

export const ContributionToniesJsonPage = () => {
    const { t } = useTranslation();

    const [groupedTonieJsonEntries, setGroupedTonieJsonEntries] = useState<{
        [key: string]: TonieJsonEntry[];
    }>({});

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await api.apiGetTeddyCloudApiRaw(`/api/toniesJson`);
                const jsonData = await response.json();

                const filteredData = jsonData.filter(
                    (item: any) =>
                        item.audio_id &&
                        item.audio_id.length === 0 &&
                        !["creative-tonie", "system"].includes(item.category) &&
                        !item.model.includes("20000")
                );

                const dataArray: TonieJsonEntry[] = filteredData.map((item: any) => ({
                    model: item.model,
                    series: item.series,
                    episodes: item.episodes,
                    pic: item.pic,
                    audio_id: item.audio_id || [],
                    category: item.category,
                    language: item.language,
                }));

                const groupedData: { [key: string]: TonieJsonEntry[] } = {};
                dataArray.forEach((entry) => {
                    if (!groupedData[entry.language]) {
                        groupedData[entry.language] = [];
                    }
                    groupedData[entry.language].push(entry);
                });
                setGroupedTonieJsonEntries(groupedData);
            } catch (error) {
                console.error("Error fetching and transforming data:", error);
            }
        }
        fetchData();
    }, []);

    return (
        <>
            <StyledSider>
                <CommunitySubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                        { title: <Link to="/community">{t("community.navigationTitle")}</Link> },
                        {
                            title: (
                                <Link to="/community/contribution">{t("community.contribution.navigationTitle")}</Link>
                            ),
                        },
                        {
                            title: t("community.contribution.toniesJson.navigationTitle"),
                        },
                    ]}
                />
                <StyledContent>
                    <h1>{t(`community.contribution.toniesJson.title`)}</h1>
                    <Paragraph>{t("community.contribution.toniesJson.text")}</Paragraph>
                    <Paragraph>
                        <Collapse
                            accordion
                            items={Object.keys(groupedTonieJsonEntries).map((language, index) => ({
                                key: index,
                                label: language,
                                children: (
                                    <Flex vertical gap={0}>
                                        {Array.isArray(groupedTonieJsonEntries[language]) &&
                                            groupedTonieJsonEntries[language].map((tonieJsonEntry, index) => (
                                                <>
                                                    <Flex
                                                        key={index}
                                                        id={tonieJsonEntry.model}
                                                        gap={8}
                                                        align="flex-end"
                                                        style={{
                                                            padding: "8px 0",
                                                            borderBottom: "1px solid rgba(0,0,0,0.1)",
                                                        }}
                                                    >
                                                        <img
                                                            src={tonieJsonEntry.pic}
                                                            alt=""
                                                            style={{
                                                                width: "100px",
                                                                height: "auto",
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                        <div>
                                                            {tonieJsonEntry.model} – {tonieJsonEntry.series} –{" "}
                                                            {tonieJsonEntry.episodes}
                                                        </div>
                                                    </Flex>
                                                    <Divider style={{ margin: 0 }} />
                                                </>
                                            ))}
                                    </Flex>
                                ),
                            }))}
                        />
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
