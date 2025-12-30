import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/common/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";
import { HomeSubNav } from "../../components/home/HomeSubNav";
import { SettingsSubNav } from "../../components/settings/SettingsSubNav";
import { TonieboxesSubNav } from "../../components/tonieboxes/TonieboxesSubNav";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { PluginContainer } from "../../components/community/plugin/PluginContainter";
import { TeddyCloudSection } from "../../types/pluginsMetaTypes";

type PluginPageProps = {
    standalone?: boolean;
};

export const PluginPage: React.FC<PluginPageProps> = ({ standalone = false }) => {
    const { pluginId } = useParams<{ pluginId: string }>();
    const { t } = useTranslation();
    const location = useLocation();
    const pathParts = location.pathname.split("/").filter(Boolean);

    const section = pathParts[0] as TeddyCloudSection | undefined;
    const section2 = pathParts[1];

    const [breadcrumbItems, setBreadcrumbItems] = useState<any[]>([]);

    useEffect(() => {
        const items: any[] = [{ title: <Link to="/">{t("home.navigationTitle")}</Link> }];

        if (section === "tonies") {
            items.push({ title: <Link to="/tonies">{t("tonies.navigationTitle")}</Link> });
        } else if (section === "settings") {
            items.push({ title: <Link to="/settings">{t("settings.navigationTitle")}</Link> });
        } else if (section === "tonieboxes") {
            items.push({ title: <Link to="/tonieboxes">{t("tonieboxes.navigationTitle")}</Link> });
        } else if (section === "community") {
            items.push({ title: <Link to="/community">{t("community.navigationTitle")}</Link> });
            if (section2 === "tcplugins") {
                items.push({
                    title: <Link to="/community/tcplugins">{t("community.plugins.navigationTitle")}</Link>,
                });
            }
        }

        items.push({
            title: pluginId ?? t("community.plugins.plugin"),
        });

        setBreadcrumbItems(items);
    }, [pluginId, section, section2, t]);

    const subNav = useMemo(() => {
        if (section === TeddyCloudSection.Tonies) return <ToniesSubNav />;
        if (section === TeddyCloudSection.Home) return <HomeSubNav />;
        if (section === TeddyCloudSection.Settings) return <SettingsSubNav />;
        if (section === TeddyCloudSection.Tonieboxes) return <TonieboxesSubNav />;
        return <CommunitySubNav />;
    }, [section]);

    if (!pluginId) {
        return null;
    }

    const pluginContent = <PluginContainer pluginId={pluginId} />;

    return standalone ? (
        <>
            <style>
                {`
                    .ant-layout-header,
                    .ant-breadcrumb,
                    .additional-footer-padding, 
                    .ant-layout-footer  {
                        display: none !important;
                    }
                `}
            </style>
            {pluginContent}
        </>
    ) : (
        <>
            <StyledSider>{subNav}</StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper items={breadcrumbItems} />
                <StyledContent>{pluginContent}</StyledContent>
            </StyledLayout>
        </>
    );
};
