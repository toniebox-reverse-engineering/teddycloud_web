import { useTranslation } from "react-i18next";

import { Record as tafRecord } from "../../../../types/fileBrowserTypes";
import { triggerBrowserDownload, toSameOriginUrl } from "../../../../utils/downloads/tafDownload";
import { sanitizeDownloadName } from "../../../../utils/files/sanitizeDownloadName";
import { withBase } from "../../../../utils/basePath";
import { useTeddyCloud } from "../../../../provider/TeddyCloudProvider";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { describeDownloadError } from "../../common/utils/downloadError";

interface UseFileDownloadParams {
    setDownloading: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function useFileDownload({ setDownloading }: UseFileDownloadParams) {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();

    const handleFileDownload = async (
        record: tafRecord,
        path: string,
        special: string,
        overlay?: string,
    ) => {
        const fileUrl =
            encodeURI("/content/" + decodeURIComponent(path) + "/" + record.name) +
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
            await triggerBrowserDownload(
                withBase(toSameOriginUrl(fileUrl)),
                sanitizeDownloadName(fileName),
            );
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("fileBrowser.messages.downloadFailed"),
                `${t("fileBrowser.messages.downloadFailedDetails", { file: record.name })}: ${describeDownloadError(error)}`,
                t("fileBrowser.title"),
            );
        } finally {
            setDownloading((prev) => ({ ...prev, [record.name]: false }));
        }
    };

    return { handleFileDownload };
}
