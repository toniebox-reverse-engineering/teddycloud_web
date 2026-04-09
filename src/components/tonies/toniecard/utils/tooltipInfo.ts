import { toModelKey } from "../../hooks/useCustomModelKeys";
import { TooltipInfo } from "../TonieCardTypes";

export const normalized = (v?: string) => (v || "").trim().toLowerCase();

const mergeInfo = (...parts: Array<TooltipInfo | undefined>) =>
    parts.reduce<TooltipInfo>((acc, part) => ({ ...acc, ...(part || {}) }), {});

type GetInfoForTooltipParams = {
    kind: "model" | "audio";
    modelName: string;
    tooltipInfoByModel: Record<string, TooltipInfo>;
    modelInfoFromTonie: TooltipInfo;
    audioInfoFromSource: TooltipInfo;
};

export const getInfoForTooltip = ({
    kind,
    modelName,
    tooltipInfoByModel,
    modelInfoFromTonie,
    audioInfoFromSource,
}: GetInfoForTooltipParams) => {
    const normalizedModel = toModelKey(modelName);
    if (!normalizedModel) return undefined;

    const fetchedInfo = tooltipInfoByModel[normalizedModel];

    if (kind === "model") {
        return mergeInfo(fetchedInfo, modelInfoFromTonie);
    }
    return mergeInfo(fetchedInfo, audioInfoFromSource);
};
