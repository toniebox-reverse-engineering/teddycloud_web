import { useTranslation } from "react-i18next";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
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
                <HiddenDesktop>
                    <SettingsSubNav />
                </HiddenDesktop>
                <BreadcrumbWrapper
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("settings.notifications.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t(`settings.notifications.title`)}</h1>
                    <NotificationsList />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
