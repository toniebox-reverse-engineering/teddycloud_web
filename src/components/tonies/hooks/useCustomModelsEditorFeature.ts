import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export const useCustomModelsEditorLauncher = () => {
    const navigate = useNavigate();

    const launchCustomModelsEditor = useCallback(() => {
        navigate("/tonies/customeditor");
    }, [navigate]);

    return { launchCustomModelsEditor };
};
