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
        record: any,
        baseApiUrl: string,
        path: string,
        special: string,
        overlay?: string
    ) => {
        const fileUrl =
            encodeURI(baseApiUrl + "/content" + decodeURIComponent(path) + "/" + record.name) +
            "?ogg=true&special=" +
            special +
            (overlay ? `&overlay=${overlay}` : "");

        const fileName =
            (record.tonieInfo?.series ? record.tonieInfo.series : "") +
            (record.tonieInfo?.episode ? " - " + record.tonieInfo.episode : "");

        setDownloading((prev) => ({ ...prev, [record.name]: true }));

        try {
            await handleDownload(fileUrl, fileName);
        } finally {
            setDownloading((prev) => ({ ...prev, [record.name]: false }));
        }
    };

    return { handleFileDownload };
}
