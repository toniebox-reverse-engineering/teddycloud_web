type LogLevel = "error" | "warn" | "info" | "debug" | "default";

const getLevel = (s: string): LogLevel => {
    if (/\[(ERROR|FAIL|FATAL)\]/i.test(s)) return "error";
    if (/\[(WARN|WARNING)\]/i.test(s)) return "warn";
    if (/\[(INFO|OK)\]/i.test(s)) return "info";
    if (/\[(DEBUG|TRACE)\]/i.test(s)) return "debug";
    return "default";
};

export const LogViewer: React.FC<{
    lines: string[];
    token: any;
    logListRef?: React.RefObject<HTMLDivElement | null>;
    style?: React.CSSProperties;
}> = ({ lines, token, logListRef, style }) => (
    <div
        ref={logListRef}
        style={{
            overflow: "auto",
            padding: 8,
            background: token.colorBgContainerSecondary,
            fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            fontSize: 12,
            lineHeight: 1.4,
            whiteSpace: "pre",
            ...style,
        }}
    >
        {lines.map((line, i) => {
            const lvl = getLevel(line);
            const color =
                lvl === "error"
                    ? token.colorError
                    : lvl === "warn"
                    ? token.colorWarning
                    : lvl === "debug"
                    ? token.colorTextSecondary
                    : token.colorText;
            return (
                <div key={i} style={{ color }}>
                    {line}
                </div>
            );
        })}
    </div>
);
