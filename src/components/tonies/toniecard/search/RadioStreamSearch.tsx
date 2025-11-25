import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { AutoComplete, Typography } from "antd";

import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { useRadioStreamSearch } from "../hooks/useRadioStreamSearch";
import { useDebouncedCallback } from "../../common/hooks/useDebouncedCallback";

const Paragraph = Typography;

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

    const [searchText, setSearchText] = useState(value ?? "");

    const debouncedSearch = useDebouncedCallback(search, 300);

    const handleInputChange = (text: string) => {
        setSearchText(text);
        debouncedSearch(text);
    };

    const handleSelect = (newValue: string) => {
        setValue(newValue);
        select(newValue);
        onChange(newValue);

        const match = options.find((o) => o.value === newValue);
        if (match) {
            setSearchText(match.text);
        }
    };

    if (!isRadioBrowserApiAvailable || !radioBrowserAPIBaseJsonUrl) {
        return null;
    }

    return (
        <>
            <Paragraph style={{ fontSize: "small", display: "inline-block", marginTop: "8px" }}>
                {t("radioStreamSearch.searchLabel")}
            </Paragraph>

            <AutoComplete
                value={searchText}
                style={{ margin: "8px 0", width: "100%" }}
                placeholder={placeholder}
                options={options.map((d) => ({
                    value: d.value,
                    label: d.text,
                }))}
                onChange={handleInputChange}
                onSelect={handleSelect}
                filterOption={false}
            />
        </>
    );
};
