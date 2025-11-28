import React from "react";
import { Typography } from "antd";
import { InlineSegment, parseInlineFormatting } from "./parseInlineFormatting";

const { Text } = Typography;

/**
 * Renders formatted text segments using AntD Typography.Text.
 * Supports **bold**, _italic_, and `code`.
 */
export function renderFormattedText(text: string, keyPrefix = "formatted-"): React.ReactNode[] {
    const segments: InlineSegment[] = parseInlineFormatting(text);

    return segments.map((segment, index) => {
        const key = `${keyPrefix}${index}`;

        switch (segment.type) {
            case "bold":
                return (
                    <Text key={key} strong>
                        {segment.content}
                    </Text>
                );
            case "italic":
                return (
                    <Text key={key} italic>
                        {segment.content}
                    </Text>
                );
            case "code":
                return (
                    <Text key={key} code>
                        {segment.content}
                    </Text>
                );
            case "text":
            default:
                return <Text key={key}>{segment.content}</Text>;
        }
    });
}
