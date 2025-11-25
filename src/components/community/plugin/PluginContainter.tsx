import { useEffect, useRef, useState } from "react";
import { Alert, Typography, theme } from "antd";
import { useTranslation } from "react-i18next";
import { useTeddyCloud } from "../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../types/teddyCloudNotificationTypes";

const { Paragraph } = Typography;
const { useToken } = theme;

interface PluginContainerProps {
    pluginId: string;
}

export const PluginContainer: React.FC<PluginContainerProps> = ({ pluginId }) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { addNotification } = useTeddyCloud();

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isError404, setIsError404] = useState(false);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        let hasNotified = false;
        let prevHeight = 0;

        const handleResize = () => {
            if (!iframe || !iframe.contentWindow) return;

            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (!doc || !doc.body) return;

                const isError = doc.getElementById("error-404");
                if (isError) {
                    setIsError404(true);
                    if (!hasNotified) {
                        hasNotified = true;
                        addNotification(
                            NotificationTypeEnum.Error,
                            t("community.plugins.error.notification.title"),
                            t("community.plugins.error.notification.missingPluginIndexHtml", { pluginId }),
                            t("community.plugins.title")
                        );
                    }
                    return;
                } else {
                    setIsError404(false);
                }

                const newHeight = doc.body.scrollHeight + 48;

                if (prevHeight && newHeight - prevHeight === 48) {
                    clearInterval(observerInterval);
                } else {
                    iframe.style.height = newHeight + "px";
                }
                prevHeight = newHeight;
            } catch {
                console.warn("Cross-origin content - can't access height.");
            }
        };

        const observerInterval = window.setInterval(handleResize, 500);

        return () => {
            window.clearInterval(observerInterval);
        };
    }, [pluginId, addNotification, t]);

    useEffect(() => {
        setIsError404(false);
        const iframe = iframeRef.current;
        if (!iframe) return;

        const handleLoad = () => {
            const iframeDocument = iframe.contentWindow?.document;
            if (!iframeDocument || !iframeDocument.body || !iframeDocument.head) return;

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
    }, [pluginId, token.colorBgElevated]);

    return (
        <>
            {isError404 && (
                <Alert
                    type="error"
                    showIcon
                    title={t("community.plugins.error.title")}
                    description={
                        <>
                            <Paragraph>{t("community.plugins.error.pluginNotFound")}</Paragraph>
                        </>
                    }
                    style={{ marginBottom: 16 }}
                />
            )}
            <iframe
                ref={iframeRef}
                src={`/plugins/${pluginId}/index.html`}
                title={`${t("community.plugins.plugin")}: ${pluginId}`}
                style={{
                    width: "100%",
                    minHeight: "300px",
                    border: 0,
                    overflow: "hidden",
                }}
                allow="fullscreen"
            />
        </>
    );
};
