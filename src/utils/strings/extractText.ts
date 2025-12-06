import { isValidElement, ReactElement, ReactNode } from "react";

export const extractText = (node: ReactNode): string => {
    if (!node) return "";

    if (typeof node === "string" || typeof node === "number") {
        return String(node);
    }

    if (Array.isArray(node)) {
        return node.map(extractText).join("");
    }

    if (isValidElement(node)) {
        const el = node as ReactElement<{ children?: ReactNode }>;
        return extractText(el.props.children);
    }

    return "";
};
