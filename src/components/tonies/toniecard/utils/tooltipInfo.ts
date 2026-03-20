import { toModelKey } from "../../hooks/useCustomModelKeys";
import { TooltipInfo } from "../TonieCardTypes";

export const normalized = (v?: string) => (v || "").trim().toLowerCase();

const mergeInfo = (...parts: Array<TooltipInfo | undefined>) =>
    parts.reduce<TooltipInfo>((acc, part) => ({ ...acc, ...(part || {}) }), {});

type GetInfoForTooltipParams = {
    kind: "model" | "audio";
    modelName: string;
    selectedModel: string;
    tonieModel: string;
    resolvedAudioModel: string;
    sourceModel: string;
    tooltipInfoByModel: Record<string, TooltipInfo>;
    modelInfoFromTonie: TooltipInfo;
    audioInfoFromSource: TooltipInfo;
    infoForModelTooltip: TooltipInfo;
};

export const getInfoForTooltip = ({
    kind,
    modelName,
    selectedModel,
    tonieModel,
    resolvedAudioModel,
    sourceModel,
    tooltipInfoByModel,
    modelInfoFromTonie,
    audioInfoFromSource,
    infoForModelTooltip,
}: GetInfoForTooltipParams) => {
    const normalizedModel = toModelKey(modelName);
    if (!normalizedModel) return undefined;

    const tonieModelKey = toModelKey(selectedModel || tonieModel || "");
    const sourceModelKey = toModelKey(resolvedAudioModel || sourceModel || "");
    const fetchedInfo = tooltipInfoByModel[normalizedModel];

    if (kind === "model") {
        return mergeInfo(audioInfoFromSource, fetchedInfo, modelInfoFromTonie);
    }
    if (normalizedModel === sourceModelKey) {
        return mergeInfo(fetchedInfo, audioInfoFromSource, infoForModelTooltip);
    }
    if (normalizedModel === tonieModelKey) {
        return mergeInfo(fetchedInfo, infoForModelTooltip, audioInfoFromSource);
    }
    return mergeInfo(fetchedInfo, infoForModelTooltip, audioInfoFromSource);
};
