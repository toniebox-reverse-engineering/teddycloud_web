const pad2 = (value: number): string => String(value).padStart(2, "0");

const revokeObjectUrlLater = (url: string, delayMs = 5 * 60 * 1000) => {
    window.setTimeout(() => URL.revokeObjectURL(url), delayMs);
};

const downloadObjectUrl = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
};

/**
 * Generates a filesystem-safe local timestamp for TeddyStudio PDF exports.
 * Example: teddystudio_labels_2026-10-17_08-49-48.pdf
 */
export const createTeddyStudioPdfFilename = (date = new Date()): string =>
    `teddystudio_labels_${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}_${pad2(
        date.getHours(),
    )}-${pad2(date.getMinutes())}-${pad2(date.getSeconds())}.pdf`;

export const downloadPdfBlob = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    downloadObjectUrl(url, filename);
    revokeObjectUrlLater(url);
};

export type PrintPdfBlobResult = "printed" | "opened" | "downloaded";

/**
 * Loads the finished PDF into a hidden iframe and asks the browser to print that PDF directly.
 * If the embedded PDF viewer cannot be printed, the PDF is opened in a new tab instead. If that
 * popup is blocked as well, the PDF is downloaded as the final fallback.
 */
export const printPdfBlob = (
    blob: Blob,
    filename: string,
    options: {
        loadTimeoutMs?: number;
        printDelayMs?: number;
    } = {},
): Promise<PrintPdfBlobResult> => {
    const { loadTimeoutMs = 10000, printDelayMs = 300 } = options;
    const url = URL.createObjectURL(blob);

    return new Promise((resolve) => {
        const iframe = document.createElement("iframe");
        let finished = false;
        let loadTimeout: number | undefined;
        let printTimer: number | undefined;

        iframe.style.position = "fixed";
        iframe.style.left = "-10000px";
        iframe.style.top = "-10000px";
        iframe.style.width = "1px";
        iframe.style.height = "1px";
        iframe.style.border = "0";
        iframe.style.opacity = "0";
        iframe.style.pointerEvents = "none";
        iframe.setAttribute("aria-hidden", "true");

        const removeFrame = () => {
            if (loadTimeout !== undefined) {
                window.clearTimeout(loadTimeout);
            }
            if (printTimer !== undefined) {
                window.clearTimeout(printTimer);
            }
            iframe.remove();
        };

        const finish = (result: PrintPdfBlobResult) => {
            if (finished) return;
            finished = true;
            resolve(result);
        };

        const fallback = () => {
            if (finished) return;
            removeFrame();

            const printWindow = window.open(url, "_blank");
            if (printWindow) {
                try {
                    printWindow.opener = null;
                } catch {
                    // The PDF is already open. Nothing else is required here.
                }
                revokeObjectUrlLater(url);
                finish("opened");
                return;
            }

            downloadObjectUrl(url, filename);
            revokeObjectUrlLater(url);
            finish("downloaded");
        };

        iframe.onload = () => {
            if (finished) return;
            if (loadTimeout !== undefined) {
                window.clearTimeout(loadTimeout);
                loadTimeout = undefined;
            }

            printTimer = window.setTimeout(() => {
                try {
                    const frameWindow = iframe.contentWindow;
                    if (!frameWindow) {
                        fallback();
                        return;
                    }

                    frameWindow.addEventListener(
                        "afterprint",
                        () => {
                            removeFrame();
                            URL.revokeObjectURL(url);
                        },
                        { once: true },
                    );

                    frameWindow.focus();
                    frameWindow.print();

                    // Some PDF viewers do not emit afterprint. Keep the object URL alive long
                    // enough for the viewer and clean it up later as a fallback.
                    window.setTimeout(
                        () => {
                            removeFrame();
                            URL.revokeObjectURL(url);
                        },
                        5 * 60 * 1000,
                    );

                    finish("printed");
                } catch {
                    fallback();
                }
            }, printDelayMs);
        };

        iframe.onerror = fallback;
        loadTimeout = window.setTimeout(fallback, loadTimeoutMs);

        document.body.appendChild(iframe);
        iframe.src = url;
    });
};
