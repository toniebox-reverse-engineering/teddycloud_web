import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Typography, Button, Alert, message } from "antd";
import {
    HiddenDesktop,
    StyledBreadcrumb,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { HomeSubNav } from "../../components/home/HomeSubNav";
import { TonieCardProps } from "../../components/tonies/TonieCard"; // Import the TonieCardDisplayOnly component and its props type
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";
import { ToniesList } from "../../components/tonies/ToniesList";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Paragraph } = Typography;

interface LanguageCounts {
    [key: string]: number;
}

export const HomePage = () => {
    const { t } = useTranslation();

    // Define the state with TonieCardProps[] type
    const [tonies, setTonies] = useState<TonieCardProps[]>([]);
    const [displayIncidentAlert, setDisplayIncidentAlert] = useState(false);
    const [newBoxesAllowed, setNewBoxesAllowed] = useState(false);
    const [defaultLanguage, setMaxTag] = useState<string>("");
    const [accessApiEnabled, setAccessApiEnabled] = useState<[string, boolean][]>([]);
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
                message.error("Error: " + error);
            }
        };

        fetchNewBoxesAllowed();

        const fetchTonies = async () => {
            // Perform API call to fetch Tonie data
            const tonieData = (await api.apiGetTagIndexMergedAllOverlays(true)).filter((item) => !item.hide);
            // sort random
            setTonies(
                tonieData.sort((a, b) => {
                    if (Math.random() > 0.5) {
                        return Math.floor(-100 * Math.random());
                    } else {
                        return Math.floor(100 * Math.random());
                    }
                })
            );
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
                <StyledBreadcrumb items={[{ title: t("home.navigationTitle") }]} />
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
                        <Link to="https://forum.revvox.de/" target="_blank">
                            https://forum.revvox.de/
                        </Link>
                        {t("home.forumIntroPart2")}
                    </Paragraph>
                    <Paragraph>
                        <h2>{t("home.yourTonies")}</h2>
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
                        <Button>
                            <Link to="/tonies">
                                {t("home.toAllYourTonies")} ({tonies.filter((tonie) => tonie.type === "tag").length})
                            </Link>
                        </Button>
                    </Paragraph>
                    <Paragraph>
                        <h2>{t("home.helpfulLinks")}</h2>
                        <ul>
                            <li>
                                <Link to="/community/faq">FAQ</Link>
                            </li>
                            <li>
                                <Link to="https://github.com/toniebox-reverse-engineering" target="_blank">
                                    GitHub
                                </Link>
                            </li>
                            <li>
                                <Link to="https://t.me/toniebox_reverse_engineering" target="_blank">
                                    Telegram Chat
                                </Link>
                            </li>
                            <li>
                                <Link to="https://forum.revvox.de/" target="_blank">
                                    Discourse Forum
                                </Link>
                            </li>
                            <li>
                                <Link to="https://tonies-wiki.revvox.de/docs/tools/teddycloud/" target="_blank">
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
