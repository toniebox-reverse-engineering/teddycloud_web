import { Record as tafRecord } from "../../../../types/fileBrowserTypes";

interface UseFileDownloadParams {
    setDownloading: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function useFileDownload({ setDownloading }: UseFileDownloadParams) {
    const handleDownload = async (url: string, filename: string) => {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    };

    const handleFileDownload = async (
        record: tafRecord,
        baseApiUrl: string,
        path: string,
        special: string,
        overlay?: string
    ) => {
        const fileUrl =
            encodeURI(baseApiUrl + "/content/" + decodeURIComponent(path) + "/" + record.name) +
            "?" +
            (record.name.endsWith(".taf") ? "ogg=true&" : "") +
            "special=" +
            special +
            (overlay ? `&overlay=${overlay}` : "");

        let fileName =
            record.tonieInfo?.series || record.tonieInfo?.episode
                ? `${record.tonieInfo.series || ""}${record.tonieInfo.episode ? " - " + record.tonieInfo.episode : ""}`
                : record.name;

        if (!record.tonieInfo?.series && !record.tonieInfo?.episode && fileName.endsWith(".taf")) {
            fileName = fileName.replace(/\.taf$/i, ".ogg");
        }

        setDownloading((prev) => ({ ...prev, [record.name]: true }));

        try {
            await handleDownload(fileUrl, fileName);
        } finally {
            setDownloading((prev) => ({ ...prev, [record.name]: false }));
        }
    };

    return { handleFileDownload };
}
