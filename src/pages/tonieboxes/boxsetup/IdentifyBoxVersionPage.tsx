// IdentifyBoxVersionPage.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../../components/StyledComponents";
import { TonieboxesSubNav } from "../../../components/tonieboxes/TonieboxesSubNav";
import { IdentifyBoxVersionContent } from "../../../components/tonieboxes/boxsetup/identifyboxversion/IdentifyBoxVersionContent";

export const IdentifyBoxVersionPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <>
            <StyledSider>
                <TonieboxesSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                        { title: <Link to="/tonieboxes">{t("tonieboxes.navigationTitle")}</Link> },
                        {
                            title: <Link to="/tonieboxes/boxsetup">{t("tonieboxes.boxSetup.navigationTitle")}</Link>,
                        },
                        { title: t("tonieboxes.boxSetup.identifyVersion.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <IdentifyBoxVersionContent />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
