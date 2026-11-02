/**
 * Short, user-facing reason for a failed download: the HTTP status for error responses,
 * otherwise the underlying error message.
 */
export const describeDownloadError = (error: unknown): string => {
    const response = (error as { response?: Response } | null)?.response;
    if (response && typeof response.status === "number") {
        return `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;
    }

    const cause = (error as { cause?: unknown } | null)?.cause;
    if (cause instanceof Error && cause.message) {
        return cause.message;
    }

    return error instanceof Error ? error.message : String(error);
};
