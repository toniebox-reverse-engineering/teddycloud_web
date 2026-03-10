import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export const useCustomModelsEditorV2Enabled = (): boolean => {
    return true;
};

export const useCustomModelsEditorLauncher = () => {
    const navigate = useNavigate();

    const launchCustomModelsEditor = useCallback(
        (openLegacyEditor?: () => void) => {
            navigate("/tonies/customeditor");
        },
        [navigate]
    );

    return { isEnhancedCustomEditorEnabled: true, launchCustomModelsEditor };
};
