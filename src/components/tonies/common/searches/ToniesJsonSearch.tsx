import { Button, Tooltip } from "antd";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { useToniesJsonSearch } from "../hooks/useToniesJsonSearch";
import { useTeddyCloud } from "../../../../provider/TeddyCloudProvider";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { SearchDropdownOption, SearchDropdown } from "../../../common/elements/SearchDropdown";
import { canHover } from "../../../../utils/browser/browserUtils";
import { toImageSrc } from "../utils/imagePathUtils";
import { useCustomModelsEditorLauncher } from "../../hooks/useCustomModelsEditorFeature";

export interface ToniesJsonSearchResult {
    value: string;
    selectionText: string;
    picture?: string;
    episodes?: string;
    series?: string;
    model?: string;
    language?: string;
    trackTitles?: string[];
}

interface ToniesJsonSearchProps {
    placeholder: string;
    showAddCustomTonieButton?: boolean;
    clearInputAfterSelection?: boolean;
    onOpenCustomModelEditor?: () => void;

    onChange: (newValue: string) => void;

    onSelectResult?: (result: ToniesJsonSearchResult) => void;

    /** Display text when a model is selected (e.g. "[01-0013] Sample Series - Episode Title") */
    modelDisplayText?: string;

    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
}

export const ToniesJsonSearch: React.FC<ToniesJsonSearchProps> = ({
    placeholder,
    showAddCustomTonieButton = true,
    clearInputAfterSelection = true,
    onOpenCustomModelEditor,
    onChange,
    onSelectResult,
    modelDisplayText = "",
    prefix,
    suffix,
}) => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();
    const { launchCustomModelsEditor } = useCustomModelsEditorLauncher();

    const { value, options, search, select, setValue } = useToniesJsonSearch((error) => {
        addNotification(
            NotificationTypeEnum.Error,
            t("toniesJsonSearch.failedToFetchSearchResults"),
            t("toniesJsonSearch.failedToFetchSearchResultsDetails") + String(error),
            t("tonies.navigationTitle"),
        );
    });

    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        if (!modelDisplayText) setSearchText("");
    }, [modelDisplayText]);

    const debouncedSearch = useDebouncedCallback(search, 300);

    const handleSearch = (text: string) => {
        setSearchText(text);
        if (!text.trim()) {
            onChange("");
        }
        debouncedSearch(text);
    };

    const results = options as ToniesJsonSearchResult[];

    const dropdownOptions: SearchDropdownOption[] = results.map((d) => ({
        value: d.value,
        label: (
            <div style={{ display: "flex", alignItems: "center" }}>
                {d.picture && (
                    <img
                        src={toImageSrc(d.picture)}
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

    const displayValue = searchText || modelDisplayText;

    return (
        <>
            <SearchDropdown
                value={displayValue}
                placeholder={placeholder}
                options={dropdownOptions}
                onInputChange={handleSearch}
                onSelect={handleSelect}
                noResultsContent={t("toniesJsonSearch.noResults")}
                allowClear
                style={{ marginTop: prefix || suffix ? 0 : 8 }}
                prefix={prefix}
                suffix={suffix}
            />

            {showAddCustomTonieButton && (
                <Tooltip
                    open={!canHover ? false : undefined}
                    title={t("tonies.addNewCustomTonieHint")}
                >
                    <Button
                        onClick={() => {
                            if (onOpenCustomModelEditor) {
                                onOpenCustomModelEditor();
                                return;
                            }
                            launchCustomModelsEditor();
                        }}
                        style={{ marginTop: 8 }}
                    >
                        {t("tonies.addNewCustomTonie")}
                    </Button>
                </Tooltip>
            )}
        </>
    );
};
