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
        console.log("handleFileDownload", record, path, special, overlay);
        const params = new URLSearchParams();
        if (record.name.toLowerCase().endsWith(".taf")) {
            params.set("ogg", "true");
        }
        if (special) {
            params.set("special", special);
        }
        if (overlay) {
            params.set("overlay", overlay);
        }
        const query = params.toString();

        const fileUrl =
            encodeURI("/content/" + decodeURIComponent(path) + "/" + record.name) +
            (query ? `?${query}` : "");

        const isTaf = record.name.toLowerCase().endsWith(".taf");

        const tonieName = [record.tonieInfo?.series, record.tonieInfo?.episode]
            .filter(Boolean)
            .join(" - ");

        const fileName = isTaf
            ? `${tonieName || record.name.replace(/\.taf$/i, "")}.ogg`
            : record.name;

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
