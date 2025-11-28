import React, { useEffect, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Switch, Typography, Divider, Button, theme } from "antd";
import { useTranslation } from "react-i18next";
import { useRtnl } from "./hooks/useRtnl";

const { Paragraph, Text } = Typography;
const { useToken } = theme;

export const RtnlConsole: React.FC = () => {
    const { t } = useTranslation();
    const { token } = useToken();

    const { logEntries, rtnlActive, setRtnlActive, clearRtnl } = useRtnl();

    const logListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logListRef.current) {
            logListRef.current.scrollTop = logListRef.current.scrollHeight;
        }
    }, [logEntries]);

    const handleOnChange = (checked: boolean) => {
        setRtnlActive(checked);
    };

    const backgroundIsDark = token.colorBgBase === "#000" || token.colorBgBase === "#000000";

    return (
        <>
            <h1>{t("settings.rtnl.title")}</h1>
            <Paragraph style={{ margin: "8px 0" }}>
                <Paragraph>
                    <Switch checked={rtnlActive} onChange={handleOnChange} style={{ marginRight: 8 }} />
                    <Text>{t("settings.rtnl.enableRtnl")}</Text>
                </Paragraph>

                <Divider>{t("settings.rtnl.title")}</Divider>

                <div
                    className="rtnl-log-container"
                    ref={logListRef}
                    style={{
                        minHeight: "max(40vh, 333px)",
                        maxHeight: "max(40vh, 333px)",
                        overflow: "auto",
                        padding: 1,
                        backgroundColor: token.colorBgContainer,
                        scrollbarColor: `${token.colorTextDescription} ${token.colorBgContainer}`,
                    }}
                >
                    <SyntaxHighlighter
                        language="log"
                        style={backgroundIsDark ? oneDark : oneLight}
                        customStyle={{
                            borderRadius: 0,
                            margin: 0,
                            border: "none",
                            width: "max-content",
                            minWidth: "100%",
                            minHeight: "max(38vh, 320px)",
                        }}
                    >
                        {logEntries.join("\n")}
                    </SyntaxHighlighter>
                </div>

                <Button onClick={clearRtnl} style={{ marginTop: 8 }}>
                    {t("settings.rtnl.clear")}
                </Button>
            </Paragraph>
        </>
    );
};
