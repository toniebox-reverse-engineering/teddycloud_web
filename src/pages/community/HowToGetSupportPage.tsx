import { useTranslation } from "react-i18next";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";
import CodeSnippet from "../../components/utils/CodeSnippet";
import { Divider, theme, Typography } from "antd";

const { Paragraph } = Typography;
const { useToken } = theme;

export const HowToGetSupportPage = () => {
    const { t } = useTranslation();
    const { token } = useToken();

    return (
        <>
            <StyledSider>
                <CommunitySubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("community.navigationTitle") },
                        { title: t("community.supportRequestGuide.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("community.supportRequestGuide.title")}</h1>
                    <Paragraph>{t("community.supportRequestGuide.intro")}</Paragraph>
                    <Divider />
                    <h2>{t("community.supportRequestGuide.step1.title")}</h2>
                    <Paragraph>{t("community.supportRequestGuide.step1.content")}</Paragraph>
                    <Divider />
                    <h2>{t("community.supportRequestGuide.step2.title")}</h2>
                    <Paragraph>{t("community.supportRequestGuide.step2.intro")}</Paragraph>
                    <ul>
                        {(t("community.supportRequestGuide.step2.list", { returnObjects: true }) as string[]).map(
                            (item, index) => (
                                <li key={index}>{item}</li>
                            )
                        )}
                    </ul>
                    <Divider />

                    <h2>{t("community.supportRequestGuide.step3.title")}</h2>
                    <ul>
                        {(t("community.supportRequestGuide.step3.list", { returnObjects: true }) as string[]).map(
                            (item, index) => (
                                <li key={index}>{item}</li>
                            )
                        )}
                    </ul>
                    <Divider />

                    <h2>{t("community.supportRequestGuide.step4.title")}</h2>
                    <Paragraph>{t("community.supportRequestGuide.step4.intro")}</Paragraph>
                    <ul>
                        <li>
                            {t("community.supportRequestGuide.step4.listFirstEntry")}
                            <CodeSnippet language="shell" code={`docker logs -f teddycloud > teddycloud_logs.txt`} />
                        </li>
                        {(t("community.supportRequestGuide.step4.list", { returnObjects: true }) as string[]).map(
                            (item, index) => (
                                <li key={index}>{item}</li>
                            )
                        )}
                    </ul>
                    <Divider />

                    <h2>{t("community.supportRequestGuide.step5.title")}</h2>
                    <Paragraph>{t("community.supportRequestGuide.step5.content")}</Paragraph>
                    <Divider />

                    <h2>{t("community.supportRequestGuide.step6.title")}</h2>
                    <Paragraph>{t("community.supportRequestGuide.step6.content")}</Paragraph>
                    <Divider />

                    <h3>{t("community.supportRequestGuide.example.title")}</h3>
                    <Paragraph>{t("community.supportRequestGuide.example.description")}</Paragraph>
                    <blockquote
                        style={{
                            borderLeft: "2px solid",
                            borderLeftColor: token.colorBorder,
                            paddingLeft: 16,
                            color: token.colorTextSecondary,
                        }}
                    >
                        <span
                            dangerouslySetInnerHTML={{ __html: t("community.supportRequestGuide.example.details") }}
                        />
                    </blockquote>
                    <Divider />
                    <Paragraph>{t("community.supportRequestGuide.closing")}</Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
