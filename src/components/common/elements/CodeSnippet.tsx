import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button, theme, Tooltip } from "antd";
import { CheckOutlined, CopyOutlined } from "@ant-design/icons";
import { canHover } from "../../../utils/browser/browserUtils";

const { useToken } = theme;

interface CodeSnippetProps {
    code: string;
    language?: string;
    showLineNumbers?: boolean;
}

function isDarkColor(hex: string): boolean {
    if (!hex || !hex.startsWith("#") || (hex.length !== 7 && hex.length !== 4)) {
        return false;
    }

    let r: number, g: number, b: number;

    if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    } else {
        // Short form #rgb
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    }

    // Perceived brightness formula
    const brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return brightness < 0.5;
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({ language, code, showLineNumbers = true }) => {
    const { t } = useTranslation();
    const { token } = useToken();

    const [copyStatus, setCopyStatus] = useState<string>("");
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const isSecureContext = typeof window !== "undefined" && window.isSecureContext && !!navigator.clipboard;

    // Clear copy status after 2 seconds
    useEffect(() => {
        if (!copyStatus) return;
        const timer = setTimeout(() => setCopyStatus(""), 2000);
        return () => clearTimeout(timer);
    }, [copyStatus]);

    const handleCopySecure = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopyStatus(t("utils.copied"));
        } catch {
            setCopyStatus(t("utils.failedToCopied"));
        }
    };

    const handleCopyFallback = () => {
        const el = textareaRef.current;
        if (!el) return;

        el.select();
        try {
            document.execCommand("copy");
            setCopyStatus(t("utils.copied"));
        } catch {
            setCopyStatus(t("utils.failedToCopied"));
        }
    };

    const handleCopy = () => {
        if (isSecureContext) {
            void handleCopySecure();
        } else {
            handleCopyFallback();
        }
    };

    const syntaxStyle = isDarkColor(token.colorBgBase) ? oneDark : oneLight;

    return (
        <div
            style={{
                position: "relative",
                scrollbarColor: `${token.colorTextDescription} ${token.colorBgContainer}`,
            }}
        >
            <SyntaxHighlighter
                language={language}
                style={syntaxStyle}
                customStyle={{
                    padding: "0.5rem",
                    borderRadius: 8,
                    margin: "0.5rem 0",
                    border: "1px solid",
                    borderColor: token.colorBorderSecondary,
                }}
                showLineNumbers={showLineNumbers}
                lineNumberStyle={{
                    minWidth: "2rem",
                    textAlign: "right",
                    paddingRight: "1rem",
                }}
                wrapLines
                lineProps={{ style: { whiteSpace: "pre-wrap" } }}
            >
                {code}
            </SyntaxHighlighter>

            {!isSecureContext && (
                <textarea
                    ref={textareaRef}
                    value={code}
                    readOnly
                    style={{
                        position: "absolute",
                        left: -9999,
                        opacity: 0,
                        pointerEvents: "none",
                    }}
                />
            )}

            {!copyStatus && (
                <Tooltip open={!canHover ? false : undefined} title={t("utils.copyToClipboard")}>
                    <Button
                        type="text"
                        size="small"
                        aria-label={t("utils.copyToClipboard")}
                        onClick={handleCopy}
                        icon={<CopyOutlined />}
                        style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            padding: 4,
                            height: "auto",
                            minWidth: "auto",
                        }}
                    />
                </Tooltip>
            )}

            {copyStatus && (
                <span
                    style={{
                        position: "absolute",
                        top: 10,
                        right: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        color: token.colorSuccess,
                        fontSize: "small",
                    }}
                >
                    <CheckOutlined /> {copyStatus}
                </span>
            )}
        </div>
    );
};

export default CodeSnippet;
