import { useCallback, useEffect, useState } from "react";

import { TeddyCloudApi } from "../../../api";
import { defaultAPIConfig } from "../../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());
const SETTING = "tonie_json.cache_images";

/**
 * TeddyCloud setting "cache images". Without it the pictures of original tonies come from the
 * tonies server, which does not allow the browser to read them, so the TeddyBox cannot measure
 * their empty margins and shows the figures small (see imageTrim).
 */
export const useImageCaching = () => {
    // null while unknown (or not readable, e.g. without the rights to read settings)
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let active = true;
        api.apiGetTeddyCloudSettingRaw(SETTING)
            .then((response) => response.text())
            .then((text) => active && setEnabled(text.trim() === "true"))
            .catch(() => active && setEnabled(null));
        return () => {
            active = false;
        };
    }, []);

    const enable = useCallback(async () => {
        setSaving(true);
        try {
            await api.apiPostTeddyCloudSetting(SETTING, true);
            await api.apiTriggerWriteConfigGet();
            setEnabled(true);
        } finally {
            setSaving(false);
        }
    }, []);

    return { enabled, saving, enable };
};
