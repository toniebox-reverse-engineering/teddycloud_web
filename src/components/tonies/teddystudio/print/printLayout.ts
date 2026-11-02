import type { SettingsState } from "../hooks/useSettings";

export type PrintLabelKind = "image" | "text";

export interface PrintLabelPlacement {
    itemIndex: number;
    kind: PrintLabelKind;
    xMm: number;
    yMm: number;
    widthMm: number;
    heightMm: number;
}

export interface PrintPageLayout {
    widthMm: number;
    heightMm: number;
    placements: PrintLabelPlacement[];
}

const PAPER_SIZES_MM: Record<Exclude<SettingsState["paperSize"], "Custom">, [number, number]> = {
    A4: [210, 297],
    A5: [148, 210],
    Letter: [215.9, 279.4],
};

const EPSILON = 0.001;

export const parseMm = (value: string, settingName: string): number => {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`Invalid ${settingName}: ${value}`);
    }
    return parsed;
};

export const getPaperSizeMm = (settings: SettingsState): [number, number] => {
    if (settings.paperSize === "Custom") {
        const width = parseMm(settings.customPaperWidth, "custom paper width");
        const height = parseMm(settings.customPaperHeight, "custom paper height");
        if (width <= 0 || height <= 0) {
            throw new Error("Custom paper dimensions must be greater than zero.");
        }
        return [width, height];
    }

    return PAPER_SIZES_MM[settings.paperSize];
};

const getLabelSizeMm = (settings: SettingsState): [number, number] => {
    if (settings.labelShape === "round") {
        const diameter = parseMm(settings.diameter, "label diameter");
        if (diameter <= 0) {
            throw new Error("Label diameter must be greater than zero.");
        }
        return [diameter, diameter];
    }

    const width = parseMm(settings.width, "label width");
    const height = parseMm(settings.height, "label height");
    if (width <= 0 || height <= 0) {
        throw new Error("Label dimensions must be greater than zero.");
    }
    return [width, height];
};

const getKinds = (settings: SettingsState): PrintLabelKind[] => {
    switch (settings.printMode) {
        case "OnlyImage":
            return ["image"];
        case "OnlyText":
            return ["text"];
        case "ImageAndText":
        default:
            return ["image", "text"];
    }
};

/**
 * Builds the physical page/label geometry used by the PDF renderer.
 * All values are in millimetres; no DOM or CSS measurements are involved.
 */
export const createPrintLayout = (
    itemCount: number,
    settings: SettingsState,
): PrintPageLayout[] => {
    const [pageWidthMm, pageHeightMm] = getPaperSizeMm(settings);
    const [labelWidthMm, labelHeightMm] = getLabelSizeMm(settings);
    const marginLeftMm = parseMm(settings.paperMarginLeft, "left paper margin");
    const marginTopMm = parseMm(settings.paperMarginTop, "top paper margin");
    const spacingXmm = parseMm(settings.labelSpacingX, "horizontal label spacing");
    const spacingYmm = parseMm(settings.labelSpacingY, "vertical label spacing");
    const kinds = getKinds(settings);

    const usableWidthMm = pageWidthMm - marginLeftMm;
    const usableHeightMm = pageHeightMm - marginTopMm;

    if (usableWidthMm <= 0 || usableHeightMm <= 0) {
        throw new Error("Paper margins leave no printable area.");
    }
    if (labelWidthMm > usableWidthMm + EPSILON || labelHeightMm > usableHeightMm + EPSILON) {
        throw new Error("The configured label does not fit on the selected paper size.");
    }

    const horizontalGroupWidthMm =
        kinds.length * labelWidthMm + Math.max(0, kinds.length - 1) * spacingXmm;
    const stackGroup = kinds.length > 1 && horizontalGroupWidthMm > usableWidthMm + EPSILON;
    const groupWidthMm = stackGroup ? labelWidthMm : horizontalGroupWidthMm;
    const groupHeightMm = stackGroup
        ? kinds.length * labelHeightMm + Math.max(0, kinds.length - 1) * spacingYmm
        : labelHeightMm;

    if (groupHeightMm > usableHeightMm + EPSILON) {
        throw new Error(
            "The configured image/text label pair does not fit on the selected paper size.",
        );
    }

    const pages: PrintPageLayout[] = [];
    let currentPage: PrintPageLayout = {
        widthMm: pageWidthMm,
        heightMm: pageHeightMm,
        placements: [],
    };
    pages.push(currentPage);

    let xMm = marginLeftMm;
    let yMm = marginTopMm;
    let rowHeightMm = 0;

    const startNewPage = () => {
        currentPage = {
            widthMm: pageWidthMm,
            heightMm: pageHeightMm,
            placements: [],
        };
        pages.push(currentPage);
        xMm = marginLeftMm;
        yMm = marginTopMm;
        rowHeightMm = 0;
    };

    const startNewRow = () => {
        xMm = marginLeftMm;
        yMm += rowHeightMm + spacingYmm;
        rowHeightMm = 0;
    };

    for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
        if (xMm > marginLeftMm + EPSILON && xMm + groupWidthMm > pageWidthMm + EPSILON) {
            startNewRow();
        }

        if (yMm + groupHeightMm > pageHeightMm + EPSILON) {
            startNewPage();
        }

        kinds.forEach((kind, kindIndex) => {
            currentPage.placements.push({
                itemIndex,
                kind,
                xMm: stackGroup ? xMm : xMm + kindIndex * (labelWidthMm + spacingXmm),
                yMm: stackGroup ? yMm + kindIndex * (labelHeightMm + spacingYmm) : yMm,
                widthMm: labelWidthMm,
                heightMm: labelHeightMm,
            });
        });

        rowHeightMm = Math.max(rowHeightMm, groupHeightMm);
        xMm += groupWidthMm + spacingXmm;
    }

    return pages;
};
