declare global {
    interface Window {
        __consoleWrapped?: boolean;
        __consoleOrig?: {
            log: (...a: unknown[]) => void;
            info: (...a: unknown[]) => void;
            warn: (...a: unknown[]) => void;
            error: (...a: unknown[]) => void;
            debug: (...a: unknown[]) => void;
            trace: (...a: unknown[]) => void;
        };
    }
}

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | "TRACE";

export const installConsoleLogCapture = (append: (line: string) => void) => {
    if (window.__consoleWrapped) return;

    const formatTimestamp = () => {
        const d = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
            d.getMinutes()
        )}:${pad(d.getSeconds())}`;
    };

    const MAX_STR = 2000;

    const summarize = (v: unknown): string => {
        try {
            if (v == null) return String(v);

            if (v instanceof ArrayBuffer) return `[ArrayBuffer ${v.byteLength} bytes]`;
            if (v instanceof Uint8Array) return `[Uint8Array ${v.byteLength} bytes]`;
            if (v instanceof Blob) return `[Blob ${v.size} bytes, ${v.type || "unknown"}]`;

            if (ArrayBuffer.isView(v)) {
                const anyView = v as ArrayBufferView;
                return `[${anyView.constructor?.name ?? "TypedArray"} ${anyView.byteLength} bytes]`;
            }

            if (typeof v === "string") {
                return v.length > MAX_STR ? v.slice(0, MAX_STR) + "…[truncated]" : v;
            }

            if (typeof v === "number" || typeof v === "boolean") return String(v);

            if (typeof v === "object" && v !== null) {
                const obj = v as Record<string, unknown>;
                const out: Record<string, unknown> = {};

                for (const [key, value] of Object.entries(obj)) {
                    if (key === "data" || key === "raw") {
                        if (value && typeof value === "object" && typeof (value as any).length === "number") {
                            out[key] = `${(value as any).length} bytes`;
                        } else if (value && typeof value === "object") {
                            out[key] = `${Object.keys(value).length} bytes`;
                        } else {
                            out[key] = "unknown size";
                        }
                    } else {
                        out[key] = value;
                    }
                }

                try {
                    const s = JSON.stringify(out);
                    if (s.length <= MAX_STR) return s;
                    return `[Object ${Object.keys(out).join(", ")}]`;
                } catch {
                    return "[Object]";
                }
            }

            return String(v);
        } catch {
            return "[Unserializable]";
        }
    };

    const stringifyArgs = (args: unknown[]) => args.map(summarize).join(" ");

    window.__consoleOrig = {
        log: console.log.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
        debug: console.debug.bind(console),
        trace: console.trace.bind(console),
    };

    const make =
        (level: LogLevel, original: (...a: unknown[]) => void) =>
        (...args: unknown[]) => {
            const line = `[${level}] ${formatTimestamp()} ${stringifyArgs(args)}`;
            append(line);
            original(...args); // no recursion
        };

    console.log = make("INFO", window.__consoleOrig.log);
    console.info = make("INFO", window.__consoleOrig.info);
    console.warn = make("WARN", window.__consoleOrig.warn);
    console.error = make("ERROR", window.__consoleOrig.error);
    console.debug = make("DEBUG", window.__consoleOrig.debug);
    console.trace = make("TRACE", window.__consoleOrig.trace);

    window.__consoleWrapped = true;
};

export const uninstallConsoleLogCapture = () => {
    if (!window.__consoleWrapped || !window.__consoleOrig) return;
    console.log = window.__consoleOrig.log;
    console.info = window.__consoleOrig.info;
    console.warn = window.__consoleOrig.warn;
    console.error = window.__consoleOrig.error;
    console.debug = window.__consoleOrig.debug;
    console.trace = window.__consoleOrig.trace;
    window.__consoleWrapped = false;
};
