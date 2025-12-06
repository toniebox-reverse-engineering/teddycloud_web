import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { SettingsSubNav } from "../../components/settings/SettingsSubNav";
import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/common/StyledComponents";
import { Settings } from "../../components/settings/settings/Settings";

export const SettingsPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <>
            <StyledSider>
                <SettingsSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                        { title: t("settings.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <Settings />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
