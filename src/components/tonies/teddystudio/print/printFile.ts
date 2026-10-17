const pad2 = (value: number): string => String(value).padStart(2, "0");

/**
 * Generates a filesystem-safe local timestamp for TeddyStudio PDF exports.
 * Example: teddystudio_labels_2026-10-17_08-49-48.pdf
 */
export const createTeddyStudioPdfFilename = (date = new Date()): string =>
    `teddystudio_labels_${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}_${pad2(
        date.getHours(),
    )}-${pad2(date.getMinutes())}-${pad2(date.getSeconds())}.pdf`;
