import { useMemo } from "react";
import { useUrlsReachable, UrlToTest } from "../../../../../hooks/useUrlsReachable";

export const useReachableNewbieGuideUrls = () => {
    const urls: UrlToTest[] = useMemo(
        () => [
            {
                id: "cc3200",
                url: "https://forum.revvox.de/t/teddycloud-cc3200-newbie-guide/925/1",
                title: "TeddyCloud CC3200 Newbie HowTo",
            },
            {
                id: "cc3235",
                url: "https://forum.revvox.de/t/teddycloud-cc3235-newbie-howto/899/1",
                title: "TeddyCloud CC3235 Newbie HowTo",
            },
            {
                id: "esp32",
                url: "https://forum.revvox.de/t/teddycloud-esp32-newbie-documentation-deprecated/112/1",
                title: "TeddyCloud ESP32 Newbie HowTo",
            },
        ],
        []
    );

    return useUrlsReachable(urls);
};
