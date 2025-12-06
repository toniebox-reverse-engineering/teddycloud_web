import { useEffect, useState } from "react";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export const useGetSettingCheckCC3200CFW = (): boolean => {
    const [checkCC3200CFW, setCheckCC3200CFW] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchCheckCC3200CFW = async () => {
            try {
                const response = await api.apiGetTeddyCloudSettingRaw("frontend.check_cc3200_cfw");
                const value = (await response.text()) === "true";
                if (isMounted) {
                    setCheckCC3200CFW(value);
                }
            } catch {
                if (isMounted) {
                    setCheckCC3200CFW(false);
                }
            }
        };

        fetchCheckCC3200CFW();

        return () => {
            isMounted = false;
        };
    }, []);

    return checkCC3200CFW;
};
