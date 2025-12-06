import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function useOverlayFromLocation() {
    const location = useLocation();
    const navigate = useNavigate();

    const updateUrl = useCallback(
        (nextOverlay: string) => {
            const params = new URLSearchParams(location.search);

            if (nextOverlay) {
                params.set("overlay", nextOverlay);
            } else {
                params.delete("overlay");
            }

            navigate(
                {
                    pathname: location.pathname,
                    search: params.toString(),
                },
                { replace: true }
            );
        },
        [location.pathname, location.search, navigate]
    );

    return { updateUrl };
}
