import { useEffect, useState } from "react";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { Record } from "../../../../types/fileBrowserTypes";
import { ValidateStatus } from "../TonieCardTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

type UseAssignSiblingEpisodeParams = {
    source: string;
    onSelectedSourceChange: (value: string) => void;
    setInputValidationSource: (state: { validateStatus: ValidateStatus; help: string }) => void;
};

/**
 * Determines and assigns the next/previous file
 * (alphabetically, no wrap-around)
 * in the library folder of the Tonies/tags currently assigned source file,
 * excluding audio id named files.
 */
export const useAssignSiblingEpisode = ({
    source,
    onSelectedSourceChange,
    setInputValidationSource,
}: UseAssignSiblingEpisodeParams) => {
    const [nextFile, setNextFile] = useState<Record | null>(null);
    const [prevFile, setPrevFile] = useState<Record | null>(null);
    const [folder, setFolder] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const libPath = source.replace(/^lib:\/\//, "");
        const lastSlash = libPath.lastIndexOf("/");
        const sourceFolder = lastSlash >= 0 ? libPath.slice(0, lastSlash) : "";
        const currentFileName = lastSlash >= 0 ? libPath.slice(lastSlash + 1) : libPath;

        setFolder(sourceFolder);
        setLoading(true);

        let cancelled = false;

        api.apiGetTeddyCloudApiRaw(
            `/api/fileIndexV2?path=${encodeURIComponent(sourceFolder)}&special=library`,
        )
            .then((response) => response.json())
            .then((data: any) => {
                if (cancelled) return;

                const siblingFiles: Record[] = ((data.files || []) as Record[])
                    .filter((file) => !file.isDir && file.name !== file.tafHeader.audioId + ".taf")
                    .sort((a, b) => a.name.localeCompare(b.name));

                const currentIndex = siblingFiles.findIndex(
                    (file) => file.name === currentFileName,
                );

                if (currentIndex >= 0) {
                    const nextCandidates = siblingFiles.slice(currentIndex + 1);
                    const prevCandidates = siblingFiles.slice(0, currentIndex).reverse();

                    setNextFile(nextCandidates.find((file) => !file.listened) || null);
                    setPrevFile(prevCandidates.find((file) => !file.listened) || null);
                } else {
                    setNextFile(siblingFiles.find((file) => !file.listened) || null);
                    setPrevFile(null);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setNextFile(null);
                    setPrevFile(null);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [source]);

    const assignEpisode = (file: Record | null) => {
        if (!file) return;

        onSelectedSourceChange(`lib://${folder}/${file.name}`);
        setInputValidationSource({
            validateStatus: "",
            help: "",
        });
    };

    const handleAssignNextEpisode = () => {
        assignEpisode(nextFile);
    };

    const handleAssignPrevEpisode = () => {
        assignEpisode(prevFile);
    };

    return {
        nextEpisodeAvailable: Boolean(nextFile),
        prevEpisodeAvailable: Boolean(prevFile),
        nextEpisodeFile: nextFile,
        prevEpisodeFile: prevFile,
        loading,
        handleAssignNextEpisode,
        handleAssignPrevEpisode,
    };
};
