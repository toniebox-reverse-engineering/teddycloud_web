import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { TeddyCloudApi } from "../../../../../api";
import { defaultAPIConfig } from "../../../../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export const useMacVendorLookup = () => {
    const { t } = useTranslation();

    const [boxMac, setBoxMac] = useState<string>("");
    const [warningTextMac, setWarningTextMac] = useState<string>("");
    const [vendor, setVendor] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const sanitizeMac = useCallback((input: string) => input.replace(/[^a-zA-Z0-9-:]/g, "").trim(), []);

    const handleMacChange = useCallback(
        (rawValue: string) => {
            const value = sanitizeMac(rawValue);
            let warningText = "";
            if (value.length > 17) {
                warningText = t("tonieboxes.boxSetup.identifyVersion.boxMacTooLong");
            }
            setBoxMac(value);
            setWarningTextMac(warningText);
        },
        [sanitizeMac, t]
    );

    const handleClear = useCallback(() => {
        setBoxMac("");
        setVendor(null);
        setWarningTextMac("");
        setError(null);
    }, []);

    const checkMac = useCallback(async () => {
        setVendor(null);
        setError(null);
        try {
            const response = await api.apiGetTeddyCloudApiRaw(
                `/reverseGeneric/macvendor/${encodeURIComponent(boxMac)}`
            );
            if (!response.ok) {
                throw new Error("MAC address not found or invalid");
            }
            const data = await response.text();
            setVendor(data);
        } catch (err: any) {
            setError(err.message);
        }
    }, [boxMac]);

    return {
        boxMac,
        warningTextMac,
        vendor,
        error,
        handleMacChange,
        handleClear,
        checkMac,
    };
};
