import React from "react";
import { useTranslation } from "react-i18next";
import { Typography } from "antd";

import {
    HiddenDesktop,
    StyledBreadcrumb,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";

const { Paragraph } = Typography;

export const ContributionPage = () => {
    const { t } = useTranslation();

    const communityValues = [
        "Use welcome and inclusive language.",
        "Be respectful of differing viewpoints and experiences.",
        "Gracefully accept constructive criticism.",
        "Foster what's best for the community.",
        "Show empathy for other community members.",
        "Decisions are made based on technical merit and consensus. The Teddycloud community aspires to treat everyone equally, and to value all contributions.",
    ];

    const makeFirstContribution = [
        "Write code.",
        "Improve documentation.",
        "Answer questions on our telegram group.",
        "Investigate bugs and issues on GitHub.",
        "Review and comment on pull requests from other developers.",
        "Report an issue.",
        "Give a “thumbs up” 👍 on issues that are relevant to you.",
    ];

    return (
        <>
            <StyledSider>
                <CommunitySubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <CommunitySubNav />
                </HiddenDesktop>
                <StyledBreadcrumb
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("community.navigationTitle") },
                        { title: t("community.contribution.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t(`community.contribution.title`)}</h1>
                    <Paragraph>
                        <Paragraph>
                            The Teddycloud can only grow through the contributions of this community. Thanks so much for
                            your enthusiasm and your work - we appreciate everything you do!
                        </Paragraph>
                        <Paragraph>
                            <h2>Community values</h2>
                            <Paragraph>
                                In the interest of fostering an open and welcoming environment, contributors and
                                maintainers pledge to make participation in our project and our community a
                                harassment-free experience for everyone - regardless of age, body size, disability,
                                ethnicity, gender identity and expression, level of experience, nationality, personal
                                appearance, race, religion, or sexual identity and orientation.
                            </Paragraph>
                            <Paragraph>
                                Examples of behaviors that contribute to creating a positive environment include:
                            </Paragraph>
                            <ul>
                                {communityValues.map((value, index) => (
                                    <li key={index}>{value}</li>
                                ))}
                            </ul>
                        </Paragraph>
                        <Paragraph>
                            <h2>Make your first contribution</h2>
                            There are many ways to contribute to Teddycloud! You can contribute code and make
                            improvements to the Teddycloud documentation. Our most common contributions include code,
                            documentation, and community support.
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
