import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { useTeddyCloud } from "../../../../provider/TeddyCloudProvider";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { Record } from "../../../../types/fileBrowserTypes";
import { TonieCardProps } from "../../../../types/tonieTypes";
import { useAssignSourceToTonie } from "../../common/hooks/useAssignSourceToTonie";

const api = new TeddyCloudApi(defaultAPIConfig());

type UseAssignNextEpisodeParams = {
    tonieCard: TonieCardProps;
    overlay: string;
    /** Skip fetching the folder listing entirely, e.g. for read-only card usages. */
    enabled: boolean;
    fetchUpdatedTonieCard: () => Promise<void>;
};

/**
 * Determines and assigns the next not-yet-listened file (alphabetically, no wrap-around)
 * in the library folder of the Tonie's currently assigned source file.
 */
export const useAssignNextEpisode = ({
    tonieCard,
    overlay,
    enabled,
    fetchUpdatedTonieCard,
}: UseAssignNextEpisodeParams) => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();
    const { assignSourceToTonie } = useAssignSourceToTonie();

    const [nextFile, setNextFile] = useState<Record | null>(null);
    const [folder, setFolder] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const source = tonieCard.source || "";
        if (!enabled || !source.startsWith("lib://")) {
            setNextFile(null);
            setFolder("");
            return;
        }

        const libPath = source.replace(/^lib:\/\//, "");
        const lastSlash = libPath.lastIndexOf("/");
        const sourceFolder = lastSlash >= 0 ? libPath.slice(0, lastSlash) : "";
        const currentFileName = lastSlash >= 0 ? libPath.slice(lastSlash + 1) : libPath;

        setFolder(sourceFolder);
        setLoading(true);

        let cancelled = false;
        api.apiGetTeddyCloudApiRaw(
            `/api/fileIndexV2?path=${sourceFolder}&special=library` +
                (overlay ? `&overlay=${overlay}` : ""),
        )
            .then((response) => response.json())
            .then((data: any) => {
                if (cancelled) return;

                const siblingFiles: Record[] = ((data.files || []) as Record[])
                    .filter((file) => !file.isDir)
                    .sort((a, b) => a.name.localeCompare(b.name));

                const currentIndex = siblingFiles.findIndex((file) => file.name === currentFileName);
                const candidates =
                    currentIndex >= 0 ? siblingFiles.slice(currentIndex + 1) : siblingFiles;

                setNextFile(candidates.find((file) => !file.listened) || null);
            })
            .catch(() => {
                if (!cancelled) setNextFile(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [tonieCard.source, overlay, enabled]);

    const handleAssignNextEpisode = async () => {
        if (!nextFile) return;

        try {
            await assignSourceToTonie(tonieCard, `lib://${folder}/${nextFile.name}`, overlay);
            addNotification(
                NotificationTypeEnum.Success,
                t("tonies.assignNextEpisode.successMessage"),
                t("tonies.assignNextEpisode.successDetails", { episode: nextFile.name }),
                t("tonies.title"),
            );
            await fetchUpdatedTonieCard();
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.assignNextEpisode.failedMessage"),
                t("tonies.assignNextEpisode.failedDetails", { episode: nextFile.name }) + error,
                t("tonies.title"),
            );
        }
    };

    return {
        nextEpisodeAvailable: Boolean(nextFile),
        loading,
        handleAssignNextEpisode,
    };
};
