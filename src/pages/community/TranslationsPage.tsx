import { useTranslation } from "react-i18next";
import { Typography } from "antd";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";
import TranslationComparison from "../../components/utils/TranslationComparison";
import TranslationTable from "../../components/utils/TranslationTable";

const { Paragraph } = Typography;

export const TranslationsPage = () => {
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
