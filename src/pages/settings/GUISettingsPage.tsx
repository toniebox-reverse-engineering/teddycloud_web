import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { SettingsSubNav } from "../../components/settings/SettingsSubNav";
import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { GuiLocalStorageSettings } from "../../components/settings/guisettings/GuiLocalStorageSettings";

export const GUISettingsPage = () => {
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
                        { title: t("settings.guiSettings.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <GuiLocalStorageSettings />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
