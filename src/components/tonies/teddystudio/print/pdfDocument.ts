export interface PdfPageImage {
    jpeg: Uint8Array;
    pixelWidth: number;
    pixelHeight: number;
    widthPt: number;
    heightPt: number;
}

const encoder = new TextEncoder();

const ascii = (value: string): Uint8Array => encoder.encode(value);

const concatBytes = (chunks: Uint8Array[]): Uint8Array => {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    chunks.forEach((chunk) => {
        result.set(chunk, offset);
        offset += chunk.length;
    });

    return result;
};

const formatNumber = (value: number): string => {
    const rounded = Math.round(value * 1000) / 1000;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(3).replace(/0+$/, "");
};

/**
 * Minimal PDF writer for page-sized JPEG images. This intentionally has no runtime dependency on
 * a PDF library: the page geometry is fixed in PDF points and the browser is only used to create
 * the page bitmap, not to lay out or print HTML.
 */
export const buildPdfFromJpegPages = (pages: PdfPageImage[]): Uint8Array => {
    if (pages.length === 0) {
        throw new Error("Cannot build an empty PDF.");
    }

    const objectCount = 2 + pages.length * 3;
    const objectChunks: Uint8Array[][] = Array.from({ length: objectCount + 1 }, () => []);

    objectChunks[1] = [
        ascii("<< /Type /Catalog /Pages 2 0 R /ViewerPreferences << /PrintScaling /None >> >>"),
    ];

    const pageObjectIds = pages.map((_, index) => 3 + index * 3);
    objectChunks[2] = [
        ascii(
            `<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectIds
                .map((id) => `${id} 0 R`)
                .join(" ")}] >>`,
        ),
    ];

    pages.forEach((page, index) => {
        const pageObjectId = 3 + index * 3;
        const imageObjectId = pageObjectId + 1;
        const contentObjectId = pageObjectId + 2;
        const pageWidth = formatNumber(page.widthPt);
        const pageHeight = formatNumber(page.heightPt);

        objectChunks[pageObjectId] = [
            ascii(
                `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
                    `/Resources << /XObject << /Im0 ${imageObjectId} 0 R >> >> ` +
                    `/Contents ${contentObjectId} 0 R >>`,
            ),
        ];

        objectChunks[imageObjectId] = [
            ascii(
                `<< /Type /XObject /Subtype /Image /Width ${page.pixelWidth} /Height ${page.pixelHeight} ` +
                    `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`,
            ),
            page.jpeg,
            ascii("\nendstream"),
        ];

        const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n` + "/Im0 Do\n" + "Q\n";
        const contentBytes = ascii(content);
        objectChunks[contentObjectId] = [
            ascii(`<< /Length ${contentBytes.length} >>\nstream\n`),
            contentBytes,
            ascii("endstream"),
        ];
    });

    const chunks: Uint8Array[] = [ascii("%PDF-1.4\n")];
    const offsets = new Array<number>(objectCount + 1).fill(0);
    let byteOffset = chunks[0].length;

    for (let objectId = 1; objectId <= objectCount; objectId++) {
        offsets[objectId] = byteOffset;
        const header = ascii(`${objectId} 0 obj\n`);
        const footer = ascii("\nendobj\n");
        const body = objectChunks[objectId];

        chunks.push(header, ...body, footer);
        byteOffset +=
            header.length + body.reduce((sum, chunk) => sum + chunk.length, 0) + footer.length;
    }

    const xrefOffset = byteOffset;
    const xrefLines = ["xref", `0 ${objectCount + 1}`, "0000000000 65535 f "];
    for (let objectId = 1; objectId <= objectCount; objectId++) {
        xrefLines.push(`${String(offsets[objectId]).padStart(10, "0")} 00000 n `);
    }

    const trailer =
        `${xrefLines.join("\n")}\n` +
        `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\n` +
        `startxref\n${xrefOffset}\n%%EOF\n`;
    chunks.push(ascii(trailer));

    return concatBytes(chunks);
};
