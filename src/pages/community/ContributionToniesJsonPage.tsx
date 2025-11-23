import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Typography, List, Collapse } from "antd";

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
                // Fetch the JSON data
                const response = await api.apiGetTeddyCloudApiRaw(`/api/toniesJson`);
                const jsonData = await response.json();

                // Filter the JSON data to include only entries with non-empty audio_id arrays
                const filteredData = jsonData.filter(
                    (item: any) =>
                        item.audio_id &&
                        item.audio_id.length === 0 &&
                        !["creative-tonie", "system"].includes(item.category) &&
                        !item.model.includes("20000")
                );

                // Transform the filtered JSON data into the desired array format
                const dataArray: TonieJsonEntry[] = filteredData.map((item: any) => ({
                    model: item.model,
                    series: item.series,
                    episodes: item.episodes,
                    pic: item.pic,
                    audio_id: item.audio_id || [], // Ensure audio_id is an array, set to empty array if not provided
                    category: item.category, // Include category
                    language: item.language, // Include language
                }));

                // Group tonieJsonEntries by language and category
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
                                    <List>
                                        {Array.isArray(groupedTonieJsonEntries[language]) &&
                                            groupedTonieJsonEntries[language].map((tonieJsonEntry, subSubIndex) => (
                                                <List.Item key={subSubIndex} id={tonieJsonEntry.model}>
                                                    <div>
                                                        <img
                                                            src={tonieJsonEntry.pic}
                                                            alt=""
                                                            style={{
                                                                width: "100px",
                                                                height: "auto",
                                                            }}
                                                        />
                                                        {tonieJsonEntry.model} - {tonieJsonEntry.series} -{" "}
                                                        {tonieJsonEntry.episodes}
                                                    </div>
                                                </List.Item>
                                            ))}
                                    </List>
                                ),
                            }))}
                        />
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
