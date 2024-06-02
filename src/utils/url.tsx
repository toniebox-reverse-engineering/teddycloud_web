import { Location } from "@remix-run/router";

export const createQueryString = (params: any) => {
    return Object.keys(params)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join("&");
};

export const getFilePathFromQueryParam = (location: Location) => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get("path")) return queryParams.get("path") + "/";
    else return "/";
};
