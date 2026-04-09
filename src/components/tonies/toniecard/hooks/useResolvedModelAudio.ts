import { useEffect, useState } from "react";
import { resolveAudioSourceToModel, resolveModelAudioTarget } from "../../../../utils/teddycloud/modelAudioResolution";

type UseResolvedModelAudioParams = {
    isEditModalOpen: boolean;
    selectedModel: string;
    selectedSource: string;
    overlay: string;
};

export const useResolvedModelAudio = ({
    isEditModalOpen,
    selectedModel,
    selectedSource,
    overlay,
}: UseResolvedModelAudioParams) => {
    const [modelAudioPath, setModelAudioPath] = useState<string | null>(null);
    const [modelAudioHasMapping, setModelAudioHasMapping] = useState<boolean>(false);
    const [resolvedAudioModel, setResolvedAudioModel] = useState<string>("");

    useEffect(() => {
        if (!isEditModalOpen || !selectedModel?.trim()) {
            setModelAudioPath(null);
            setModelAudioHasMapping(false);
            return;
        }
        let cancelled = false;
        void resolveModelAudioTarget(selectedModel.trim(), overlay).then((result) => {
            if (!cancelled) {
                setModelAudioPath(result.path);
                setModelAudioHasMapping(result.hasMapping);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [isEditModalOpen, selectedModel, overlay]);

    useEffect(() => {
        if (!isEditModalOpen) {
            setResolvedAudioModel("");
            return;
        }
        const sourceToResolve = (selectedSource || "").trim();
        if (!sourceToResolve) {
            setResolvedAudioModel("");
            return;
        }
        let cancelled = false;
        void resolveAudioSourceToModel(sourceToResolve, overlay).then((model) => {
            if (!cancelled) setResolvedAudioModel((model || "").trim());
        });
        return () => {
            cancelled = true;
        };
    }, [isEditModalOpen, selectedSource, overlay]);

    return {
        modelAudioPath,
        modelAudioHasMapping,
        resolvedAudioModel,
    };
};
