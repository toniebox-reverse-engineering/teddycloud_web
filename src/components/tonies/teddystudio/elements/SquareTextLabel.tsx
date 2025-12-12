import { useAutoFitFontSize } from "../hooks/useAutoFitFontsize";

export function SquareTextLabel({
    text,
    color,
    maxFontSizePx,
    minFontSizePx = 10,
}: {
    text: string;
    color?: string;
    maxFontSizePx: number;
    minFontSizePx?: number;
}) {
    const safeText = text ?? "";
    const { ref, fontSize } = useAutoFitFontSize({
        text: safeText,
        maxFontSize: maxFontSizePx,
        minFontSize: minFontSizePx,
    });

    return (
        <div
            ref={ref}
            style={{
                height: "100%",
                width: "100%",
                overflow: "hidden",
                whiteSpace: "nowrap",
                minWidth: 0,
                color: color,
                fontSize,
                margin: 8,
                paddingTop: 8,
            }}
        >
            {safeText}
        </div>
    );
}
