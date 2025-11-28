export type InlineFormatKind = "text" | "bold" | "italic" | "code";

export interface InlineSegment {
    type: InlineFormatKind;
    content: string;
}

/**
 * Parses a simple inline formatting subset:
 * **bold**, _italic_, `code`
 */
export function parseInlineFormatting(input: string): InlineSegment[] {
    const segments: InlineSegment[] = [];

    if (!input) {
        return segments;
    }

    const parts = input.split(/(\*\*.+?\*\*|_.+?_|`.+?`)/g).filter(Boolean);

    for (const part of parts) {
        if (part.startsWith("**") && part.endsWith("**")) {
            segments.push({
                type: "bold",
                content: part.slice(2, -2),
            });
        } else if (part.startsWith("_") && part.endsWith("_")) {
            segments.push({
                type: "italic",
                content: part.slice(1, -1),
            });
        } else if (part.startsWith("`") && part.endsWith("`")) {
            segments.push({
                type: "code",
                content: part.slice(1, -1),
            });
        } else {
            segments.push({
                type: "text",
                content: part,
            });
        }
    }

    return segments;
}
