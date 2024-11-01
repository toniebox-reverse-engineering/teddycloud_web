/* tslint:disable */
/* eslint-disable */
/**
 * TeddyCloud API
 *
 */

import * as runtime from "../runtime";
import type { Errors, OptionsList, StatsList } from "../models";
import {
    ErrorsFromJSON,
    ErrorsToJSON,
    OptionsListFromJSON,
    OptionsListToJSON,
    StatsListFromJSON,
    StatsListToJSON,
} from "../models";

import { TagTonieCard, TagTonieCardsList, TonieCardProps } from "../../types/tonieTypes";
import { TonieboxCardsList, TonieboxCardProps } from "../../types/tonieboxTypes";

export interface ApiSetCloudCacheContentPostRequest {
    body: boolean;
}

export interface ApiUploadCertPostRequest {
    filename?: Array<Blob>;
}

/**
 *
 */
export class TeddyCloudApi extends runtime.BaseAPI {
    /**
     * get all tonieboxes RAW
     */
    async apiGetTonieboxesIndexRaw(
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<runtime.ApiResponse<TonieboxCardsList>> {
        const response = await this.apiGetTeddyCloudApiRaw(`/api/getBoxes`, undefined, initOverrides);
        return new runtime.JSONApiResponse<TonieboxCardsList>(response);
    }

    /**
     * get all tonieboxes
     */
    async apiGetTonieboxesIndex(
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<TonieboxCardProps[]> {
        const response = await this.apiGetTonieboxesIndexRaw(initOverrides);
        return (await response.value()).boxes;
    }

    /**
     * get all tags RAW
     */
    async apiGetTagIndexRaw(
        overlay?: string,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<runtime.ApiResponse<TagTonieCardsList>> {
        const queryParameters: any = {};
        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.apiGetTeddyCloudApiRaw(`/api/getTagIndex`, overlay, initOverrides);
        return new runtime.JSONApiResponse<TagTonieCardsList>(response);
    }

    /**
     * get all tags
     */
    async apiGetTagIndex(
        overlay?: string,
        fetchSourceInfo?: boolean,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<TonieCardProps[]> {
        const response = await this.apiGetTagIndexRaw(overlay, initOverrides);
        const tags = (await response.value()).tags;

        return tags;
    }

    /**
     * get tag info RAW
     */
    async apiGetTagInfoRaw(
        ruid: string,
        overlay?: string,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<runtime.ApiResponse<TagTonieCard>> {
        const response = await this.apiGetTeddyCloudApiRaw(`/api/getTagInfo?ruid=${ruid}`, overlay, initOverrides);
        return new runtime.JSONApiResponse<TagTonieCard>(response);
    }

    /**
     * get tag info
     */
    async apiGetTagInfo(
        ruid: string,
        overlay?: string,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<TonieCardProps> {
        const response = await this.apiGetTagInfoRaw(ruid, overlay, initOverrides);
        const tag = (await response.value()).tagInfo;

        return tag;
    }

    /**
     * get Tags of all Tonieboxes / Overlays
     *
     * @param fetchSourceInfo
     * @param initOverrides
     * @returns
     */
    async apiGetTagIndexMergedAllOverlays(
        fetchSourceInfo?: boolean,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<TonieCardProps[]> {
        const tonieboxData = await this.apiGetTonieboxesIndex();

        // Fetch tag index for each toniebox and merge the results into one array
        const mergedTonieCards: TonieCardProps[][] = await Promise.all([
            ...tonieboxData.map(async (toniebox) => {
                const tonieCards = await this.apiGetTagIndex(toniebox.ID, fetchSourceInfo, initOverrides);
                return tonieCards;
            }),
            this.apiGetTagIndex("", fetchSourceInfo, initOverrides),
        ]);

        const flattenedTonieCards = mergedTonieCards.flat();

        // Filter out duplicates based on the ruid AND source property (assume some tags have different content in each overlay)
        const uniqueTonieCards = flattenedTonieCards.filter(
            (tag, index, self) => index === self.findIndex((t) => t.ruid === tag.ruid && t.source === tag.source)
        );

        return uniqueTonieCards;
    }

    /**
     * get all options RAW
     */
    async apiGetIndexGetRaw(
        overlay: string,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<runtime.ApiResponse<OptionsList>> {
        const response = await this.apiGetTeddyCloudApiRaw(`/api/settings/getIndex`, overlay, initOverrides);
        return new runtime.JSONApiResponse(response, (jsonValue) => OptionsListFromJSON(jsonValue));
    }

    /**
     * get all options
     */
    async apiGetIndexGet(
        overlay: string,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<OptionsList> {
        const response = await this.apiGetIndexGetRaw(overlay, initOverrides);
        return await response.value();
    }

    /**
     * Cache cloud content on local server RAW
     */
    async apiSetCloudCacheContentPostRaw(
        requestParameters: ApiSetCloudCacheContentPostRequest,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<runtime.ApiResponse<void>> {
        if (requestParameters.body === null || requestParameters.body === undefined) {
            throw new runtime.RequiredError(
                "body",
                "Required parameter requestParameters.body was null or undefined when calling apiSetCloudCacheContentPost."
            );
        }
        const queryParameters: any = {};

        const response = await this.apiPostTeddyCloudSetting(
            "cloud.cacheContent",
            requestParameters.body as any,
            undefined,
            undefined,
            initOverrides
        );

        return new runtime.VoidApiResponse(response);
    }

    /**
     * Cache cloud content on local server
     */
    async apiSetCloudCacheContentPost(
        requestParameters: ApiSetCloudCacheContentPostRequest,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<void> {
        await this.apiSetCloudCacheContentPostRaw(requestParameters, initOverrides);
    }

    /**
     * Load all available stats RAW
     */
    async apiStatsGetRaw(
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<runtime.ApiResponse<StatsList>> {
        const response = await this.apiGetTeddyCloudApiRaw(`/api/stats`, undefined, initOverrides);
        return new runtime.JSONApiResponse(response, (jsonValue) => StatsListFromJSON(jsonValue));
    }

    /**
     * Load all available stats.
     */
    async apiStatsGet(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<StatsList> {
        const response = await this.apiStatsGetRaw(initOverrides);
        return await response.value();
    }

    /**
     * tell server to write to config file RAW
     */
    async apiTriggerWriteConfigGetRaw(
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<runtime.ApiResponse<string>> {
        const response = await this.apiGetTeddyCloudApiRaw(`/api/triggerWriteConfig`, undefined, initOverrides);
        if (this.isJsonMime(response.headers.get("content-type"))) {
            return new runtime.JSONApiResponse<string>(response);
        } else {
            return new runtime.TextApiResponse(response) as any;
        }
    }

    /**
     * tell server to write to config file
     */
    async apiTriggerWriteConfigGet(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<string> {
        const response = await this.apiTriggerWriteConfigGetRaw(initOverrides);
        return await response.value();
    }

    /**
     * upload certificates RAW
     */
    async apiUploadCertPostRaw(
        requestParameters: ApiUploadCertPostRequest,
        overlay?: String,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<runtime.ApiResponse<string>> {
        const queryParameters: any = {};
        const headerParameters: runtime.HTTPHeaders = {};

        const consumes: runtime.Consume[] = [{ contentType: "multipart/form-data" }];
        // @ts-ignore: canConsumeForm may be unused
        const canConsumeForm = runtime.canConsumeForm(consumes);

        let formParams: { append(param: string, value: any): any };
        let useForm = false;

        let path = `/api/uploadCert`;
        if (overlay !== "" && overlay !== undefined) {
            path = path + "?overlay=" + overlay;
        }

        // use FormData to transmit files using content-type "multipart/form-data"
        useForm = canConsumeForm;
        if (useForm) {
            formParams = new FormData();
        } else {
            formParams = new URLSearchParams();
        }

        if (requestParameters.filename) {
            requestParameters.filename.forEach((element) => {
                formParams.append("filename", element as any);
            });
        }

        const response = await this.request(
            {
                path: path,
                method: "POST",
                headers: headerParameters,
                query: queryParameters,
                body: formParams,
            },
            initOverrides
        );

        if (this.isJsonMime(response.headers.get("content-type"))) {
            return new runtime.JSONApiResponse<string>(response);
        } else {
            return new runtime.TextApiResponse(response) as any;
        }
    }

    /**
     * upload certificates
     */
    async apiUploadCertPost(
        requestParameters: ApiUploadCertPostRequest = {},
        overlay?: String,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<string> {
        const response = await this.apiUploadCertPostRaw(requestParameters, overlay, initOverrides);
        return await response.value();
    }

    /**
     * get tonieBoxLastOnline
     */
    async apiGetLastOnline(
        overlay: string,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<string> {
        const response = await this.apiGetTeddyCloudSettingRaw("internal.last_connection", overlay, initOverrides);
        const timestamp = await response.text();
        const date = timestamp && timestamp !== "0" ? new Date(parseInt(timestamp, 10) * 1000) : "";
        return date.toLocaleString();
    }

    /**
     * get tonieBoxStatus
     */
    async apiGetTonieboxStatus(
        overlay: string,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<boolean> {
        const response = await this.apiGetTeddyCloudSettingRaw("internal.online", overlay, initOverrides);
        return (await response.text()) === "true" ? true : false;
    }

    /**
     * get tonieBoxVersion
     */
    async apiGetTonieboxVersion(
        overlay: string,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<string> {
        const response = await this.apiGetTeddyCloudSettingRaw(
            "internal.toniebox_firmware.boxIC",
            overlay,
            initOverrides
        );
        return await response.text();
    }

    /**
     * get last played tonie ruid of toniebox
     */
    async apiGetTonieboxLastRUID(
        overlay: string,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<string> {
        const response = await this.apiGetTeddyCloudSettingRaw("internal.last_ruid", overlay, initOverrides);
        return await response.text();
    }

    /**
     * get last played tonie time
     */
    async apiGetTonieboxLastRUIDTime(
        overlay: string,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<string> {
        const response = await this.apiGetTeddyCloudSettingRaw("internal.last_ruid_time", overlay, initOverrides);
        const timestamp = await response.text();
        const date = timestamp ? new Date(parseInt(timestamp, 10) * 1000) : "";
        return date.toLocaleString();
    }

    /**
     * get last IP of toniebox
     */
    async apiGetTonieboxLastIp(
        overlay: string,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<string> {
        const response = await this.apiGetTeddyCloudSettingRaw("internal.ip", overlay, initOverrides);
        return await response.text();
    }

    /**
     * get toniebox content dir
     */
    async apiGetTonieboxContentDir(
        overlay: string,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<string> {
        const response = await this.apiGetTeddyCloudSettingRaw("core.contentdir", overlay, initOverrides);
        return await response.text();
    }

    /**
     * get toniebox API access
     */
    async apiGetTonieboxApiAccess(
        overlay: string,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<boolean> {
        const response = await this.apiGetTeddyCloudSettingRaw("toniebox.api_access", overlay, initOverrides);
        return (await response.text()) === "true" ? true : false;
    }

    /**
     * get core.newBoxesAllowed
     */
    async apiGetNewBoxesAllowed(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<boolean> {
        const response = await this.apiGetTeddyCloudSettingRaw("core.allowNewBox", undefined, initOverrides);
        return (await response.text()) === "true" ? true : false;
    }

    /**
     * get security mit alert
     */
    async apiGetSecurityMITAlert(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<boolean> {
        const response = await this.apiGetTeddyCloudSettingRaw(
            "internal.security_mit.incident",
            undefined,
            initOverrides
        );
        return (await response.text()) === "true" ? true : false;
    }

    /**
     * @description Fetch a setting from TeddyCloud
     *
     * @param settingKey key to fetch
     * @param overlay overlay (optional)
     * @param initOverrides initOverrides (optional)
     * @returns
     */
    async apiGetTeddyCloudSettingRaw(
        settingKey: string,
        overlay?: String,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<Response> {
        const response = await this.apiGetTeddyCloudApiRaw(`/api/settings/get/${settingKey}`, overlay, initOverrides);
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        return response;
    }

    /**
     * @description Post a setting to TeddyCloud
     *
     * @param settingKey
     * @param value
     * @param overlay
     * @param reset
     * @param initOverrides
     * @param headerParameters
     * @returns
     */
    async apiPostTeddyCloudSetting(
        settingKey: string,
        value?: string | boolean | number | null | undefined,
        overlay?: String,
        reset?: boolean,
        initOverrides?: RequestInit | runtime.InitOverrideFunction,
        headerParameters: runtime.HTTPHeaders = {}
    ): Promise<Response> {
        if (!headerParameters["Content-Type"]) {
            headerParameters["Content-Type"] = "text/plain";
        }

        const response = await this.apiPostTeddyCloudRaw(
            `/api/settings/${reset && reset === true ? "reset" : "set"}/${settingKey}`,
            value?.toString() || "",
            overlay,
            initOverrides,
            headerParameters
        );

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        return response;
    }

    /**
     * @description Fetch the given API Endpoint from TeddyCloud
     *
     * @param apiPath endpoint path of API
     * @param overlay overlay (optional)
     * @param initOverrides initOverrides (optional)
     * @returns raw response
     */
    async apiGetTeddyCloudApiRaw(
        apiPath: string,
        overlay?: String,
        initOverrides?: RequestInit | runtime.InitOverrideFunction
    ): Promise<Response> {
        const queryParameters: any = {};
        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request(
            {
                path: `${apiPath}${overlay ? "?overlay=" + overlay : ""}`,
                method: "GET",
                headers: headerParameters,
                query: queryParameters,
            },
            initOverrides
        );

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        return response;
    }

    /**
     * @description Post properties to tonie content json
     *
     * @param ruid ruid of tonie/tag
     * @param body body of api call, like live=false (optional)
     * @param overlay overlay (optional)
     * @param initOverrides  initOverides (optional)
     * @param headerParameters headerParameters (optional)
     * @returns
     */
    async apiPostTeddyCloudContentJson(
        ruid: string,
        body?: string,
        overlay?: String,
        initOverrides?: RequestInit | runtime.InitOverrideFunction,
        headerParameters: runtime.HTTPHeaders = {}
    ): Promise<Response> {
        const response = await this.apiPostTeddyCloudRaw(
            `/content/json/set/${ruid}`,
            body,
            overlay,
            initOverrides,
            headerParameters
        );
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        return response;
    }

    /**
     * @description Post simple data to endpoint path of TeddyCloud api
     *
     * @param apiPath endpoint path of API
     * @param body body of api call, like live=false (optional)
     * @param overlay overlay (optional)
     * @param initOverrides  initOverides (optional)
     * @param headerParameters headerParameters (optional)
     * @returns
     */
    async apiPostTeddyCloudRaw(
        path: string,
        body?: string,
        overlay?: String,
        initOverrides?: RequestInit | runtime.InitOverrideFunction,
        headerParameters: runtime.HTTPHeaders = {}
    ): Promise<Response> {
        if (!headerParameters["Content-Type"]) {
            headerParameters["Content-Type"] = "text/plain";
        }
        // we need to transform the string to a blob, if not, request quotes the body value through using stringify
        const stringToBlob = (str: string) => {
            const blob = new Blob([str], { type: "text/plain" });
            return blob;
        };

        try {
            const response = await this.request(
                {
                    path: `${path}${overlay ? "?overlay=" + overlay : ""}`,
                    method: "POST",
                    headers: headerParameters,
                    body: stringToBlob(body?.toString() || ""),
                },
                initOverrides
            );

            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            return response;
        } catch (err: any) {
            return err.response;
        }
    }

    /**
     * @description Post form data (including files) to endpoint path of TeddyCloud api
     *
     * @param path
     * @param body
     * @param overlay
     * @param initOverrides
     * @param headerParameters
     * @returns
     */
    async apiPostTeddyCloudFormDataRaw(
        path: string,
        formData: FormData,
        overlay?: String,
        initOverrides?: RequestInit | runtime.InitOverrideFunction,
        headerParameters: runtime.HTTPHeaders = {}
    ): Promise<Response> {
        try {
            // To Do: Replace fetch with request
            const response = await fetch(import.meta.env.VITE_APP_TEDDYCLOUD_API_URL + path, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            return response;
        } catch (err: any) {
            if (err.response) {
                return err.response;
            } else if (err instanceof TypeError) {
                return new Response(
                    JSON.stringify({
                        error: "Network error, please try again later.",
                        message: err.message,
                    }),
                    {
                        status: 500,
                        statusText: "Network Error",
                        headers: { "Content-Type": "application/json" },
                    }
                );
            } else {
                return new Response(
                    JSON.stringify({
                        error: "An unexpected error occurred.",
                        message: err,
                    }),
                    {
                        status: 500,
                        statusText: "Unexpected Error",
                        headers: { "Content-Type": "application/json" },
                    }
                );
            }
        }
    }
}
