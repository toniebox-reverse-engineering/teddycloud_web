import { useState, useEffect } from "react";
import { TeddyCloudApi } from "../api";
import { defaultAPIConfig } from "../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export type TonieBoxContentDir = [string, string[], string];

export const useTonieboxContent = (linkOverlay?: string | null) => {
    const [tonieBoxContentDirs, setTonieboxContentDirs] = useState<TonieBoxContentDir[]>([]);

    const [overlay, setOverlay] = useState<string>(() => {
        if (linkOverlay !== undefined && linkOverlay !== null) {
            localStorage.setItem("contentOverlay", linkOverlay);
            return linkOverlay;
        }

        const savedOverlay = localStorage.getItem("contentOverlay");
        return savedOverlay ?? "";
    });

    useEffect(() => {
        const fetchContentDirs = async () => {
            const tonieboxData = await api.apiGetTonieboxesIndex();

            const tonieboxContentDirsRaw: [string, string, string][] = await Promise.all(
                tonieboxData.map(async (toniebox) => {
                    const contentDir = await api.apiGetTonieboxContentDir(toniebox.ID);
                    return [contentDir, toniebox.boxName, toniebox.ID] as [string, string, string];
                })
            );

            const groupedContentDirs: TonieBoxContentDir[] = tonieboxContentDirsRaw.reduce(
                (acc: TonieBoxContentDir[], [contentDir, boxName, boxID]) => {
                    const existingGroupIndex = acc.findIndex((group) => group[0] === contentDir);
                    if (existingGroupIndex !== -1) {
                        acc[existingGroupIndex][1].push(boxName);
                        if (overlay === boxID) {
                            // overlay auf gruppierte ID normalisieren
                            setOverlay(acc[existingGroupIndex][2]);
                        }
                    } else {
                        acc.push([contentDir, [boxName], boxID]);
                    }
                    return acc;
                },
                []
            );

            const defaultContentDir = await api.apiGetTonieboxContentDir("");
            const hasDefaultDir = groupedContentDirs.some((group) => group[0] === defaultContentDir);

            if (!hasDefaultDir) {
                groupedContentDirs.push(["", ["TeddyCloud Default Content Dir"], ""]);
            }

            if (!overlay) {
                const firstBoxId: string = groupedContentDirs.length > 0 ? groupedContentDirs[0][2] : "";
                setOverlay(firstBoxId);
                localStorage.setItem("contentOverlay", firstBoxId);
            }

            setTonieboxContentDirs(groupedContentDirs);
        };

        fetchContentDirs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleContentOverlayChange = (nextOverlay: string) => {
        setOverlay(nextOverlay);
        localStorage.setItem("contentOverlay", nextOverlay);
    };

    return { tonieBoxContentDirs, overlay, handleContentOverlayChange };
};
