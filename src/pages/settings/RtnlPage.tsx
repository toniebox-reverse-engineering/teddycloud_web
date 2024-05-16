import { useTranslation } from "react-i18next";
import { Alert, Switch, Typography, List, Divider } from "antd";
import {
    HiddenDesktop,
    StyledBreadcrumb,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { SettingsSubNav } from "../../components/settings/SettingsSubNav";
import { useEffect, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { darcula } from "react-syntax-highlighter/dist/esm/styles/prism"; // You can choose any theme you like

const { Paragraph, Text } = Typography;

export const RtnlPage = () => {
    const { t } = useTranslation();
    const [logEntries, setLogEntries] = useState<string[]>([""]);
    const logListRef = useRef<HTMLDivElement>(null);
    const [rtnlActive, setRtnlActive] = useState(false);

    useEffect(() => {
        if (rtnlActive) {
            // mock logging
            const interval = setInterval(() => {
                const currentTime = new Date().toLocaleTimeString();
                const commands = ["ls", "cd", "mkdir", "rm", "grep", "cat"];
                const randomCommand = commands[Math.floor(Math.random() * commands.length)];
                const randomFileName = `file${Math.floor(Math.random() * 10)}.txt`;
                const randomMessage = [
                    "Command executed successfully",
                    "Permission denied",
                    "File not found",
                    "Invalid command",
                ];
                const randomIndex = Math.floor(Math.random() * randomMessage.length);
                const newLogEntry = `[${currentTime}] User: ${randomCommand} ${randomFileName}: ${randomMessage[randomIndex]}`;
                setLogEntries((prevLogEntries) => [...prevLogEntries, newLogEntry]);
            }, 1000);
            return () => clearInterval(interval);
        } else {
            return;
        }
    }, [rtnlActive]);

    useEffect(() => {
        if (logListRef.current) {
            logListRef.current.scrollTop = logListRef.current.scrollHeight;
        }
    }, [logEntries]);

    const handleOnChange = (checked: boolean) => {
        setRtnlActive(checked);
    };

    return (
        <>
            <StyledSider>
                <SettingsSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <SettingsSubNav />
                </HiddenDesktop>
                <StyledBreadcrumb
                    items={[{ title: t("home.navigationTitle") }, { title: t("settings.rtnl.navigationTitle") }]}
                />
                <StyledContent>
                    <h1>{t(`settings.rtnl.title`)}</h1>
                    <Alert
                        message={t("settings.information")}
                        description={<div>Development still in progress</div>}
                        type="info"
                        showIcon
                    />
                    <Paragraph style={{ margin: "8px 0" }}>
                        <Paragraph>
                            <Text>{t("settings.rtnl.enableRtnl")}</Text>
                            <Switch checked={rtnlActive} onChange={handleOnChange} style={{ marginLeft: 8 }} />
                        </Paragraph>
                        <Divider>{t("settings.rtnl.title")}</Divider>

                        <div
                            ref={logListRef}
                            style={{
                                minHeight: "min(50vh, 500px)",
                                maxHeight: "min(50vh, 400px)",
                                overflowY: "auto",
                                padding: 10,
                                fontFamily: "monospace",
                                background: "rgb(43, 43, 43)",
                            }}
                        >
                            <List
                                dataSource={logEntries}
                                renderItem={(item, index) => (
                                    <List.Item
                                        key={index}
                                        style={{
                                            padding: 0,
                                            margin: 0,
                                            fontFamily: "monospace",
                                            border: "none",
                                            background: "rgb(43, 43, 43)",
                                        }}
                                    >
                                        <SyntaxHighlighter
                                            language="log"
                                            style={darcula}
                                            customStyle={{
                                                padding: 0,
                                                borderRadius: 0,
                                                margin: 0,
                                                border: "none",
                                            }}
                                        >
                                            {item}
                                        </SyntaxHighlighter>
                                    </List.Item>
                                )}
                            />
                        </div>
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
