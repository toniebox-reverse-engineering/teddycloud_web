import { useTranslation } from "react-i18next";
import { Space, Typography } from "antd";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";
import { TonieMeetingElement } from "../../components/TonieMeeting";
import { Link } from "react-router-dom";

const { Paragraph } = Typography;

export const ContributorsPage = () => {
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
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("community.navigationTitle") },
                        { title: t("community.contributors.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t(`community.contributors.title`)}</h1>
                    <Paragraph>
                        This project relies on the tireless contributors who offer their free time and skills. Directly
                        related to TeddyCloud are the contributors of the two projects teddycloud and teddycloud_web:
                        <Paragraph>
                            <h3>teddycloud</h3>
                            <div>The most neccessary, but mostly invisible part of your TeddyCloud Server.</div>
                            <Link
                                to="https://github.com/toniebox-reverse-engineering/teddycloud/graphs/contributors"
                                target="_blank"
                            >
                                https://github.com/toniebox-reverse-engineering/teddycloud/graphs/contributors
                            </Link>
                        </Paragraph>
                        <Paragraph>
                            <h3>teddycloud_web</h3>
                            <div>Which is actually this frontend you are using and seeing here.</div>
                            <Link
                                to="https://github.com/toniebox-reverse-engineering/teddycloud_web/graphs/contributors"
                                target="_blank"
                            >
                                https://github.com/toniebox-reverse-engineering/teddycloud_web/graphs/contributors
                            </Link>
                        </Paragraph>
                        <Paragraph>
                            You can find more contributors to the entire topic complex in the other GitHub repositories
                            at{" "}
                            <Link
                                to="https://github.com/orgs/toniebox-reverse-engineering/repositories"
                                target="_blank"
                            >
                                https://github.com/orgs/toniebox-reverse-engineering/repositories
                            </Link>
                        </Paragraph>
                    </Paragraph>
                    <Space></Space>
                    <Paragraph>
                        <div style={{ marginBottom: 24 }}>A big round of applause for them!</div>
                        <TonieMeetingElement
                            maxNoOfGuests={100}
                            toniesSize={150}
                            showQuestionMark={false}
                            height={150}
                        ></TonieMeetingElement>
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
