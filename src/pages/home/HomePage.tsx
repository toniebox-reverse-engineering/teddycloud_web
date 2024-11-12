import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Typography, Button, Alert } from "antd";

import { forumUrl, gitHubUrl, telegramGroupUrl, wikiUrl } from "../../constants";
import { TonieCardProps } from "../../types/tonieTypes";

import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { HomeSubNav } from "../../components/home/HomeSubNav";
import { ToniesList } from "../../components/tonies/ToniesList";
import LoadingSpinner from "../../components/utils/LoadingSpinner";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Paragraph } = Typography;

interface LanguageCounts {
    [key: string]: number;
}

export const HomePage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { addNotification } = useTeddyCloud();

    // Define the state with TonieCardProps[] type
    const [tonies, setTonies] = useState<TonieCardProps[]>([]);
    const [displayIncidentAlert, setDisplayIncidentAlert] = useState(false);
    const [newBoxesAllowed, setNewBoxesAllowed] = useState(false);
    const [defaultLanguage, setMaxTag] = useState<string>("");
    const [accessApiEnabled, setAccessApiEnabled] = useState<[string, boolean][]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDisplayIncidentAlert = async () => {
            const displayIncidentAlert = await api.apiGetSecurityMITAlert();
            setDisplayIncidentAlert(displayIncidentAlert);
        };

        fetchDisplayIncidentAlert();

        const fetchNewBoxesAllowed = async () => {
            try {
                const newBoxesAllowed = await api.apiGetNewBoxesAllowed();
                setNewBoxesAllowed(newBoxesAllowed);
                if (newBoxesAllowed) {
                    const fetchTonieboxes = async () => {
                        const tonieboxData = await api.apiGetTonieboxesIndex();
                        const accessApiEnabled = await Promise.all(
                            tonieboxData.map(async (toniebox) => {
                                const accessApiEnabled = await api.apiGetTonieboxApiAccess(toniebox.ID);
                                return [toniebox.boxName, accessApiEnabled] as [string, boolean];
                            })
                        );
                        setAccessApiEnabled(accessApiEnabled);
                    };
                    fetchTonieboxes();
                }
            } catch (error) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("settings.messages.errorFetchingSetting"),
                    t("settings.messages.errorFetchingSettingDetails", {
                        setting: "toniebox.api_access",
                    }) + error,
                    t("home.navigationTitle")
                );
            }
        };

        fetchNewBoxesAllowed();

        const fetchTonies = async () => {
            setLoading(true);
            const tonieData = (await api.apiGetTagIndexMergedAllOverlays(true)).filter((item) => !item.hide);
            setTonies(
                tonieData.sort((a, b) => {
                    if (Math.random() > 0.5) {
                        return Math.floor(-100 * Math.random());
                    } else {
                        return Math.floor(100 * Math.random());
                    }
                })
            );
            setLoading(false);
        };

        fetchTonies();
    }, []);

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

    const boxesApiAccessDisabled: [string, boolean][] = accessApiEnabled.filter((item) => !item[1]);

    const newBoxesAllowedWarning = newBoxesAllowed ? (
        <>
            <Alert
                message={t("tonieboxes.newBoxesAllowed")}
                description={t("tonieboxes.newBoxesAllowedText")}
                type="warning"
                showIcon
                style={{ margin: "16px 0" }}
            />
            {boxesApiAccessDisabled.length > 0 && (
                <Alert
                    message={t("tonieboxes.boxWithoutAPIAccess")}
                    description={
                        <>
                            {t("tonieboxes.boxWithoutAPIAccessText")}
                            <ul>
                                {boxesApiAccessDisabled.map((item) => (
                                    <li key={item[0]}>{item[0]}</li>
                                ))}
                            </ul>
                            {t("tonieboxes.boxWithoutAPIAccessGoToTonieboxes")}
                            <Link to="/tonieboxes">{t("tonieboxes.navigationTitle")}</Link>
                        </>
                    }
                    type="info"
                    showIcon
                    style={{ margin: "16px 0" }}
                />
            )}
        </>
    ) : null;

    return (
        <>
            <StyledSider>
                <HomeSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <HomeSubNav />
                </HiddenDesktop>
                <BreadcrumbWrapper items={[{ title: t("home.navigationTitle") }]} />
                <StyledContent>
                    <Paragraph>
                        <h1>{t(`home.title`)}</h1>
                        {displayIncidentAlert ? (
                            <Alert
                                message={t("security.alert")}
                                description={t("security.incident_detected")}
                                type="error"
                                showIcon
                                style={{ margin: "16px 0" }}
                            />
                        ) : (
                            ""
                        )}
                        {t(`home.intro`)}
                        {newBoxesAllowedWarning}
                    </Paragraph>
                    <Paragraph>
                        {t("home.forumIntroPart1")}
                        <Link to={forumUrl} target="_blank">
                            {forumUrl}
                        </Link>
                        {t("home.forumIntroPart2")}
                    </Paragraph>
                    <Paragraph>
                        <h2>{t("home.yourTonies")}</h2>
                        {loading ? (
                            <LoadingSpinner />
                        ) : (
                            <ToniesList
                                tonieCards={tonies
                                    .filter((tonie) => tonie.type === "tag" && tonie.tonieInfo.series)
                                    .slice(0, 6)}
                                overlay=""
                                showFilter={false}
                                showPagination={false}
                                readOnly={true}
                                defaultLanguage={defaultLanguage}
                            />
                        )}
                        <Paragraph>
                            <Button onClick={() => navigate("/tonies")}>
                                {t("home.toAllYourTonies")} ({tonies.filter((tonie) => tonie.type === "tag").length})
                            </Button>
                        </Paragraph>
                    </Paragraph>
                    <Paragraph>
                        <h2>{t("home.helpfulLinks")}</h2>
                        <ul>
                            <li>
                                <Link to="/community/faq">FAQ</Link>
                            </li>
                            <li>
                                <Link to={gitHubUrl} target="_blank">
                                    GitHub
                                </Link>
                            </li>
                            <li>
                                <Link to={telegramGroupUrl} target="_blank">
                                    Telegram Chat
                                </Link>
                            </li>
                            <li>
                                <Link to={forumUrl} target="_blank">
                                    Discourse Forum
                                </Link>
                            </li>
                            <li>
                                <Link to={wikiUrl} target="_blank">
                                    TeddyCloud Wiki
                                </Link>
                            </li>
                        </ul>
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
