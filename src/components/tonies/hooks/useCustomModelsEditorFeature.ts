import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TeddyCloudApi } from "../../../api";
import { defaultAPIConfig } from "../../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());
const SETTINGS_KEY = "tonie_json.custom_editor_preview";

const parseBooleanValue = (value: string): boolean => {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
};

export const useCustomModelsEditorV2Enabled = (): boolean => {
    const [enabled, setEnabled] = useState<boolean>(false);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const response = await api.apiGetTeddyCloudSettingRaw(SETTINGS_KEY);
                const text = await response.text();
                if (mounted) {
                    setEnabled(parseBooleanValue(text));
                }
            } catch {
                if (mounted) {
                    setEnabled(false);
                }
            }
        };

        void load();
        return () => {
            mounted = false;
        };
    }, []);

    return enabled;
};

export const useCustomModelsEditorLauncher = () => {
    const isEnhancedCustomEditorEnabled = useCustomModelsEditorV2Enabled();
    const navigate = useNavigate();

    const launchCustomModelsEditor = useCallback(
        (openLegacyEditor?: () => void) => {
            if (isEnhancedCustomEditorEnabled) {
                navigate("/tonies/custom-editor");
                return;
            }
            openLegacyEditor?.();
        },
        [isEnhancedCustomEditorEnabled, navigate]
    );

    return { isEnhancedCustomEditorEnabled, launchCustomModelsEditor };
};
