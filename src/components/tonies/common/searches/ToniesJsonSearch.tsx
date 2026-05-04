import { Button, Checkbox, Space, Tooltip } from "antd";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { useToniesJsonSearch } from "../hooks/useToniesJsonSearch";
import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { SearchDropdownOption, SearchDropdown } from "../../../common/elements/SearchDropdown";
import { canHover } from "../../../../utils/browser/browserUtils";
import { toImageSrc } from "../utils/imagePathUtils";
import { useCustomModelsEditorLauncher } from "../../hooks/useCustomModelsEditorFeature";

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
    onOpenCustomModelEditor?: () => void;

    onChange: (newValue: string) => void;

    onSelectResult?: (result: ToniesJsonSearchResult) => void;

    /** When true, the dropdown renders per-row checkboxes plus an "Add N selected" footer
     * button. Selecting/deselecting rows does NOT close the dropdown; clicking the footer
     * button calls `onSelectResults` with all currently checked entries and clears the
     * selection. Default: false (legacy single-add behavior is bit-identical). */
    multiSelect?: boolean;

    /** Batch sibling of `onSelectResult`, invoked once with every checked row when the user
     * confirms a multi-select. Required when `multiSelect` is true. */
    onSelectResults?: (results: ToniesJsonSearchResult[]) => void;

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
    multiSelect = false,
    onSelectResults,
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
            t("tonies.navigationTitle")
        );
    });

    const [searchText, setSearchText] = useState("");

    // Multi-select state — only meaningful when `multiSelect` is true.
    // We store the full result objects keyed by `value` so the parent gets a clean
    // ToniesJsonSearchResult[] back even after the user types a different query and the
    // current `options` no longer contains the previously checked rows.
    const [selectedById, setSelectedById] = useState<Record<string, ToniesJsonSearchResult>>({});

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

    const isChecked = (value: string) => Object.prototype.hasOwnProperty.call(selectedById, value);

    const dropdownOptions: SearchDropdownOption[] = results.map((d) => ({
        value: d.value,
        label: (
            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                {multiSelect && (
                    <Checkbox
                        checked={isChecked(d.value)}
                        // Row click toggles selection, so we don't need the checkbox to
                        // independently fire onChange — let the click bubble to the row.
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleSelection(d)}
                        style={{ marginRight: 8 }}
                    />
                )}
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

    const toggleSelection = (entry: ToniesJsonSearchResult) => {
        setSelectedById((prev) => {
            const next = { ...prev };
            if (Object.prototype.hasOwnProperty.call(next, entry.value)) {
                delete next[entry.value];
            } else {
                next[entry.value] = entry;
            }
            return next;
        });
    };

    const handleConfirmMulti = () => {
        const picked = Object.values(selectedById);
        if (picked.length === 0) return;
        if (onSelectResults) {
            onSelectResults(picked);
        } else if (onSelectResult) {
            // Defensive fallback so a caller that forgot `onSelectResults` still gets
            // every checked row delivered (one callback per item) instead of silently
            // dropping the click. New callers should always supply onSelectResults.
            picked.forEach((p) => onSelectResult(p));
        }
        setSelectedById({});
        // Mirror the single-select clear semantics so the input is ready for the next
        // batch search.
        if (clearInputAfterSelection) {
            setSearchText("");
            setValue("");
        }
    };

    const handleClearMultiSelection = () => {
        setSelectedById({});
    };

    const handleSelect = (newValue: string) => {
        if (multiSelect) {
            const match = results.find((o) => o.value === newValue);
            if (match) {
                toggleSelection(match);
            }
            return;
        }

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

    const selectedCount = multiSelect ? Object.keys(selectedById).length : 0;

    const multiFooter =
        multiSelect && selectedCount > 0 ? (
            <Space style={{ display: "flex", justifyContent: "flex-end", padding: "0 4px 4px 4px" }}>
                <Button size="small" onClick={handleClearMultiSelection}>
                    {t("toniesJsonSearch.multiSelect.cancel")}
                </Button>
                <Button size="small" type="primary" onClick={handleConfirmMulti}>
                    {t("toniesJsonSearch.multiSelect.addN", { n: selectedCount })}
                </Button>
            </Space>
        ) : undefined;

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
                keepOpenOnSelect={multiSelect}
                footer={multiFooter}
            />

            {showAddCustomTonieButton && (
                <Tooltip open={!canHover ? false : undefined} title={t("tonies.addNewCustomTonieHint")}>
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
