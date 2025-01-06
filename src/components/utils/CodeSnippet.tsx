import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { theme, Tooltip } from "antd";
import { CheckOutlined, CopyOutlined } from "@ant-design/icons";
import { detectColorScheme } from "../../utils/browserUtils";

const { useToken } = theme;

interface CodeSnippetProps {
    code: string;
    language?: string | undefined;
    showLineNumbers?: boolean;
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({ language, code, showLineNumbers = true }) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const [copySuccess, setCopySuccess] = useState<string>("");
    const [isSecureContext, setIsSecureContext] = useState(false);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setIsSecureContext(window.isSecureContext);
    }, []);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopySuccess(t("utils.copied"));
            setTimeout(() => setCopySuccess(""), 2000);
        });
    };

    // fall back in unsecure context as navigator.clipboard is only available in secure context
    const copyToClipboardFallback = () => {
        if (textAreaRef.current) {
            textAreaRef.current.select();
            try {
                document.execCommand("copy");
                setCopySuccess(t("utils.copied"));
                setTimeout(() => setCopySuccess(""), 2000);
            } catch (err) {
                setCopySuccess(t("utils.failedToCopied"));
            }
        }
    };

    return (
        <div style={{ position: "relative" }}>
            <SyntaxHighlighter
                language={language}
                style={detectColorScheme() === "dark" ? oneDark : oneLight}
                customStyle={{
                    padding: "0.5rem",
                    borderRadius: "8px",
                    margin: "0.5rem 0",
                    border: "1px solid",
                    borderColor: token.colorBorderSecondary,
                }}
                showLineNumbers={showLineNumbers}
                lineNumberStyle={{ minWidth: "2rem", textAlign: "right", paddingRight: "1rem" }}
                wrapLines={true}
                lineProps={{ style: { whiteSpace: "pre-wrap" } }}
            >
                {code}
            </SyntaxHighlighter>
            {!isSecureContext && (
                <textarea
                    ref={textAreaRef}
                    value={code}
                    readOnly
                    style={{
                        position: "absolute",
                        left: "-9999px",
                        opacity: 0,
                    }}
                />
            )}

            {copySuccess ? null : (
                <Tooltip title={t("utils.copyToClipboard")}>
                    <button
                        onClick={isSecureContext ? copyToClipboard : copyToClipboardFallback}
                        style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                        }}
                    >
                        <CopyOutlined style={{ color: token.colorText }} />
                    </button>
                </Tooltip>
            )}
            {copySuccess && (
                <span
                    style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        border: "none",
                        background: "transparent",
                        color: token.colorSuccess,
                        fontSize: "small",
                    }}
                >
                    <CheckOutlined /> {copySuccess}
                </span>
            )}
        </div>
    );
};

export default CodeSnippet;
