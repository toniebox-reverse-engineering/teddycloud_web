import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { TeddyCloudApi } from "../api";
import { defaultAPIConfig } from "../config/defaultApiConfig";
import { TonieCardProps } from "../types/tonieTypes";
import { useTeddyCloud } from "../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../types/teddyCloudNotificationTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

type LanguageCounts = Record<string, number>;

interface UseToniesOptions {
    overlay?: string;
    merged?: boolean;
    shuffle?: boolean;
    sort?: (a: TonieCardProps, b: TonieCardProps) => number;
    includeHidden?: boolean;
    filter?: string;
}

export const useTonies = (options: UseToniesOptions = {}) => {
    const { overlay = "", merged = true, shuffle = false, sort, includeHidden = false, filter = undefined } = options;

    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();

    const [tonies, setTonies] = useState<TonieCardProps[]>([]);
    const [defaultLanguage, setDefaultLanguage] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchTonies = async () => {
            setLoading(true);

            try {
                let tonieData: TonieCardProps[];

                if (merged) {
                    tonieData = await api.apiGetTagIndexMergedAllOverlays(true);
                } else {
                    tonieData = await api.apiGetTagIndex(overlay ?? "", true);
                }

                if (!includeHidden) {
                    tonieData = tonieData.filter((item) => !item.hide);
                }

                if (filter) {
                    tonieData = tonieData.filter((item) => item.type === filter);
                }

                if (sort) {
                    tonieData = [...tonieData].sort(sort);
                }

                if (shuffle) {
                    tonieData = [...tonieData].sort(() => Math.random() - 0.5);
                }

                setTonies(tonieData);
            } catch (error) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("tonies.errorFetchingTonies"),
                    t("tonies.errorFetchingTonies") + ": " + error,
                    t("tonies.navigationTitle")
                );
            } finally {
                setLoading(false);
            }
        };

        fetchTonies();
    }, [overlay]);

    useEffect(() => {
        const counts: LanguageCounts = {};

        tonies.forEach((tonie) => {
            const lang = tonie.tonieInfo?.language;
            if (!lang) return;
            counts[lang] = (counts[lang] || 0) + 1;
        });

        let maxLang = "";
        let maxCount = 0;

        for (const [lang, count] of Object.entries(counts)) {
            if (count > maxCount) {
                maxCount = count;
                maxLang = lang;
            }
        }

        setDefaultLanguage(maxLang);
    }, [tonies]);

    return { tonies, defaultLanguage, loading, setTonies };
};
