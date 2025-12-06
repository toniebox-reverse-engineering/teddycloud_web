import { useEffect, useState } from "react";
import { TeddyCloudApi, StatsList } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export const useStats = (pollIntervalMs: number = 10_000) => {
    const [stats, setStats] = useState<StatsList | undefined>();

    useEffect(() => {
        let isCancelled = false;

        const fetchStats = async () => {
            try {
                const statsRequest = (await api.apiStatsGet()) as StatsList;
                if (!isCancelled && statsRequest?.stats?.length && statsRequest.stats.length > 0) {
                    setStats(statsRequest);
                }
            } catch {
                // we ignore errors
            }
        };

        // Initial
        fetchStats();

        // Polling
        const interval = setInterval(fetchStats, pollIntervalMs);

        return () => {
            isCancelled = true;
            clearInterval(interval);
        };
    }, [pollIntervalMs]);

    return stats;
};
