import { useCallback } from "react";

import { createAltPortPatch, isValidAltPort } from "./altPortPatch";

export const useAltPortCustomPatch = (port: number) => {
    const createPatch = useCallback(() => {
        if (!isValidAltPort(port)) return;

        const blob = new Blob([createAltPortPatch(port)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "altPort.custom.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, [port]);

    return { createPatch };
};
