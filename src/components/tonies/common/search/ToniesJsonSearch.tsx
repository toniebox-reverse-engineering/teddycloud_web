import { Button, Select, Tooltip } from "antd";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { useToniesJsonSearch } from "../hooks/useToniesJsonSearch";
import { useTeddyCloud } from "../../../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import ToniesCustomJsonEditor from "../../ToniesCustomJsonEditor";

export interface ToniesJsonSearchResult {
    value: string;
    text: string;
    picture?: string;
    episodes?: string;
    model?: string;
    language?: string;
}

interface ToniesJsonSearchProps {
    placeholder: string;
    onChange: (newValue: string) => void;

    onSelectResult?: (result: ToniesJsonSearchResult) => void;
}

export const ToniesJsonSearch: React.FC<ToniesJsonSearchProps> = ({ placeholder, onChange, onSelectResult }) => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();

    const [showAddCustomTonieModal, setShowAddCustomTonieModal] = useState<boolean>(false);

    const { value, options, search, select, setValue } = useToniesJsonSearch((error) => {
        addNotification(
            NotificationTypeEnum.Error,
            t("tonieArticleSearch.failedToFetchSearchResults"),
            t("tonieArticleSearch.failedToFetchSearchResultsDetails") + String(error),
            t("tonies.navigationTitle")
        );
    });

    const debouncedSearch = useDebouncedCallback(search, 300);

    const handleChange = (newValue: string) => {
        select(newValue);
        if (onSelectResult) {
            const match = (options as ToniesJsonSearchResult[]).find((o) => o.value === newValue);
            if (match) {
                onSelectResult(match);
            }
        }
        onChange(newValue);
    };

    const handleAddNewCustomButtonClick = () => {
        setShowAddCustomTonieModal(true);
    };

    return (
        <>
            <Select
                showSearch
                value={value}
                placeholder={placeholder}
                defaultActiveFirstOption={false}
                suffixIcon={null}
                filterOption={false}
                onSearch={debouncedSearch}
                onChange={handleChange}
                notFoundContent={null}
                options={(options as ToniesJsonSearchResult[]).map((d) => ({
                    value: d.value,
                    label: (
                        <div style={{ display: "flex", alignItems: "center" }}>
                            {d.picture && <img src={d.picture} alt={d.text} style={{ display: "none" }} />}
                            {d.text}
                        </div>
                    ),
                }))}
                style={{ marginTop: "8px" }}
            />
            <ToniesCustomJsonEditor
                open={showAddCustomTonieModal}
                props={{ placeholder, onChange }}
                setValue={setValue}
                onClose={() => setShowAddCustomTonieModal(false)}
            />
            <Tooltip title={t("tonies.addNewCustomTonieHint")}>
                <Button onClick={handleAddNewCustomButtonClick} style={{ marginTop: 8 }}>
                    {t("tonies.addNewCustomTonie")}
                </Button>
            </Tooltip>
        </>
    );
};
