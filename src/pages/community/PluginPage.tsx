import { useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Alert, Typography, theme } from "antd";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";
import { HomeSubNav } from "../../components/home/HomeSubNav";
import { SettingsSubNav } from "../../components/settings/SettingsSubNav";
import { TonieboxesSubNav } from "../../components/tonieboxes/TonieboxesSubNav";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { TeddyCloudSection } from "../../types/pluginsMetaTypes";

const { Paragraph } = Typography;
const { useToken } = theme;

export const PluginPage = () => {
    const { pluginId } = useParams<{ pluginId: string }>();
    const { t } = useTranslation();
    const { token } = useToken();

    const { addNotification } = useTeddyCloud();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isError404, setIsError404] = useState<boolean | null>(false);
    const location = useLocation();
    const pathParts = location.pathname.split("/").filter(Boolean);

    const section = pathParts[0];
    const section2 = pathParts[1];
    const [breadcrumbItems, setBreadcrumbItems] = useState<any[]>([]);

    useEffect(() => {
        const items = [{ title: t("home.navigationTitle") }];

        if (section === "tonies") {
            items.push({ title: t("tonies.navigationTitle") });
        } else if (section === "settings") {
            items.push({ title: t("settings.navigationTitle") });
        } else if (section === "tonieboxes") {
            items.push({ title: t("tonieboxes.navigationTitle") });
        } else if (section === "community") {
            items.push({ title: t("community.navigationTitle") });
            if (section2 === "plugins") items.push({ title: t("community.plugins.navigationTitle") });
        }
        items.push({
            title: pluginId || t("community.plugins.plugin"),
        });

        setBreadcrumbItems(items);
    }, [pluginId, section]);

    useEffect(() => {
        const iframe = iframeRef.current;
        let hasNotified = false;

        const handleResize = () => {
            if (iframe && iframe.contentWindow) {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;

                    if (doc && doc.body) {
                        const isError = doc.getElementById("error-404");
                        if (isError) {
                            setIsError404(true);
                            if (!hasNotified) {
                                hasNotified = true;

                                addNotification(
                                    NotificationTypeEnum.Error,
                                    t("community.plugins.error.notification.title"),
                                    t("community.plugins.error.notification.missingPluginIndexHtml", {
                                        pluginId: pluginId,
                                    }),
                                    t("community.plugins.title")
                                );
                            }
                        } else {
                            iframe.style.height = doc.body.scrollHeight + 48 + "px";
                            setIsError404(false);
                        }
                    } else {
                        setIsError404(false);
                    }
                } catch (err) {
                    console.warn("Cross-origin content - can't access height.");
                }
            }
        };

        const observerInterval = setInterval(handleResize, 500);

        return () => clearInterval(observerInterval);
    }, [pluginId]);

    useEffect(() => {
        setIsError404(false);
        const iframe = iframeRef.current;
        if (!iframe) return;

        const handleLoad = () => {
            const iframeDocument = iframe.contentWindow?.document;
            if (!iframeDocument) return;

            const style = iframeDocument.createElement("style");
            style.textContent = `
                #teddycloud-header, #teddycloud-footer, .additional-footer-padding {
                    display: none !important;
                }
                .App {
                    background-color: ${token.colorBgElevated} !important;
                }
                .ant-layout {
                    background: unset;                    
                }
            `;
            iframeDocument.head.appendChild(style);

            iframe.style.height = `${iframeDocument.body.scrollHeight + 48}px`;
        };

        iframe.addEventListener("load", handleLoad);

        return () => {
            iframe.removeEventListener("load", handleLoad);
        };
    }, [pluginId]);

    return (
        <>
            <StyledSider>
                {section === TeddyCloudSection.Tonies && <ToniesSubNav />}
                {section === TeddyCloudSection.Home && <HomeSubNav />}
                {section === TeddyCloudSection.Settings && <SettingsSubNav />}
                {section === TeddyCloudSection.Tonieboxes && <TonieboxesSubNav />}
                {(section === TeddyCloudSection.Community || !section) && <CommunitySubNav />}
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper items={breadcrumbItems} />
                <StyledContent>
                    {isError404 ? (
                        <Alert
                            type="error"
                            showIcon
                            message={t("community.plugins.error.title")}
                            description=<>
                                <Paragraph>{t("community.plugins.error.pluginNotFound")}</Paragraph>
                            </>
                            style={{ marginBottom: 16 }}
                        ></Alert>
                    ) : (
                        ""
                    )}
                    <iframe
                        ref={iframeRef}
                        // @Todo: Remove /web in real world
                        src={`/web/plugins/${pluginId}/index.html`}
                        title={`${t("community.plugins.plugin")}: ${pluginId}`}
                        style={{
                            width: "100%",
                            minHeight: "300px",
                            border: 0,
                            overflow: "hidden",
                        }}
                        allow="fullscreen"
                    />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
