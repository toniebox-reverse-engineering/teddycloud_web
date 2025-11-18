import { useTranslation } from "react-i18next";
import { Typography } from "antd";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";
import TranslationComparison from "../../components/utils/TranslationComparison";
import TranslationTable from "../../components/utils/TranslationTable";
import { Link } from "react-router-dom";

const { Paragraph } = Typography;

export const TranslationsPage = () => {
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
                        { title: t("community.translations.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("community.translations.title")}</h1>
                    <Paragraph>{t("community.translations.hint")}</Paragraph>
                    <TranslationComparison />
                    <TranslationTable />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
