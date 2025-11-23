import { useTranslation } from "react-i18next";
import { Typography } from "antd";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/common/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";
import TranslationDiff from "../../components/community/translation/TranslationDiff";
import TranslationMatrix from "../../components/community/translation/TranslationMatrix";
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
                    <TranslationDiff />
                    <TranslationMatrix />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
