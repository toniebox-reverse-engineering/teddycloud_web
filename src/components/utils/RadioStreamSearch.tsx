import React, { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Select, Typography, message } from "antd";
import type { SelectProps } from "antd";

export const RadioStreamSearch: React.FC<{
    placeholder: string;
    onChange: (newValue: string) => void;
}> = (props) => {
    const { t } = useTranslation();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [messageApi, contextHolder] = message.useMessage();
    const [data, setData] = useState<SelectProps["options"]>([]);
    const [value, setValue] = useState<string>();

    const [isRadioBrowserApiAvailable, setApiAvailable] = useState(false);

    // we use https://www.radio-browser.info/ as source for available radio stations
    const radioBrowserAPIBaseJsonUrl = "https://de1.api.radio-browser.info/json/";
    useEffect(() => {
        const checkApiAvailability = async () => {
            try {
                const response = await fetch(radioBrowserAPIBaseJsonUrl + "stats");
                if (response.ok) {
                    setApiAvailable(true);
                }
            } catch (error) {
                console.log("Radio Browser API not available, disable radiostream search.");
                setApiAvailable(false);
            }
        };

        checkApiAvailability();
    }, []);

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

        const url =
            radioBrowserAPIBaseJsonUrl + "stations/search?name=" + searchEncode + "&is_https=true&hidebroken=true";
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
            message.error(t("radioStreamSearch.failedToFetchSearchResults") + error);
            return;
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(debounce(handleSearch, 300), []);

    const handleChange = (newValue: string) => {
        setValue(newValue);
        props.onChange(newValue);
    };

    const radioStreamSearchInput = isRadioBrowserApiAvailable ? (
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
    ) : (
        <></>
    );
    return radioStreamSearchInput;
};
