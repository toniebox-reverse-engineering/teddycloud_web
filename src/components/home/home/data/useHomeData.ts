import { useEffect, useState } from "react";
import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { useNewBoxesAllowed } from "../../../../hooks/getsettings/useGetSettingNewBoxesAllowed";
import { useTonieboxes } from "../../../../hooks/useTonieboxes";
import { useTonies } from "../../../../hooks/useTonies";

const api = new TeddyCloudApi(defaultAPIConfig());

export const useHomeData = () => {
    const { tonieboxes, loading: loadingTonieboxes } = useTonieboxes();
    const { value: newBoxesAllowed } = useNewBoxesAllowed();
    const {
        tonies,
        defaultLanguage,
        loading: loadingTonies,
    } = useTonies({
        merged: true,
        shuffle: true,
    });

    const [displayIncidentAlert, setDisplayIncidentAlert] = useState(false);
    const [accessApiEnabled, setAccessApiEnabled] = useState<[string, boolean][]>([]);

    const [activeTab, setActiveTab] = useState(localStorage.getItem("homeActiveTab") ?? "tonies");

    useEffect(() => {
        localStorage.setItem("homeActiveTab", activeTab);
    }, [activeTab]);

    useEffect(() => {
        api.apiGetSecurityMITAlert().then(setDisplayIncidentAlert);
    }, []);

    useEffect(() => {
        if (!newBoxesAllowed || tonieboxes.length === 0) return;

        (async () => {
            const result = await Promise.all(
                tonieboxes.map(async (box) => {
                    const enabled = await api.apiGetTonieboxApiAccess(box.ID);
                    return [box.boxName, enabled] as [string, boolean];
                })
            );
            setAccessApiEnabled(result);
        })();
    }, [newBoxesAllowed, tonieboxes]);

    return {
        tonies,
        tonieboxes,
        displayIncidentAlert,
        loading: loadingTonies || loadingTonieboxes,
        accessApiEnabled,
        newBoxesAllowed,

        defaultLanguage,

        activeTab,
        setActiveTab,
    };
};
