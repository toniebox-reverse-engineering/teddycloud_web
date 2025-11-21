import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { TeddyStudio } from "../../components/tonies/teddystudio/TeddyStudio";

export const TeddyStudioPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <>
            <StyledSider>
                <ToniesSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                        { title: <Link to="/tonies">{t("tonies.navigationTitle")}</Link> },
                        { title: t("tonies.teddystudio.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <TeddyStudio />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
