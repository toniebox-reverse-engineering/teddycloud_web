import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Typography } from "antd";

import { forumUrl, gitHubUrl, telegramGroupUrl, wikiUrl } from "../../constants";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";

const { Paragraph } = Typography;

export const CommunityPage = () => {
    const { t } = useTranslation();

    return (
        <>
            <StyledSider>
                <CommunitySubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <CommunitySubNav />
                </HiddenDesktop>
                <BreadcrumbWrapper
                    items={[{ title: t("home.navigationTitle") }, { title: t("community.navigationTitle") }]}
                />
                <StyledContent>
                    <h1>{t("community.title")}</h1>
                    <Paragraph>
                        <h2>{t("community.community.getInvolved")}</h2>
                        {t("community.community.getInvolvedText1")}
                    </Paragraph>
                    <Paragraph>
                        <Paragraph>{t("community.community.getInvolvedText2")}</Paragraph>
                        <ul>
                            <li>
                                <Link to={gitHubUrl} target="_blank">
                                    GitHub
                                </Link>
                                <ul>
                                    <li>{t("community.community.github")}</li>
                                </ul>
                            </li>
                            <li>
                                <Link to={telegramGroupUrl} target="_blank">
                                    Telegram Chat
                                </Link>
                                <ul>
                                    <li>{t("community.community.telegram")}</li>
                                </ul>
                            </li>
                            <li>
                                <Link to={forumUrl} target="_blank">
                                    Discourse Forum
                                </Link>
                                <ul>
                                    <li>{t("community.community.discourse")}</li>
                                </ul>
                            </li>
                            <li>
                                <Link to={wikiUrl} target="_blank">
                                    TeddyCloud Wiki
                                </Link>
                                <ul>
                                    <li>{t("community.community.teddyCloudWiki")}</li>
                                </ul>
                            </li>
                        </ul>
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
