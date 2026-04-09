import { useEffect, useState } from "react";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { DEFAULT_UPLOAD_TIMEOUT_MS } from "../../constants/numbers";

const api = new TeddyCloudApi(defaultAPIConfig());

export const useUploadTimeoutMs = () => {
    const [value, setValue] = useState<number>(DEFAULT_UPLOAD_TIMEOUT_MS);

    useEffect(() => {
        let isMounted = true;

        const fetchSetting = async () => {
            try {
                const response = await api.apiGetTeddyCloudSettingRaw("core.file_upload_timeout_ms");
                if (!response.ok) {
                    if (isMounted) setValue(DEFAULT_UPLOAD_TIMEOUT_MS);
                    return;
                }
                const v = await response.text();
                const parsed = parseInt(v, 10);
                if (isMounted && !Number.isNaN(parsed) && parsed >= 15000 && parsed <= 300000) {
                    setValue(parsed);
                } else if (isMounted) {
                    setValue(DEFAULT_UPLOAD_TIMEOUT_MS);
                }
            } catch {
                if (isMounted) setValue(DEFAULT_UPLOAD_TIMEOUT_MS);
            }
        };

        fetchSetting();
        return () => {
            isMounted = false;
        };
    }, []);

    return value;
};
