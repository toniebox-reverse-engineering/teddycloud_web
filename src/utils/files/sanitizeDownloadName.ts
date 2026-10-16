export function sanitizeDownloadName(name: string): string {
    const cleaned = name
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
        .replace(/[. ]+$/g, "")
        .trim();
    return cleaned || "download";
}

export function padTrackNumber(index: number): string {
    return String(index).padStart(2, "0");
}
