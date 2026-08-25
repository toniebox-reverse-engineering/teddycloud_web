import { useEffect, useState } from "react";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../../../api";
import { toModelKey } from "../../hooks/useCustomModelKeys";
import { TooltipInfo } from "../TonieCardTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

type UseTooltipInfoByModelParams = {
    isEditModalOpen: boolean;
    selectedModel: string;
    resolvedAudioModel: string;
    overlay: string;
};

export const useTooltipInfoByModel = ({
    isEditModalOpen,
    selectedModel,
    resolvedAudioModel,
    overlay,
}: UseTooltipInfoByModelParams) => {
    const [tooltipInfoByModel, setTooltipInfoByModel] = useState<Record<string, TooltipInfo>>({});

    useEffect(() => {
        if (!isEditModalOpen) return;
        const candidates = [toModelKey(selectedModel), toModelKey(resolvedAudioModel)].filter(
            Boolean,
        );
        const pending = Array.from(new Set(candidates)).filter((key) => !tooltipInfoByModel[key]);
        if (pending.length === 0) return;

        let cancelled = false;
        void (async () => {
            const fetched = await Promise.all(
                pending.map(async (key) => {
                    try {
                        const response = await api.apiGetTeddyCloudApiRaw(
                            `/api/toniesJsonSearch?searchModel=${encodeURIComponent(key)}&searchSeries=&searchEpisode=`,
                            overlay,
                        );
                        const data = await response.json();
                        const entries = Array.isArray(data) ? data : [];
                        const exact = entries.find(
                            (entry: { model?: string }) => toModelKey(entry?.model) === key,
                        );
                        if (!exact) return [key, undefined] as const;
                        const info: TooltipInfo = {
                            model: String(exact.model || "").trim(),
                            series: String(exact.series || "").trim(),
                            episode: String(exact.episode || exact.episodes || "").trim(),
                            no: String(exact.no || "").trim(),
                            title: String(exact.title || "").trim(),
                            release: String(exact.release || "").trim(),
                            language: String(exact.language || "").trim(),
                            category: String(exact.category || "").trim(),
                        };
                        return [key, info] as const;
                    } catch {
                        return [key, undefined] as const;
                    }
                }),
            );
            if (cancelled) return;
            setTooltipInfoByModel((prev) => {
                const next = { ...prev };
                for (const [key, info] of fetched) {
                    if (info) next[key] = info;
                }
                return next;
            });
        })();

        return () => {
            cancelled = true;
        };
    }, [isEditModalOpen, selectedModel, resolvedAudioModel, overlay, tooltipInfoByModel]);

    return { tooltipInfoByModel };
};
