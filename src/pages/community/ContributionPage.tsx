import { useTranslation } from "react-i18next";
import { Typography } from "antd";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/common/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";
import { Link } from "react-router-dom";

const { Paragraph } = Typography;

export const ContributionPage = () => {
    const { t } = useTranslation();

    const communityValues = [
        t("community.contribution.communityValues1"),
        t("community.contribution.communityValues2"),
        t("community.contribution.communityValues3"),
        t("community.contribution.communityValues4"),
        t("community.contribution.communityValues5"),
        t("community.contribution.communityValues6"),
    ];

    const makeFirstContribution = [
        t("community.contribution.makeFirstContribution1"),
        t("community.contribution.makeFirstContribution2"),
        t("community.contribution.makeFirstContribution3"),
        t("community.contribution.makeFirstContribution4"),
        t("community.contribution.makeFirstContribution5"),
        t("community.contribution.makeFirstContribution6"),
        t("community.contribution.makeFirstContribution7"),
    ];

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
                        { title: t("community.contribution.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("community.contribution.title")}</h1>
                    <Paragraph>
                        <Paragraph>{t("community.contribution.contributionIntro")}</Paragraph>
                        <Paragraph>
                            <h2>{t("community.contribution.communityValues")}</h2>
                            <Paragraph>{t("community.contribution.communityValuesIntro")}</Paragraph>
                            <Paragraph>{t("community.contribution.communityValuesExamples")}</Paragraph>
                            <ul>
                                {communityValues.map((value, index) => (
                                    <li key={index}>{value}</li>
                                ))}
                            </ul>
                        </Paragraph>
                        <Paragraph>
                            <h2>{t("community.contribution.makeFirstContribution")}</h2>
                            <Paragraph>{t("community.contribution.makeFirstContributionIntro")}</Paragraph>
                            <ul>
                                {makeFirstContribution.map((value, index) => (
                                    <li key={index}>{value}</li>
                                ))}
                            </ul>
                        </Paragraph>
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
