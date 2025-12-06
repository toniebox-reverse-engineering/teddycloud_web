import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Space, Typography } from "antd";

import {
    gitHubRepositoriesUrl,
    gitHubSponsoringUrl,
    gitHubTCContributorsUrl,
    gitHubTCwebContributorsUrl,
} from "../../constants/urls";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/common/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";
import { TonieMeetingElement } from "../../components/common/elements/TonieMeeting";

const { Paragraph } = Typography;

export const ContributorsPage = () => {
    const { t } = useTranslation();

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
                        { title: t("community.contributors.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("community.contributors.title")}</h1>
                    <Paragraph>
                        {t("community.contributors.contributorsIntro")}
                        <Paragraph>
                            <h3>teddycloud</h3>
                            <div>{t("community.contributors.teddyCloud")}</div>
                            <Link to={gitHubTCContributorsUrl} target="_blank">
                                {gitHubTCContributorsUrl}
                            </Link>
                        </Paragraph>
                        <Paragraph>
                            <h3>teddycloud_web</h3>
                            <div>{t("community.contributors.teddyCloudWeb")}</div>
                            <Link to={gitHubTCwebContributorsUrl} target="_blank">
                                {gitHubTCwebContributorsUrl}
                            </Link>
                        </Paragraph>
                        <Paragraph>
                            {t("community.contributors.others")}{" "}
                            <Link to={gitHubRepositoriesUrl} target="_blank">
                                {gitHubRepositoriesUrl}
                            </Link>
                        </Paragraph>
                    </Paragraph>
                    <Paragraph>
                        <div style={{ marginBottom: 24 }}>{t("community.contributors.bigRoundOfApplause")}</div>
                        <TonieMeetingElement
                            maxNoOfGuests={50}
                            toniesSize={150}
                            showQuestionMark={false}
                            height={150}
                        ></TonieMeetingElement>
                    </Paragraph>
                    <Space></Space>
                    <Paragraph>
                        <h3>{t("community.contributors.supportTeam")}</h3>
                        <Paragraph>{t("community.contributors.supportTeamText")}</Paragraph>
                        <Link to={gitHubSponsoringUrl} target="_blank">
                            {t("community.contributors.supportTeamLink")}
                        </Link>
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
