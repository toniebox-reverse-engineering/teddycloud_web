import { AutoComplete, Button, Tooltip } from "antd";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { useToniesJsonSearch } from "../hooks/useToniesJsonSearch";
import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";
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
    showAddCustomTonieButton?: boolean;
    clearInputAfterSelection?: boolean;

    onChange: (newValue: string) => void;

    onSelectResult?: (result: ToniesJsonSearchResult) => void;
}

export const ToniesJsonSearch: React.FC<ToniesJsonSearchProps> = ({
    placeholder,
    showAddCustomTonieButton = true,
    clearInputAfterSelection = true,
    onChange,
    onSelectResult,
}) => {
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

    const [searchText, setSearchText] = useState("");

    const debouncedSearch = useDebouncedCallback(search, 300);

    const handleSearch = (text: string) => {
        setSearchText(text);
        debouncedSearch(text);
    };

    const handleSelect = (newValue: string) => {
        select(newValue);

        if (onSelectResult) {
            const match = (options as ToniesJsonSearchResult[]).find((o) => o.value === newValue);
            if (match) {
                onSelectResult(match);
            }
        }

        onChange(newValue);

        if (clearInputAfterSelection) {
            setSearchText("");
            setValue("");
        } else {
            const match = (options as ToniesJsonSearchResult[]).find((o) => o.value === newValue);
            if (match) {
                setSearchText(match.text);
            }
        }
    };

    const handleAddNewCustomButtonClick = () => {
        setShowAddCustomTonieModal(true);
    };

    return (
        <>
            <AutoComplete
                value={searchText}
                options={(options as ToniesJsonSearchResult[]).map((d) => ({
                    value: d.value,
                    label: (
                        <div style={{ display: "flex", alignItems: "center" }}>
                            {d.picture && <img src={d.picture} alt={d.text} style={{ display: "none" }} />}
                            {d.text}
                        </div>
                    ),
                }))}
                onSearch={handleSearch}
                onSelect={handleSelect}
                placeholder={placeholder}
                filterOption={false}
                style={{ marginTop: 8, width: "100%" }}
            />

            {showAddCustomTonieButton && (
                <>
                    <ToniesCustomJsonEditor
                        open={showAddCustomTonieModal}
                        props={{ placeholder, onChange }}
                        setValue={(v) => {
                            setValue(v);
                            if (clearInputAfterSelection) {
                                setSearchText("");
                            } else {
                                setSearchText(v);
                            }
                        }}
                        onClose={() => setShowAddCustomTonieModal(false)}
                    />
                    <Tooltip title={t("tonies.addNewCustomTonieHint")}>
                        <Button onClick={handleAddNewCustomButtonClick} style={{ marginTop: 8 }}>
                            {t("tonies.addNewCustomTonie")}
                        </Button>
                    </Tooltip>
                </>
            )}
        </>
    );
};
