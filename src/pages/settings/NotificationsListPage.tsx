import { useTranslation } from "react-i18next";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { SettingsSubNav } from "../../components/settings/SettingsSubNav";
import NotificationsList from "../../components/settings/notificationlist/NotificationsList";
import { Link } from "react-router-dom";

export const NotificationsListPage = () => {
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
                        { title: t("settings.notifications.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <NotificationsList />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
