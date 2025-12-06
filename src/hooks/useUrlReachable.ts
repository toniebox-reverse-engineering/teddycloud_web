import { useMemo } from "react";
import { useUrlsReachable, UrlToTest } from "./useUrlsReachable";

export const useUrlReachable = (url: string | null | undefined) => {
    const urls: UrlToTest[] = useMemo(
        () =>
            url
                ? [
                      {
                          id: url,
                          url,
                      },
                  ]
                : [],
        [url]
    );

    const reachable = useUrlsReachable(urls);
    return reachable.length > 0 ? reachable[0] : null;
};
