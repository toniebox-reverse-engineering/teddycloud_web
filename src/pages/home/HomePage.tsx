import { useTranslation } from "react-i18next";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/common/StyledComponents";
import { HomeSubNav } from "../../components/home/HomeSubNav";
import { Home } from "../../components/home/home/Home";

export const HomePage = () => {
    const { t } = useTranslation();

    return (
        <>
            <StyledSider>
                <HomeSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper items={[{ title: t("home.navigationTitle") }]} />
                <StyledContent>
                    <Home />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
