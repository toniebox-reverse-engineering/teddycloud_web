import { useCallback, useEffect, useState } from "react";

export const useRtnl = () => {
    const [logEntries, setLogEntries] = useState<string[]>([]);
    const [rtnlActive, setRtnlActive] = useState(false);

    const hexToStr = useCallback((hex: string) => {
        let str = "";
        for (let i = 0; i < hex.length; i += 2) {
            const pair = hex.substring(i, i + 2);
            const charCode = parseInt(pair, 16);
            if (charCode >= 32 && charCode <= 126) {
                str += String.fromCharCode(charCode);
            } else {
                str += ".";
            }
        }
        return str;
    }, []);

    const littleEndianToNum = useCallback((hex: string) => {
        let bigEndianHex = "";
        for (let i = 0; i < hex.length; i += 2) {
            bigEndianHex = hex.substring(i, i + 2) + bigEndianHex;
        }

        let num = parseInt(bigEndianHex, 16);
        const maxVal = 2 ** 31;

        if (num >= maxVal) {
            num = num - 2 * maxVal;
        }
        return num;
    }, []);

    useEffect(() => {
        if (!rtnlActive) {
            return;
        }

        const baseUrl = import.meta.env.VITE_APP_TEDDYCLOUD_API_URL;
        const eventSource = new EventSource(`${baseUrl}/api/sse`);

        const appendLog = (entry: string) => {
            setLogEntries((prev) => [...prev, entry]);
        };

        const functionHandlers: { [key: string]: (payload: string) => void } = {
            /* ESP32 box events */
            "15-15452": (payload: string) => {
                if (payload.length === 16) {
                    const rearrangedPayload = payload.slice(8) + payload.slice(0, 8);
                    appendLog(`UnknownTag | ${rearrangedPayload}`);
                } else {
                    console.log(`Incorrect payload length for '${payload}'. Unable to rearrange.`);
                }
            },
            "15-16065": (payload: string) => {
                if (payload.length === 16) {
                    const rearrangedPayload = payload.slice(8) + payload.slice(0, 8);
                    appendLog(`KnownTag | ${rearrangedPayload}`);
                } else {
                    console.log(`Incorrect payload length for '${payload}'. Unable to rearrange.`);
                }
            },
            "12-15427": (payload: string) => {
                if (payload.length === 8) {
                    const value = littleEndianToNum(payload);
                    appendLog(`UpsideState | ${value}`);
                } else {
                    console.log(`Incorrect payload length for '${payload}'. Unable to rearrange.`);
                }
            },
            "12-15426": (payload: string) => {
                if (payload.length === 8) {
                    const value = littleEndianToNum(payload);
                    appendLog(`UprightState | ${value}`);
                } else {
                    console.log(`Incorrect payload length for '${payload}'. Unable to rearrange.`);
                }
            },
        };

        eventSource.onopen = () => {
            console.log("RTNL SSE connection established.");
        };

        eventSource.addEventListener("keep-alive", (e) => {
            console.log("keep-alive event received:", e);
        });

        eventSource.addEventListener("pressed", (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                appendLog("Pressed: " + data.data);
            } catch (err) {
                console.error("Error parsing 'pressed' event:", err);
            }
        });

        eventSource.addEventListener("rtnl-raw-log2", (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                const entryData = data.data;

                const funcGroup = entryData.function_group.toString().padStart(2, " ");
                const func = entryData.function;
                const payload = entryData.field6;

                const newLogEntry =
                    "Raw2 |" +
                    " #" +
                    entryData.sequence +
                    " Uptime: " +
                    entryData.uptime +
                    " Func: " +
                    funcGroup +
                    "-" +
                    func +
                    " Payload: '" +
                    payload +
                    "'" +
                    " ASCII: '" +
                    hexToStr(payload) +
                    "'";

                appendLog(newLogEntry);

                const funcKey = `${funcGroup}-${func}`;
                if (functionHandlers[funcKey]) {
                    functionHandlers[funcKey](payload);
                }
            } catch (err) {
                console.error("Error parsing 'rtnl-raw-log2' event:", err);
            }
        });

        eventSource.addEventListener("rtnl-raw-log3", (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                const entryData = data.data;
                appendLog("Raw3 | Datetime: " + entryData.datetime + " Unknown: " + entryData.field2);
            } catch (err) {
                console.error("Error parsing 'rtnl-raw-log3' event:", err);
            }
        });

        eventSource.onerror = (error) => {
            console.error("RTNL EventSource failed:", error);
        };

        return () => {
            console.log("RTNL SSE connection closed.");
            eventSource.close();
        };
    }, [rtnlActive, hexToStr, littleEndianToNum]);

    const clearRtnl = useCallback(() => {
        setLogEntries([]);
    }, []);

    return {
        logEntries,
        rtnlActive,
        setRtnlActive,
        clearRtnl,
    };
};
