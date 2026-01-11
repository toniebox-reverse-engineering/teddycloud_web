import { useMemo } from "react";
import { UrlToTest, useUrlsReachable } from "../../../../../../hooks/useUrlsReachable";

export const useReachableBackUpUrls = () => {
    const urls: UrlToTest[] = useMemo(
        () => [
            {
                id: "ESPConnect",
                url: "https://thelastoutpostworkshop.github.io/ESPConnect/",
                title: "ESPConnect",
            },
            {
                id: "espviewerg3gg0",
                url: "https://g3gg0.github.io/esp32_flasher/esp32-viewer.html",
                title: "ESP32 viewer by g3gg0",
            },
        ],
        []
    );

    return useUrlsReachable(urls);
};
