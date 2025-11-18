import { useTranslation } from "react-i18next";
import { Typography } from "antd";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";
import { Link } from "react-router-dom";

const { Paragraph } = Typography;

export const FAQPage = () => {
    const { t } = useTranslation();
    const faqs = t("faq", { returnObjects: true }) as { question: string; answer: string }[];

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
                        { title: t("community.faq.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t(`community.faq.title`)}</h1>
                    <Paragraph>{t(`community.faq.intro`)}</Paragraph>
                    <Paragraph>
                        {faqs.map((faq, i) => (
                            <div key={i} style={{ marginBottom: "20px" }}>
                                <h3>{faq.question}</h3>
                                <p>{faq.answer}</p>
                            </div>
                        ))}
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
