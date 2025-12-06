import { useEffect, useState } from "react";
import { TeddyCloudApi } from "../../../../../../api";
import { defaultAPIConfig } from "../../../../../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export const useGetSettingUseRevvoxFlasher = () => {
    const [value, setValue] = useState<boolean | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchSetting = async () => {
            try {
                const response = await api.apiGetTeddyCloudSettingRaw("frontend.use_revvox_flasher");
                const v = (await response.text()) === "true";
                if (isMounted) setValue(v);
            } catch {
                if (isMounted) setValue(false);
            }
        };

        fetchSetting();
        return () => {
            isMounted = false;
        };
    }, []);

    return value;
};
