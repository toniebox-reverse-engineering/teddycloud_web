import { Button, Tooltip } from "antd";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { useToniesJsonSearch } from "../hooks/useToniesJsonSearch";
import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import ToniesCustomJsonEditor from "../../ToniesCustomJsonEditor";
import { SearchDropdownOption, SearchDropdown } from "../../../common/elements/SearchDropdown";
import { canHover } from "../../../../utils/browser/browserUtils";

export interface ToniesJsonSearchResult {
    value: string;
    selectionText: string;
    contentText: string;
    picture?: string;
    episodes?: string;
    model?: string;
    language?: string;
    trackTitles?: string[];
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
            t("toniesJsonSearch.failedToFetchSearchResults"),
            t("toniesJsonSearch.failedToFetchSearchResultsDetails") + String(error),
            t("tonies.navigationTitle")
        );
    });

    const [searchText, setSearchText] = useState("");

    const debouncedSearch = useDebouncedCallback(search, 300);

    const handleSearch = (text: string) => {
        setSearchText(text);
        debouncedSearch(text);
    };

    const results = options as ToniesJsonSearchResult[];

    const dropdownOptions: SearchDropdownOption[] = results.map((d) => ({
        value: d.value,
        label: (
            <div style={{ display: "flex", alignItems: "center" }}>
                {d.picture && (
                    <img
                        src={d.picture}
                        alt={d.selectionText}
                        style={{
                            width: 64,
                            height: 64,
                            objectFit: "cover",
                            borderRadius: 4,
                            marginRight: 8,
                        }}
                    />
                )}
                <span>{d.selectionText}</span>
            </div>
        ),
    }));

    const handleSelect = (newValue: string) => {
        select(newValue);

        const match = results.find((o) => o.value === newValue);

        if (onSelectResult && match) {
            onSelectResult(match);
        }

        onChange(newValue);

        if (clearInputAfterSelection) {
            setSearchText("");
            setValue("");
        } else if (match) {
            setSearchText(match.selectionText);
        }
    };

    const handleAddNewCustomButtonClick = () => {
        setShowAddCustomTonieModal(true);
    };

    return (
        <>
            <SearchDropdown
                value={searchText}
                placeholder={placeholder}
                options={dropdownOptions}
                onInputChange={handleSearch}
                onSelect={handleSelect}
                noResultsContent={t("toniesJsonSearch.noResults")}
                allowClear
                style={{ marginTop: 8 }}
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
                    <Tooltip open={!canHover ? false : undefined} title={t("tonies.addNewCustomTonieHint")}>
                        <Button onClick={handleAddNewCustomButtonClick} style={{ marginTop: 8 }}>
                            {t("tonies.addNewCustomTonie")}
                        </Button>
                    </Tooltip>
                </>
            )}
        </>
    );
};
