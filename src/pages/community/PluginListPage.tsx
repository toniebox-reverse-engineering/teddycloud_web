import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";
import { PluginList } from "../../components/community/pluginlist/PluginList";

export const PluginListPage = () => {
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
                        { title: t("community.plugins.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <PluginList />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
