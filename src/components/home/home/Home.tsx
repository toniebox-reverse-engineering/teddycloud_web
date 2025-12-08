import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Button, Tabs, TabsProps, Typography } from "antd";
import {
    forumUrl,
    gitHubTCCommitTreeBaseUrl,
    gitHubTCReleasesUrl,
    gitHubUrl,
    telegramGroupUrl,
    wikiUrl,
} from "../../../constants/urls";
import LoadingSpinner from "../../common/elements/LoadingSpinner";
import { TonieboxesList } from "../../tonieboxes/tonieboxeslist/TonieboxesList";
import { ToniesList } from "../../tonies/tonieslist/ToniesList";
import { useHomeData } from "./data/useHomeData";
import { useTeddyCloudVersion } from "../../../hooks/useTeddyCloudVersion";

const { Paragraph } = Typography;

export const Home = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { newVersionAvailable, isDevelopVersion, latestDevelopSHA, latestReleaseVersion } = useTeddyCloudVersion();

    const {
        tonies,
        tonieboxes,
        displayIncidentAlert,
        newBoxesAllowed,
        accessApiEnabled,
        defaultLanguage,
        loading,
        activeTab,
        setActiveTab,
    } = useHomeData();

    const boxesApiAccessDisabled: [string, boolean][] = accessApiEnabled.filter((item) => !item[1]);

    const newBoxesAllowedWarning = newBoxesAllowed ? (
        <>
            <Alert
                title={t("tonieboxes.newBoxesAllowed")}
                description={t("tonieboxes.newBoxesAllowedText")}
                type="warning"
                showIcon
                style={{ margin: "16px 0" }}
            />
            {boxesApiAccessDisabled.length > 0 && (
                <Alert
                    title={t("tonieboxes.boxWithoutAPIAccess")}
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

    const newVersionHint = newVersionAvailable ? (
        <Alert
            title={t("teddycloud.newVersionAvailable")}
            description={
                <>
                    <Paragraph>
                        {isDevelopVersion
                            ? t("teddycloud.newVersionDetailsAvailableDevelop")
                            : t("teddycloud.newVersionDetailsAvailable")}{" "}
                    </Paragraph>

                    <Link
                        to={
                            isDevelopVersion
                                ? gitHubTCCommitTreeBaseUrl + latestDevelopSHA
                                : gitHubTCReleasesUrl + "tag/" + latestReleaseVersion
                        }
                        target="_blank"
                        style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}
                    >
                        {t("teddycloud.openNewVersionInGithub")}
                    </Link>
                </>
            }
            type="info"
            showIcon
            style={{ margin: "16px 0" }}
        />
    ) : null;

    const toniesTab = (
        <>
            {loading ? (
                <LoadingSpinner />
            ) : (
                <ToniesList
                    tonieCards={tonies.filter((tonie) => tonie.type === "tag" && tonie.tonieInfo.series).slice(0, 6)}
                    overlay=""
                    showFilter={false}
                    showPagination={false}
                    readOnly={true}
                    defaultLanguage={defaultLanguage}
                />
            )}
            <Paragraph style={{ marginTop: 16 }}>
                <Button onClick={() => navigate("/tonies")}>
                    {t("home.toAllYourTonies")} ({tonies.filter((tonie) => tonie.type === "tag").length})
                </Button>
            </Paragraph>
        </>
    );

    const tonieboxesTab = (
        <>
            {loading ? <LoadingSpinner /> : <TonieboxesList tonieboxCards={tonieboxes.slice(0, 4)} readOnly={true} />}
            <Paragraph style={{ marginTop: 16 }}>
                <Button onClick={() => navigate("/tonieboxes")}>
                    {t("home.toAllYourTonieboxes")} ({tonieboxes.length})
                </Button>
            </Paragraph>
        </>
    );

    const toniesAndTonieboxes: TabsProps["items"] = [
        {
            key: "tonies",
            label: <h2 style={{ marginBottom: 0 }}>{t("home.yourTonies")}</h2>,
            children: toniesTab,
        },
        {
            key: "tonieboxes",
            label: <h2 style={{ marginBottom: 0 }}>{t("home.yourTonieboxes")}</h2>,
            children: tonieboxesTab,
        },
    ];

    return (
        <>
            <Paragraph>
                <h1>{t("home.title")}</h1>
                {displayIncidentAlert ? (
                    <Alert
                        title={t("security.alert")}
                        description={t("security.incident_detected")}
                        type="error"
                        showIcon
                        style={{ margin: "16px 0" }}
                    />
                ) : null}
                {t("home.intro")}
                {newBoxesAllowedWarning}
            </Paragraph>

            {newVersionHint}

            <Paragraph>
                {t("home.forumIntroPart1")}
                <Link to={forumUrl} target="_blank">
                    {forumUrl}
                </Link>
                {t("home.forumIntroPart2")}
            </Paragraph>

            <Paragraph>
                <Tabs
                    onChange={(newKey) => setActiveTab(newKey)}
                    activeKey={activeTab}
                    items={toniesAndTonieboxes}
                    indicator={{ size: (origin) => origin - 20, align: "center" }}
                />
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
        </>
    );
};
