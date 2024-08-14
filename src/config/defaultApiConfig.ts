import { Configuration } from "../api";

export const defaultAPIConfig = () =>
    new Configuration({
        basePath: import.meta.env.VITE_APP_TEDDYCLOUD_API_URL,
        //fetchApi: fetch,
    });
