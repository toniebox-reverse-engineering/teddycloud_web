import { useCallback } from "react";
import { useOverlayFromLocation } from "./useOverlayFromLocation";
import { useTonieboxContent } from "./useTonieboxContent";

export function useTonieboxContentOverlay() {
    const { updateUrl } = useOverlayFromLocation();

    const { tonieBoxContentDirs, overlay, handleContentOverlayChange } = useTonieboxContent();

    const changeOverlay = useCallback(
        (nextOverlay: string) => {
            handleContentOverlayChange(nextOverlay);
            updateUrl(nextOverlay);
        },
        [handleContentOverlayChange, updateUrl]
    );

    return {
        overlay,
        changeOverlay,
        tonieBoxContentDirs,
    };
}
