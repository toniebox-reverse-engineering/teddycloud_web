import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { Typography, Skeleton } from "antd";

import changelogRaw from "../../../CHANGELOG.md?raw";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/common/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";

const { Paragraph } = Typography;

export const ChangelogPage = () => {
    const { t } = useTranslation();

    const [markdown] = useState<string>(changelogRaw);
    const loading = false;

    return (
        <>
            <StyledSider>
                <CommunitySubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: <RouterLink to="/">{t("home.navigationTitle")}</RouterLink> },
                        { title: <RouterLink to="/community">{t("community.navigationTitle")}</RouterLink> },
                        { title: t("community.changelog.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("community.changelog.title")}</h1>
                    {loading ? (
                        <Skeleton active paragraph={{ rows: 8 }} />
                    ) : (
                        <Paragraph>
                            <ReactMarkdown
                                components={{
                                    a: ({ href, children }) => (
                                        <a href={href} target="_blank" rel="noopener noreferrer">
                                            {children}
                                        </a>
                                    ),
                                }}
                            >
                                {markdown}
                            </ReactMarkdown>
                        </Paragraph>
                    )}
                </StyledContent>
            </StyledLayout>
        </>
    );
};
