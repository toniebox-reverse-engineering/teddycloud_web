import { useCallback, useState } from "react";

import { Record } from "../../../../types/fileBrowserTypes";
import type { CustomModelEditorAudioSource } from "../../custommodel/CustomModelEditor";

type UseTafMetaEditorArgs = {
    special: string;
    setRebuildList: React.Dispatch<React.SetStateAction<boolean>>;
};

export const hasTafMeta = (record: Record) =>
    !record.isDir && record.tafHeader?.audioId != null && !!record.tafHeader?.sha1Hash;

export const useTafMetaEditor = ({ special, setRebuildList }: UseTafMetaEditorArgs) => {
    const [isTafMetaEditorModalOpen, setIsTafMetaEditorModalOpen] = useState(false);
    const [tafMetaAudioSource, setTafMetaAudioSource] = useState<CustomModelEditorAudioSource>();

    const openTafMetaEditor = useCallback(
        (path: string, record: Record) => {
            if (!hasTafMeta(record)) return;
            const decodedPath = path
                .split("/")
                .filter(Boolean)
                .map((segment) => decodeURIComponent(segment))
                .join("/");
            setTafMetaAudioSource({
                fileName: record.name,
                audioId: String(record.tafHeader.audioId).trim(),
                hash: String(record.tafHeader.sha1Hash).trim(),
                path:
                    special === "library"
                        ? `lib://${decodedPath ? `${decodedPath}/` : ""}${record.name}`
                        : undefined,
                trackSeconds: record.tafHeader.trackSeconds,
                lengthSeconds: record.tafHeader.lengthSeconds,
                tonieInfo: record.tonieInfo,
            });
            setIsTafMetaEditorModalOpen(true);
        },
        [special],
    );

    const closeTafMetaEditor = useCallback(() => {
        setIsTafMetaEditorModalOpen(false);
    }, []);

    const onTafMetaSaved = useCallback(() => {
        setRebuildList((prev) => !prev);
    }, [setRebuildList]);

    return {
        isTafMetaEditorModalOpen,
        tafMetaAudioSource,
        openTafMetaEditor,
        closeTafMetaEditor,
        onTafMetaSaved,
    };
};
