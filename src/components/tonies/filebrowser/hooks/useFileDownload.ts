import { Record as tafRecord } from "../../../../types/fileBrowserTypes";
import { triggerBrowserDownload, toSameOriginUrl } from "../../../../utils/downloads/tafDownload";
import { sanitizeDownloadName } from "../../../../utils/files/sanitizeDownloadName";
import { backendUrl } from "../../../../utils/basePath";

interface UseFileDownloadParams {
    setDownloading: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function useFileDownload({ setDownloading }: UseFileDownloadParams) {
    const handleFileDownload = async (
        record: tafRecord,
        path: string,
        special: string,
        overlay?: string,
    ) => {
        const fileUrl =
            encodeURI(backendUrl("/content/" + decodeURIComponent(path) + "/" + record.name)) +
            "?" +
            (record.name.toLowerCase().endsWith(".taf") ? "ogg=true&" : "") +
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
            await triggerBrowserDownload(toSameOriginUrl(fileUrl), sanitizeDownloadName(fileName));
        } finally {
            setDownloading((prev) => ({ ...prev, [record.name]: false }));
        }
    };

    return { handleFileDownload };
}
