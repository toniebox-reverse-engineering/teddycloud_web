// features/tonies/card/RadioStreamSearch.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { Select, Typography } from "antd";

import { useTeddyCloud } from "../../../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { useRadioStreamSearch } from "../../../../hooks/useRadioStreamSearch";
import { useDebouncedCallback } from "../../../../hooks/useDebouncedCallback";

export const RadioStreamSearch: React.FC<{
    placeholder: string;
    onChange: (newValue: string) => void;
}> = ({ placeholder, onChange }) => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();

    const { value, options, search, select, setValue, isRadioBrowserApiAvailable, radioBrowserAPIBaseJsonUrl } =
        useRadioStreamSearch((error) => {
            addNotification(
                NotificationTypeEnum.Error,
                t("radioStreamSearch.failedToFetchSearchResults"),
                t("radioStreamSearch.failedToFetchSearchResultsDetails") + String(error),
                t("tonies.title")
            );
        });

    const debouncedSearch = useDebouncedCallback(search, 300);

    const handleChange = (newValue: string) => {
        setValue(newValue);
        select(newValue);
        onChange(newValue);
    };

    if (!isRadioBrowserApiAvailable || !radioBrowserAPIBaseJsonUrl) {
        return null;
    }

    return (
        <>
            <Typography.Text style={{ fontSize: "small", display: "inline-block", marginTop: "8px" }}>
                {t("radioStreamSearch.searchLabel")}
            </Typography.Text>
            <Select
                showSearch
                style={{ margin: "8px 0" }}
                value={value}
                placeholder={placeholder}
                defaultActiveFirstOption={false}
                suffixIcon={null}
                filterOption={false}
                onSearch={debouncedSearch}
                onChange={handleChange}
                notFoundContent={null}
                options={options.map((d) => ({
                    value: d.value,
                    label: d.text,
                }))}
            />
        </>
    );
};
