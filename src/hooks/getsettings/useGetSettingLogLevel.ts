import { useEffect, useState } from "react";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export const useGetSettingLogLevel = () => {
    const [value, setValue] = useState<number>(0);

    useEffect(() => {
        let isMounted = true;

        const fetchSetting = async () => {
            try {
                const response = await api.apiGetTeddyCloudSettingRaw("log.level");
                const v = await response.text();
                if (isMounted) setValue(Number(v));
            } catch {
                if (isMounted) setValue(Number(0));
            }
        };

        fetchSetting();
        return () => {
            isMounted = false;
        };
    }, []);

    return value;
};
