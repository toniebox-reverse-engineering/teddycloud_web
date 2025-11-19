import React, { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Select, Typography } from "antd";
import type { SelectProps } from "antd";

import { useTeddyCloud } from "../../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../../types/teddyCloudNotificationTypes";

export const RadioStreamSearch: React.FC<{
    placeholder: string;
    onChange: (newValue: string) => void;
}> = (props) => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [data, setData] = useState<SelectProps["options"]>([]);
    const [value, setValue] = useState<string>();

    const [radioBrowserAPIBaseJsonUrl, setRadioBrowserAPIBaseJsonUrl] = useState<string | null>(null);
    const [isRadioBrowserApiAvailable, setApiAvailable] = useState(false);

    // we use https://www.radio-browser.info/ as source for available radio stations
    const fetchRadioBrowserBaseUrls = async () => {
        try {
            const response = await fetch("http://all.api.radio-browser.info/json/servers");
            if (!response.ok) throw new Error("Failed to fetch server list");
            const data = await response.json();
            return data.map((server: { name: any }) => `https://${server.name}`);
        } catch (error) {
            console.error("Error fetching server list:");
            return [];
        }
    };

    const getRandomRadioBrowserUrl = async () => {
        const hosts = await fetchRadioBrowserBaseUrls();
        if (hosts.length === 0) return null;
        return hosts[Math.floor(Math.random() * hosts.length)];
    };

    useEffect(() => {
        const fetchData = async () => {
            const url = await getRandomRadioBrowserUrl();
            if (!url) {
                console.log("Fetching random radio browser URL failed, using hardcoded fallback.");
                setRadioBrowserAPIBaseJsonUrl("https://de2.api.radio-browser.info/json");
            } else {
                console.log("Using random Radio Browser API URL:", url);
                setRadioBrowserAPIBaseJsonUrl(url + "/json");
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!radioBrowserAPIBaseJsonUrl) return;

        const checkApiAvailability = async () => {
            try {
                console.log("Checking API availability at:", radioBrowserAPIBaseJsonUrl);
                const response = await fetch(radioBrowserAPIBaseJsonUrl + "/stats");

                if (response.ok) {
                    console.log("API is available:", radioBrowserAPIBaseJsonUrl);
                    setApiAvailable(true);
                } else {
                    console.warn("API not available:", radioBrowserAPIBaseJsonUrl);
                    setApiAvailable(false);
                }
            } catch (error) {
                console.error("Error checking API availability:", error);
                setApiAvailable(false);
            }
        };

        checkApiAvailability();
    }, [radioBrowserAPIBaseJsonUrl]);

    const useDebounce = (func: (...args: any[]) => void, wait: number) => {
        const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

        return (...args: any[]) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => func(...args), wait);
        };
    };

    const handleSearch = async (search: string) => {
        if (!radioBrowserAPIBaseJsonUrl) {
            console.warn("Skipping search: API URL is null");
            return;
        }

        setData([]);
        if (search === "") {
            return;
        }
        const searchEncode = encodeURIComponent(search);

        const url =
            radioBrowserAPIBaseJsonUrl + "/stations/search?name=" + searchEncode + "&is_https=true&hidebroken=true";
        try {
            const response = await fetch(url, {});
            if (!response.ok) {
                throw new Error(response.status + " " + response.statusText);
            }
            const data = await response.json();
            const uniqueData = Array.from(new Set(data.map((item: { url: any }) => item.url))).map((url) => {
                const item = data.find((station: { url: unknown }) => station.url === url);
                return {
                    value: item!.url,
                    text:
                        (item!.country ? "[" + item!.country + "] " : "") +
                        item!.name +
                        (item!.language ? " (" + item!.language + ")" : ""),
                };
            });
            setData(uniqueData);
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("radioStreamSearch.failedToFetchSearchResults"),
                t("radioStreamSearch.failedToFetchSearchResultsDetails") + error,
                t("tonies.title")
            );
            return;
        }
    };

    const debouncedSearch = useCallback(useDebounce(handleSearch, 300), [radioBrowserAPIBaseJsonUrl]);

    const handleChange = (newValue: string) => {
        setValue(newValue);
        props.onChange(newValue);
    };

    const radioStreamSearchInput =
        isRadioBrowserApiAvailable && radioBrowserAPIBaseJsonUrl ? (
            <>
                <Typography.Text style={{ fontSize: "small", display: "inline-block", marginTop: "8px" }}>
                    {t("radioStreamSearch.searchLabel")}
                </Typography.Text>
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
        ) : (
            <></>
        );
    return radioStreamSearchInput;
};
