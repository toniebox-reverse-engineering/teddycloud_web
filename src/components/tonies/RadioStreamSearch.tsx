import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Select, Typography, message } from "antd";
import type { SelectProps } from "antd";

export const RadioStreamSearch: React.FC<{
    placeholder: string;
    onChange: (newValue: string) => void;
}> = (props) => {
    const { t } = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();
    const [data, setData] = useState<SelectProps["options"]>([]);
    const [value, setValue] = useState<string>();

    interface RadioStation {
        changeuuid: string;
        stationuuid: string;
        serveruuid: string;
        name: string;
        url: string;
        url_resolved: string;
        homepage: string;
        favicon: string;
        tags: string;
        country: string;
        countrycode: string;
        iso_3166_2: string | null;
        state: string;
        language: string;
        languagecodes: string;
        votes: number;
        lastchangetime: string; // ISO 8601 date-time string
        lastchangetime_iso8601: string;
        codec: string;
        bitrate: number;
        hls: number;
        lastcheckok: number;
        lastchecktime: string; // ISO 8601 date-time string
        lastchecktime_iso8601: string;
        lastcheckoktime: string; // ISO 8601 date-time string
        lastcheckoktime_iso8601: string;
        lastlocalchecktime: string; // ISO 8601 date-time string
        lastlocalchecktime_iso8601: string;
        clicktimestamp: string; // ISO 8601 date-time string
        clicktimestamp_iso8601: string;
        clickcount: number;
        clicktrend: number;
        ssl_error: number;
        geo_lat: number;
        geo_long: number;
        has_extended_info: boolean;
    }

    const debounce = (func: (...args: any[]) => void, wait: number) => {
        let timeout: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    const handleSearch = async (search: string) => {
        setData([]);
        if (search === "") {
            return;
        }
        const searchEncode = encodeURIComponent(search);

        // we use https://www.radio-browser.info/ as source for available radio stations
        const url =
            "http://de1.api.radio-browser.info/json/stations/search?name=" +
            searchEncode +
            "&is_https=true&hidebroken=true";
        try {
            const response = await fetch(url, {});
            if (!response.ok) {
                throw new Error(response.status + " " + response.statusText);
            }
            const data = await response.json();
            const uniqueData = Array.from(new Set(data.map((item: { url_resolved: any }) => item.url_resolved))).map(
                (url_resolved) => {
                    const item = data.find(
                        (station: { url_resolved: unknown }) => station.url_resolved === url_resolved
                    );
                    return {
                        value: item!.url_resolved,
                        text:
                            (item!.country ? "[" + item!.country + "] " : "") +
                            item!.name +
                            (item!.language ? " (" + item!.language + ")" : ""),
                    };
                }
            );
            setData(uniqueData);
        } catch (error) {
            message.error(t("radioStreamSearch.failedToFetchSearchResults") + error);
            return;
        }
    };

    const debouncedSearch = useCallback(debounce(handleSearch, 300), []);

    const handleChange = (newValue: string) => {
        setValue(newValue);
        props.onChange(newValue);
    };

    return (
        <>
            <Typography.Text style={{ fontSize: "small", display: "inline-block", marginTop: "8px" }}>
                {t("radioStreamSearch.searchLabel")}
            </Typography.Text>
            {contextHolder}
            <Select
                showSearch
                style={{ margin: "8px 0" }}
                value={value}
                placeholder={props.placeholder}
                defaultActiveFirstOption={false}
                suffixIcon={null}
                filterOption={false}
                onSearch={debouncedSearch}
                onChange={handleChange}
                notFoundContent={null}
                options={(data || []).map((d) => ({
                    value: d.value,
                    label: d.text,
                }))}
            />
        </>
    );
};
