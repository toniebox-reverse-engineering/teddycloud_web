import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { HomeSubNav } from "../../components/home/HomeSubNav";
import { Stats } from "../../components/home/stats/Stats";

export const StatsPage = () => {
    const { t } = useTranslation();

    return (
        <>
            <StyledSider>
                <HomeSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                        { title: t("home.stats.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <Stats />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
