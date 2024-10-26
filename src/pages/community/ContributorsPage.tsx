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
                    <h1>{t("community.contributors.title")}</h1>
                    <Paragraph>
                        {t("community.contributors.contributorsIntro")}
                        <Paragraph>
                            <h3>teddycloud</h3>
                            <div>{t("community.contributors.teddyCloud")}</div>
                            <Link
                                to="https://github.com/toniebox-reverse-engineering/teddycloud/graphs/contributors"
                                target="_blank"
                            >
                                https://github.com/toniebox-reverse-engineering/teddycloud/graphs/contributors
                            </Link>
                        </Paragraph>
                        <Paragraph>
                            <h3>teddycloud_web</h3>
                            <div>{t("community.contributors.teddyCloudWeb")}</div>
                            <Link
                                to="https://github.com/toniebox-reverse-engineering/teddycloud_web/graphs/contributors"
                                target="_blank"
                            >
                                https://github.com/toniebox-reverse-engineering/teddycloud_web/graphs/contributors
                            </Link>
                        </Paragraph>
                        <Paragraph>
                            {t("community.contributors.others")}{" "}
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
                        <div style={{ marginBottom: 24 }}>{t("community.contributors.bigRoundOfApplause")}</div>
                        <TonieMeetingElement
                            maxNoOfGuests={50}
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
