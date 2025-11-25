import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { Typography, Skeleton } from "antd";

import readmeRaw from "../../../README.md?raw";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/common/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";

const { Paragraph } = Typography;

export const AttributionPage = () => {
    const { t } = useTranslation();
    const [markdown] = useState<string>(readmeRaw);
    const loading = false;

    const attributionMarkdown = useMemo(() => {
        if (!markdown) return "";

        const lines = markdown.split("\n");
        const start = lines.findIndex((l) => l.trim().toLowerCase().startsWith("# attribution"));

        if (start === -1) return "";

        let end = lines.length;
        for (let i = start + 1; i < lines.length; i++) {
            if (/^#\s+/i.test(lines[i])) {
                end = i;
                break;
            }
        }

        return lines.slice(start, end).join("\n");
    }, [markdown]);

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
                        { title: t("community.attribution.navigationTitle") },
                    ]}
                />

                <StyledContent>
                    <h1>{t("community.attribution.title")}</h1>

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
                                {attributionMarkdown}
                            </ReactMarkdown>
                        </Paragraph>
                    )}
                </StyledContent>
            </StyledLayout>
        </>
    );
};
