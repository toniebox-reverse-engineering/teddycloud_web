import type { MergedItem } from "../hooks/useCustomItems";
import type { SettingsState } from "../hooks/useSettings";
import { buildEffectiveSettings, type LabelOverridesById } from "../types/labelOverrides";
import { getContrastTextColor } from "../../../../utils/helper";
import { withBase } from "../../../../utils/basePath";
import { toImageSrc } from "../../common/utils/imagePathUtils";
import { loadFlagAsset } from "../../../common/icons/languageFlagAssets";
import { buildPdfFromJpegPages, type PdfPageImage } from "./pdfDocument";
import { createPrintLayout, parseMm, type PrintLabelPlacement } from "./printLayout";
import { ensurePrintFonts } from "./printFonts";

const PRINT_DPI = 300;
const CSS_DPI = 96;
const MM_PER_INCH = 25.4;
const PT_PER_INCH = 72;

const mmToCanvasPx = (mm: number): number => (mm * PRINT_DPI) / MM_PER_INCH;
const cssPxToCanvasPx = (px: number): number => (px * PRINT_DPI) / CSS_DPI;
const mmToPt = (mm: number): number => (mm * PT_PER_INCH) / MM_PER_INCH;

const cssPx = (value: string | number, fallback = 14): number => {
    const parsed = typeof value === "number" ? value : Number.parseFloat(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const canvasToJpeg = async (canvas: HTMLCanvasElement): Promise<Uint8Array> => {
    const blob = await new Promise<Blob>((resolve, reject) => {
        try {
            canvas.toBlob(
                (value) =>
                    value ? resolve(value) : reject(new Error("Could not encode print page.")),
                "image/jpeg",
                0.96,
            );
        } catch (error) {
            reject(error);
        }
    });
    return new Uint8Array(await blob.arrayBuffer());
};

const loadHtmlImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Could not load image: ${url}`));
        image.src = url;
    });

export interface TeddyStudioPdfWarning {
    code: "image-load-failed" | "font-load-failed";
    message: string;
    url?: string;
}

class ImageCache {
    private readonly cache = new Map<string, Promise<HTMLImageElement | null>>();

    constructor(private readonly onWarning?: (warning: TeddyStudioPdfWarning) => void) {}

    load(rawUrl: string): Promise<HTMLImageElement | null> {
        const url = withBase(rawUrl);
        const cached = this.cache.get(url);
        if (cached) return cached;

        const promise = this.loadUncached(url);
        this.cache.set(url, promise);
        return promise;
    }

    private async loadUncached(url: string): Promise<HTMLImageElement | null> {
        try {
            if (url.startsWith("blob:") || url.startsWith("data:")) {
                return await loadHtmlImage(url);
            }

            const response = await fetch(url, { credentials: "same-origin" });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            try {
                return await loadHtmlImage(objectUrl);
            } finally {
                URL.revokeObjectURL(objectUrl);
            }
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            this.onWarning?.({
                code: "image-load-failed",
                message: `Could not load image ${url}: ${reason}`,
                url,
            });
            return null;
        }
    }
}

const objectPositionFactors = (position: string): [number, number] => {
    const normalized = (position || "center").toLowerCase();
    const x = normalized.includes("left") ? 0 : normalized.includes("right") ? 1 : 0.5;
    const y = normalized.includes("top") ? 0 : normalized.includes("bottom") ? 1 : 0.5;
    return [x, y];
};

const beginLabelPath = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    round: boolean,
) => {
    ctx.beginPath();
    if (round) {
        ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
    } else {
        ctx.rect(x, y, width, height);
    }
};

const withLabelClip = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    round: boolean,
    draw: () => void,
) => {
    ctx.save();
    beginLabelPath(ctx, x, y, width, height, round);
    ctx.clip();
    draw();
    ctx.restore();
};

const drawCoverImage = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
    position: string,
    scale: number,
    offsetLeftCssPx: number,
    offsetBottomCssPx: number,
) => {
    const [positionX, positionY] = objectPositionFactors(position);
    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;
    const targetRatio = width / height;
    const sourceRatio = imageWidth / imageHeight;

    let sourceWidth = imageWidth;
    let sourceHeight = imageHeight;
    if (sourceRatio > targetRatio) {
        sourceWidth = imageHeight * targetRatio;
    } else {
        sourceHeight = imageWidth / targetRatio;
    }

    const sourceX = Math.max(0, (imageWidth - sourceWidth) * positionX);
    const sourceY = Math.max(0, (imageHeight - sourceHeight) * positionY);
    const safeScale = Number.isFinite(scale) && scale >= 0 ? scale : 1;
    const scaledWidth = width * safeScale;
    const scaledHeight = height * safeScale;
    const offsetLeft = cssPxToCanvasPx(offsetLeftCssPx);
    const offsetBottom = cssPxToCanvasPx(offsetBottomCssPx);
    const targetX = x + offsetLeft - (scaledWidth - width) / 2;
    const targetY = y - offsetBottom - (scaledHeight - height) / 2;

    if (scaledWidth <= 0 || scaledHeight <= 0) return;

    ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        targetX,
        targetY,
        scaledWidth,
        scaledHeight,
    );
};

const breakLongWord = (ctx: CanvasRenderingContext2D, word: string, maxWidth: number): string[] => {
    const parts: string[] = [];
    let current = "";

    for (const char of word) {
        const candidate = current + char;
        if (current && ctx.measureText(candidate).width > maxWidth) {
            parts.push(current);
            current = char;
        } else {
            current = candidate;
        }
    }

    if (current) parts.push(current);
    return parts.length ? parts : [word];
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    if (!text) return [];

    const result: string[] = [];

    text.split("\n").forEach((paragraph) => {
        if (paragraph === "") {
            result.push("");
            return;
        }

        let line = "";
        paragraph.split(/\s+/).forEach((word) => {
            if (ctx.measureText(word).width <= maxWidth) {
                const candidate = line ? `${line} ${word}` : word;
                if (line && ctx.measureText(candidate).width > maxWidth) {
                    result.push(line);
                    line = word;
                } else {
                    line = candidate;
                }
                return;
            }

            if (line) {
                result.push(line);
                line = "";
            }

            const parts = breakLongWord(ctx, word, maxWidth);
            result.push(...parts.slice(0, -1));
            line = parts.at(-1) ?? "";
        });

        if (line) result.push(line);
    });

    return result;
};

const drawCenteredLines = (
    ctx: CanvasRenderingContext2D,
    lines: string[],
    x: number,
    centerY: number,
    lineHeight: number,
) => {
    if (!lines.length) return;
    const totalHeight = lines.length * lineHeight;
    let y = centerY - totalHeight / 2 + lineHeight / 2;

    lines.forEach((line) => {
        ctx.fillText(line, x, y);
        y += lineHeight;
    });
};

const fitCircularFontSize = (
    ctx: CanvasRenderingContext2D,
    text: string,
    fontFamily: string,
    minFontPx: number,
    maxFontPx: number,
    outerRadius: number,
): number => {
    let low = minFontPx;
    let high = Math.max(minFontPx, maxFontPx);
    let best = minFontPx;

    for (let i = 0; i < 12; i++) {
        const current = (low + high) / 2;
        ctx.font = `${current}px ${fontFamily}`;
        const radius = Math.max(1, outerRadius - current * 0.75);
        const fits = ctx.measureText(text).width <= Math.PI * 2 * radius;
        if (fits) {
            best = current;
            low = current;
        } else {
            high = current;
        }
    }

    return best;
};

const drawCircularText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    centerY: number,
    size: number,
    requestedFontSize: number,
    color: string,
    fontFamily: string,
    rotateDeg: number,
) => {
    if (!text) return;

    const padding = cssPxToCanvasPx(4);
    const outerRadius = Math.max(1, (size - 2 * padding) / 2);
    const fontSize = fitCircularFontSize(
        ctx,
        text,
        fontFamily,
        cssPxToCanvasPx(10),
        requestedFontSize,
        outerRadius,
    );
    const textRadius = Math.max(1, outerRadius - fontSize * 0.75);

    ctx.save();
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const characters = Array.from(text);
    const rawWidths = characters.map((char) => ctx.measureText(char).width);
    const rawTotalWidth = rawWidths.reduce((sum, width) => sum + width, 0);
    const measuredWidth = ctx.measureText(text).width;
    const kerningScale = rawTotalWidth > 0 ? measuredWidth / rawTotalWidth : 1;
    const widths = rawWidths.map((width) => width * kerningScale);
    const totalWidth = widths.reduce((sum, width) => sum + width, 0);
    let distance = -totalWidth / 2;
    const centerAngle = (270 + rotateDeg) * (Math.PI / 180);

    characters.forEach((char, index) => {
        const width = widths[index];
        const charDistance = distance + width / 2;
        const angle = centerAngle + charDistance / textRadius;
        const x = centerX + Math.cos(angle) * textRadius;
        const y = centerY + Math.sin(angle) * textRadius;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillText(char, 0, 0);
        ctx.restore();

        distance += width;
    });

    ctx.restore();
};

const drawLabelBorder = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    round: boolean,
    color: string,
) => {
    const lineWidth = cssPxToCanvasPx(1);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    beginLabelPath(
        ctx,
        x + lineWidth / 2,
        y + lineWidth / 2,
        Math.max(0, width - lineWidth),
        Math.max(0, height - lineWidth),
        round,
    );
    ctx.stroke();
    ctx.restore();
};

const drawImageLabel = async (
    ctx: CanvasRenderingContext2D,
    item: MergedItem,
    placement: PrintLabelPlacement,
    settings: SettingsState,
    imageCache: ImageCache,
) => {
    const x = mmToCanvasPx(placement.xMm);
    const y = mmToCanvasPx(placement.yMm);
    const width = mmToCanvasPx(placement.widthMm);
    const height = mmToCanvasPx(placement.heightMm);
    const bleed = mmToCanvasPx(parseMm(settings.paperLabelImageBleed, "label image bleed"));
    const round = settings.labelShape === "round";
    const backgroundColor = settings.labelBackgroundColor || "#ffffff";
    const textColor = getContrastTextColor(backgroundColor);
    const bleedX = x - bleed;
    const bleedY = y - bleed;
    const bleedWidth = width + bleed * 2;
    const bleedHeight = height + bleed * 2;

    withLabelClip(ctx, bleedX, bleedY, bleedWidth, bleedHeight, round, () => {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(bleedX, bleedY, bleedWidth, bleedHeight);
    });

    if (item.pic) {
        const image = await imageCache.load(toImageSrc(item.pic));
        if (image) {
            withLabelClip(ctx, bleedX, bleedY, bleedWidth, bleedHeight, round, () => {
                drawCoverImage(
                    ctx,
                    image,
                    bleedX,
                    bleedY,
                    bleedWidth,
                    bleedHeight,
                    settings.imagePosition,
                    settings.imageScale,
                    settings.imageLeft,
                    settings.imageBottom,
                );
            });
        }
    }

    if (settings.showSeriesOnImageLabel) {
        const labelText = `${item.text ?? ""}${item.episodes ? ` - ${item.episodes}` : ""}`;
        const fontFamily = settings.fontFamily || "sans-serif";
        const requestedFontSize = cssPxToCanvasPx(
            cssPx(settings.seriesOnImageLabelFontSize || settings.textFontSize, 12),
        );

        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (round) {
            drawCircularText(
                ctx,
                labelText,
                x + width / 2,
                y + height / 2,
                cssPxToCanvasPx(150),
                requestedFontSize,
                textColor,
                fontFamily,
                settings.seriesOnImageLabelRotationDeg || 0,
            );
        } else {
            withLabelClip(ctx, x, y, width, height, false, () => {
                ctx.font = `${requestedFontSize}px ${fontFamily}`;
                ctx.fillText(labelText, x + width / 2, y + height / 2);
            });
        }
    }

    if (settings.showLabelBorder) {
        drawLabelBorder(ctx, x, y, width, height, round, textColor);
    }
};

const loadFlagImage = async (
    language: string,
    imageCache: ImageCache,
): Promise<HTMLImageElement | null> => {
    const code = language.toUpperCase().split("-")[1];
    const flagUrl = await loadFlagAsset(code || "UNKNOWN");
    const fallbackUrl = flagUrl ?? (await loadFlagAsset("UNKNOWN"));
    return fallbackUrl ? imageCache.load(fallbackUrl) : null;
};

const drawFlagImage = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    height: number,
) => {
    const naturalWidth = image.naturalWidth || image.width || 3;
    const naturalHeight = image.naturalHeight || image.height || 2;
    const width = height * (naturalWidth / naturalHeight);
    ctx.drawImage(image, x - width / 2, y, width, height);
};

const drawTextLabel = async (
    ctx: CanvasRenderingContext2D,
    item: MergedItem,
    placement: PrintLabelPlacement,
    settings: SettingsState,
    imageCache: ImageCache,
) => {
    const x = mmToCanvasPx(placement.xMm);
    const y = mmToCanvasPx(placement.yMm);
    const width = mmToCanvasPx(placement.widthMm);
    const height = mmToCanvasPx(placement.heightMm);
    const bleed = mmToCanvasPx(parseMm(settings.paperLabelImageBleed, "label image bleed"));
    const round = settings.labelShape === "round";
    const backgroundColor = settings.labelBackgroundColor || "#ffffff";
    const textColor = getContrastTextColor(backgroundColor);
    const fontFamily = settings.fontFamily || "sans-serif";
    const fontSize = cssPxToCanvasPx(cssPx(settings.textFontSize, 14));
    const smallFontSize = fontSize * 0.833333;
    const lineHeight = fontSize * 1.2;
    const smallLineHeight = smallFontSize * 1.2;
    const contentPadding = mmToCanvasPx(
        parseMm(settings.contentPadding || "0mm", "content padding"),
    );
    const bleedX = x - bleed;
    const bleedY = y - bleed;
    const bleedWidth = width + bleed * 2;
    const bleedHeight = height + bleed * 2;
    const flagImage =
        !settings.printTrackListInsteadTitle && settings.showLanguageFlag && item.language
            ? await loadFlagImage(item.language, imageCache)
            : null;

    withLabelClip(ctx, bleedX, bleedY, bleedWidth, bleedHeight, round, () => {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(bleedX, bleedY, bleedWidth, bleedHeight);
    });

    withLabelClip(ctx, bleedX, bleedY, bleedWidth, bleedHeight, round, () => {
        const innerLeft = x + contentPadding + cssPxToCanvasPx(8);
        const innerRight = x + width - contentPadding - cssPxToCanvasPx(8);
        const innerWidth = Math.max(cssPxToCanvasPx(4), innerRight - innerLeft);
        const topY = y + contentPadding + cssPxToCanvasPx(2);
        const bottomY = y + height - contentPadding - cssPxToCanvasPx(2);

        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const topBandHeight = Math.max(cssPxToCanvasPx(12), fontSize);
        const bottomBandHeight = Math.max(cssPxToCanvasPx(12), smallFontSize);
        const middleTop = topY + topBandHeight;
        const middleBottom = bottomY - bottomBandHeight;
        const middleCenter = (middleTop + middleBottom) / 2;

        if (flagImage) {
            drawFlagImage(ctx, flagImage, x + width / 2, topY, fontSize);
        }

        if (settings.printTrackListInsteadTitle) {
            ctx.font = `${fontSize}px ${fontFamily}`;
            const lines = wrapText(ctx, item.trackTitles.join("\n"), innerWidth);
            drawCenteredLines(ctx, lines, x + width / 2, (topY + bottomY) / 2, lineHeight);
        } else {
            const title = item.text ?? "";
            const episodes = item.episodes ?? "";
            ctx.font = `bold ${fontSize}px ${fontFamily}`;
            const titleLines = wrapText(ctx, title, innerWidth);
            ctx.font = `${fontSize}px ${fontFamily}`;
            const episodeLines = wrapText(ctx, episodes, innerWidth);
            const gap = titleLines.length && episodeLines.length ? cssPxToCanvasPx(4) : 0;
            const totalHeight =
                titleLines.length * lineHeight + episodeLines.length * lineHeight + gap;
            let lineY = middleCenter - totalHeight / 2 + lineHeight / 2;

            ctx.font = `bold ${fontSize}px ${fontFamily}`;
            titleLines.forEach((line) => {
                ctx.fillText(line, x + width / 2, lineY);
                lineY += lineHeight;
            });
            lineY += gap;
            ctx.font = `${fontSize}px ${fontFamily}`;
            episodeLines.forEach((line) => {
                ctx.fillText(line, x + width / 2, lineY);
                lineY += lineHeight;
            });
        }

        if (!settings.printTrackListInsteadTitle && settings.showModelNo && item.model) {
            ctx.font = `${smallFontSize}px ${fontFamily}`;
            const modelLines = wrapText(ctx, item.model, innerWidth);
            if (modelLines.length) {
                ctx.fillText(modelLines[0], x + width / 2, bottomY - smallLineHeight / 2);
            }
        }
    });

    if (settings.showLabelBorder) {
        drawLabelBorder(ctx, x, y, width, height, round, textColor);
    }
};

const renderPage = async (
    page: ReturnType<typeof createPrintLayout>[number],
    items: MergedItem[],
    settings: SettingsState,
    labelOverridesById: LabelOverridesById,
    imageCache: ImageCache,
): Promise<PdfPageImage> => {
    const pixelWidth = Math.max(1, Math.round(mmToCanvasPx(page.widthMm)));
    const pixelHeight = Math.max(1, Math.round(mmToCanvasPx(page.heightMm)));
    const canvas = document.createElement("canvas");
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Canvas is not available in this browser.");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pixelWidth, pixelHeight);

    for (const placement of page.placements) {
        const item = items[placement.itemIndex];
        if (!item) continue;
        const id = item.id ?? String(placement.itemIndex);
        const effectiveSettings = buildEffectiveSettings(settings, labelOverridesById[id]);

        if (placement.kind === "image") {
            await drawImageLabel(ctx, item, placement, effectiveSettings, imageCache);
        } else {
            await drawTextLabel(ctx, item, placement, effectiveSettings, imageCache);
        }
    }

    return {
        jpeg: await canvasToJpeg(canvas),
        pixelWidth,
        pixelHeight,
        widthPt: mmToPt(page.widthMm),
        heightPt: mmToPt(page.heightMm),
    };
};

export interface TeddyStudioPdfOptions {
    items: MergedItem[];
    settings: SettingsState;
    labelOverridesById?: LabelOverridesById;
    onWarning?: (warning: TeddyStudioPdfWarning) => void;
}

/**
 * Creates a print-ready PDF entirely in the frontend. The PDF page and label geometry is based on
 * millimetres, independent of browser print CSS, @page support or DOM measurements.
 */
export const createTeddyStudioPdf = async ({
    items,
    settings,
    labelOverridesById = {},
    onWarning,
}: TeddyStudioPdfOptions): Promise<Blob> => {
    if (items.length === 0) {
        throw new Error("There are no labels to print.");
    }

    const fontFamilies = new Set<string>([settings.fontFamily || "sans-serif"]);
    for (const item of items) {
        const override = labelOverridesById[item.id];
        const effective = buildEffectiveSettings(settings, override);
        fontFamilies.add(effective.fontFamily || "sans-serif");
    }
    try {
        await ensurePrintFonts(fontFamilies);
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        onWarning?.({
            code: "font-load-failed",
            message: `Could not load one or more print fonts: ${reason}`,
        });
    }

    const layout = createPrintLayout(items.length, settings);
    const imageCache = new ImageCache(onWarning);
    const pages: PdfPageImage[] = [];

    for (const page of layout) {
        pages.push(await renderPage(page, items, settings, labelOverridesById, imageCache));
    }

    const bytes = buildPdfFromJpegPages(pages);
    const buffer = new ArrayBuffer(bytes.byteLength);

    new Uint8Array(buffer).set(bytes);
    return new Blob([buffer], { type: "application/pdf" });
};
