import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { SettingsSubNav } from "../../components/settings/SettingsSubNav";
import { RtnlConsole } from "../../components/settings/rtnl/RtnlConsole";

export const RtnlPage: React.FC = () => {
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
                        { title: <Link to="/settings">{t("settings.navigationTitle")}</Link> },
                        { title: t("settings.rtnl.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <RtnlConsole />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
