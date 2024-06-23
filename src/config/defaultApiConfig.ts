import { Configuration } from "../api";

export const defaultAPIConfig = () =>
    new Configuration({
        basePath: process.env.REACT_APP_TEDDYCLOUD_API_URL,
        //fetchApi: fetch,
    });
