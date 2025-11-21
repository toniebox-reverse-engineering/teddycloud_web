import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { TonieCardProps } from "../../types/tonieTypes";

import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { ToniesList } from "../../components/tonies/tonieslist/ToniesList";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";
import { TonieboxOverlaySelect } from "../../components/tonies/common/TonieboxOverlaySelect";
import { useTonieboxContentOverlay } from "../../hooks/useTonieboxContentOverlay";
const api = new TeddyCloudApi(defaultAPIConfig());

interface LanguageCounts {
    [key: string]: number;
}

export const ToniesPage = () => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();
    const { overlay, tonieBoxContentDirs, changeOverlay } = useTonieboxContentOverlay();

    const [tonies, setTonies] = useState<TonieCardProps[]>([]);
    const [defaultLanguage, setMaxTag] = useState<string>("");
    const [loading, setLoading] = useState(true);

    const handleUpdate = (updatedTonieCard: TonieCardProps) => {
        setTonies((prevTonies) =>
            prevTonies.map((tonie) => (tonie.ruid === updatedTonieCard.ruid ? updatedTonieCard : tonie))
        );
    };

    useEffect(() => {
        const fetchTonies = async () => {
            setLoading(true);
            try {
                const tonieData = (await api.apiGetTagIndex(overlay ? overlay : "", true)).filter((item) => !item.hide);
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
                    t("tonies.errorFetchingTonies"),
                    t("tonies.errorFetchingTonies") + ": " + error,
                    t("tonies.navigationTitle")
                );
                console.log("error: fetching tonies failed: " + error);
            } finally {
                setLoading(false);
            }
        };

        fetchTonies();
    }, [overlay]);

    // Update tagCounts state and find the language tag with the highest count when tags prop changes
    useEffect(() => {
        const counts: LanguageCounts = {};

        // Iterate over the tags array and count occurrences of each language tag
        tonies.forEach((tonies) => {
            const language = tonies.tonieInfo.language;
            // If the language tag already exists in the counts object, increment its count by 1
            if (counts[language]) {
                counts[language]++;
            } else {
                // If the language tag doesn't exist in the counts object, initialize its count to 1
                counts[language] = 1;
            }
        });

        // Find the language tag with the highest count
        let maxCount = 0;
        let maxLanguage = "";
        for (const language in counts) {
            if (counts.hasOwnProperty(language) && counts[language] > maxCount) {
                maxCount = counts[language];
                maxLanguage = language;
            }
        }
        // Update maxTag state with the language tag with the highest count
        setMaxTag(maxLanguage);
    }, [tonies]);

    return (
        <>
            <StyledSider>
                <ToniesSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                        { title: t("tonies.navigationTitle") },
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
                        }}
                    >
                        <h1 style={{ width: "100px" }}>{t("tonies.title")}</h1>
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
                            showFilter={true}
                            showPagination={true}
                            tonieCards={tonies.filter((tonie) => tonie.type === "tag")}
                            overlay={overlay}
                            readOnly={false}
                            defaultLanguage={defaultLanguage}
                            onToniesCardUpdate={handleUpdate}
                        />
                    )}
                </StyledContent>
            </StyledLayout>
        </>
    );
};
