import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Switch, Typography, Divider, Button } from "antd";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { SettingsSubNav } from "../../components/settings/SettingsSubNav";
import { detectColorScheme } from "../../utils/browserUtils";

const { Paragraph, Text } = Typography;

export const RtnlPage = () => {
    const { t } = useTranslation();

    const [logEntries, setLogEntries] = useState<string[]>([]);
    const logListRef = useRef<HTMLDivElement>(null);
    const [rtnlActive, setRtnlActive] = useState(false);

    const hexToStr = (hex: string) => {
        let str = "";
        for (let i = 0; i < hex.length; i += 2) {
            let pair = hex.substr(i, 2);
            let charCode = parseInt(pair, 16);
            if (charCode >= 32 && charCode <= 126) {
                str += String.fromCharCode(charCode);
            } else {
                str += ".";
            }
        }
        return str;
    };

    const littleEndianToNum = (hex: string) => {
        let bigEndianHex = "";
        for (let i = 0; i < hex.length; i += 2) {
            bigEndianHex = hex.substring(i, i + 2) + bigEndianHex;
        }

        let num = parseInt(bigEndianHex, 16);
        let maxVal = 2 ** 31;

        if (num >= maxVal) {
            num = num - 2 * maxVal;
        }
        return num;
    };

    const functionHandlers: { [key: string]: (payload: string) => void } = {
        /* ESP32 box events */
        "15-15452": (payload: string) => {
            if (payload.length === 16) {
                const rearrangedPayload = payload.slice(8) + payload.slice(0, 8);
                setLogEntries((prevLogEntries) => [...prevLogEntries, `UnknownTag | ${rearrangedPayload}`]);
            } else {
                console.log(`Incorrect payload length for '${payload}'. Unable to rearrange.`);
            }
        },
        "15-16065": (payload: string) => {
            if (payload.length === 16) {
                const rearrangedPayload = payload.slice(8) + payload.slice(0, 8);
                setLogEntries((prevLogEntries) => [...prevLogEntries, `KnownTag | ${rearrangedPayload}`]);
            } else {
                console.log(`Incorrect payload length for '${payload}'. Unable to rearrange.`);
            }
        },
        "12-15427": (payload: string) => {
            if (payload.length === 8) {
                const value = littleEndianToNum(payload);
                setLogEntries((prevLogEntries) => [...prevLogEntries, `UpsideState | ${value}`]);
            } else {
                console.log(`Incorrect payload length for '${payload}'. Unable to rearrange.`);
            }
        },
        "12-15426": (payload: string) => {
            if (payload.length === 8) {
                const value = littleEndianToNum(payload);
                setLogEntries((prevLogEntries) => [...prevLogEntries, `UprightState | ${value}`]);
            } else {
                console.log(`Incorrect payload length for '${payload}'. Unable to rearrange.`);
            }
        },
    };

    useEffect(() => {
        if (rtnlActive) {
            const eventSource = new EventSource(import.meta.env.VITE_APP_TEDDYCLOUD_API_URL + "/api/sse");
            eventSource.onopen = () => {
                console.log("Connection established.");
            };

            eventSource.addEventListener("keep-alive", (e) => {
                /* maybe later we have the box's ID from the certificate so we could show online states */
                console.log("keep-alive event received:", e);
            });

            eventSource.addEventListener("pressed", (event) => {
                const data = JSON.parse(event.data);
                setLogEntries((prevLogEntries) => [...prevLogEntries, "Pressed: " + data.data]);
            });

            eventSource.addEventListener("rtnl-raw-log2", (event) => {
                const data = JSON.parse(event.data);
                const newLogEntry = `${
                    "Raw2 |" +
                    " #" +
                    data.data.sequence +
                    " Uptime: " +
                    data.data.uptime +
                    " Func: " +
                    data.data.function_group.toString().padStart(2, " ") +
                    "-" +
                    data.data.function +
                    " Payload: '" +
                    data.data.field6 +
                    "'" +
                    " ASCII: '" +
                    hexToStr(data.data.field6) +
                    "'"
                }`;
                setLogEntries((prevLogEntries) => [...prevLogEntries, newLogEntry]);

                const funcKey = `${data.data.function_group.toString().padStart(2, " ")}-${data.data.function}`;
                if (functionHandlers[funcKey]) {
                    functionHandlers[funcKey](data.data.field6);
                }
            });

            eventSource.addEventListener("rtnl-raw-log3", (event) => {
                const data = JSON.parse(event.data);
                setLogEntries((prevLogEntries) => [
                    ...prevLogEntries,
                    "Raw3 | Datetime: " + data.data.datetime + " Unknown: " + data.data.field2,
                ]);
            });

            eventSource.onerror = (error) => {
                console.error("EventSource failed:", error);
            };

            return () => {
                console.log("Connection closed.");
                eventSource.close();
            };
        } else {
            return;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rtnlActive]);

    useEffect(() => {
        if (logListRef.current) {
            logListRef.current.scrollTop = logListRef.current.scrollHeight;
        }
    }, [logEntries]);

    const handleOnChange = (checked: boolean) => {
        setRtnlActive(checked);
    };

    const clearRtnl = () => {
        setLogEntries([]);
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
                <BreadcrumbWrapper
                    items={[{ title: t("home.navigationTitle") }, { title: t("settings.rtnl.navigationTitle") }]}
                />
                <StyledContent>
                    <h1>{t(`settings.rtnl.title`)}</h1>
                    <Paragraph style={{ margin: "8px 0" }}>
                        <Paragraph>
                            <Switch checked={rtnlActive} onChange={handleOnChange} style={{ marginRight: 8 }} />
                            <Text>{t("settings.rtnl.enableRtnl")}</Text>
                        </Paragraph>
                        <Divider>{t("settings.rtnl.title")}</Divider>

                        <div
                            ref={logListRef}
                            style={{
                                minHeight: "max(40vh, 333px)",
                                maxHeight: "max(40vh, 333px)",
                                overflow: "auto",
                                padding: 1,
                                // the colors are taken from the SyntaxHighlighter oneDark and oneLight Style
                                background: detectColorScheme() === "dark" ? "hsl(220, 13%, 18%)" : "hsl(230, 1%, 98%)",
                            }}
                        >
                            <SyntaxHighlighter
                                language="log"
                                style={detectColorScheme() === "dark" ? oneDark : oneLight}
                                customStyle={{
                                    borderRadius: 0,
                                    margin: 0,
                                    border: "none",
                                }}
                            >
                                {logEntries.join("\n")}
                            </SyntaxHighlighter>
                        </div>
                        <Button onClick={clearRtnl} style={{ marginTop: 8 }}>
                            {t("settings.rtnl.clear")}
                        </Button>
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
