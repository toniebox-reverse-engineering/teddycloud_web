import { useEffect, useState } from "react";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export type BoxCertStatus = "" | "trusted" | "pinned" | "mismatch";

const readSetting = async (key: string, overlay: string) =>
    (await (await api.apiGetTeddyCloudSettingRaw(key, overlay)).text()).trim();

/** Status of the box certificate check; with details also the presented and the pinned fingerprint. */
export const useBoxCertificate = (overlay?: string, details = false) => {
    const [status, setStatus] = useState<BoxCertStatus>("");
    const [presented, setPresented] = useState("");
    const [pin, setPin] = useState("");

    useEffect(() => {
        if (!overlay) return;
        const load = async () => {
            try {
                setStatus((await readSetting("internal.boxCertStatus", overlay)) as BoxCertStatus);
                if (details) {
                    setPresented(await readSetting("internal.boxCertSha256", overlay));
                    setPin(await readSetting("toniebox.certPin", overlay));
                }
            } catch {
                // TeddyCloud without the box certificate check
            }
        };
        load();
    }, [overlay, details]);

    return { status, presented, pin };
};
