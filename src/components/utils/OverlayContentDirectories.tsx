import { useState, useEffect } from "react";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export const useTonieboxContent = (linkOverlay?: string | null) => {
    const [tonieBoxContentDirs, setTonieboxContentDirs] = useState<Array<[string, string[], string]>>([]);
    const [overlay, setOverlay] = useState(() => {
        if (linkOverlay !== undefined) {
            if (linkOverlay !== null) {
                localStorage.setItem("contentOverlay", linkOverlay);
                return linkOverlay;
            } else {
                const savedOverlay = localStorage.getItem("contentOverlay");
                return savedOverlay ? savedOverlay : "";
            }
        } else {
            const savedOverlay = localStorage.getItem("contentOverlay");
            return savedOverlay ? savedOverlay : "";
        }
    });

    useEffect(() => {
        const fetchContentDirs = async () => {
            const tonieboxData = await api.apiGetTonieboxesIndex();
            const tonieboxContentDirs = await Promise.all(
                tonieboxData.map(async (toniebox) => {
                    const contentDir = await api.apiGetTonieboxContentDir(toniebox.ID);
                    return [contentDir, toniebox.boxName, toniebox.ID] as [string, string, string];
                })
            );
            const groupedContentDirs: [string, string[], string][] = tonieboxContentDirs.reduce(
                (acc: [string, string[], string][], [contentDir, boxName, boxID]) => {
                    const existingGroupIndex = acc.findIndex((group) => group[0] === contentDir);
                    if (existingGroupIndex !== -1) {
                        acc[existingGroupIndex][1].push(boxName);
                        if (overlay === boxID) {
                            setOverlay(acc[existingGroupIndex][2]);
                        }
                    } else {
                        acc.push([contentDir, [boxName], boxID]);
                    }
                    return acc;
                },
                []
            );
            const contentDir = await api.apiGetTonieboxContentDir("");
            const existingGroupIndex = groupedContentDirs.findIndex((group) => group[0] === contentDir);
            if (existingGroupIndex === -1) {
                groupedContentDirs.push(["", ["TeddyCloud Default Content Dir"], ""]);
            }

            const updatedContentDirs: [string, string[], string][] = groupedContentDirs.map(
                ([contentDir, boxNames, boxId]) => [contentDir, boxNames, boxId]
            );

            if (overlay === "" || overlay === null || overlay === undefined) {
                const firstBoxId = updatedContentDirs.length > 0 ? updatedContentDirs[0][2] : "";
                setOverlay(firstBoxId);
                localStorage.setItem("contentOverlay", firstBoxId);
            }
            setTonieboxContentDirs(updatedContentDirs);
        };
        fetchContentDirs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelectChange = (overlay: string) => {
        setOverlay(overlay);
        localStorage.setItem("contentOverlay", overlay);
    };

    return { tonieBoxContentDirs, overlay, handleSelectChange };
};
