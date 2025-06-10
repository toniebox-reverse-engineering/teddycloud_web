import { useTranslation } from "react-i18next";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { SettingsSubNav } from "../../components/settings/SettingsSubNav";
import NotificationsList from "../../components/settings/NotificationsList";

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
                        { title: t("home.navigationTitle") },
                        { title: t("settings.navigationTitle") },
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
