import React, { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Dropdown, Input, theme } from "antd";
import { useTranslation } from "react-i18next";

const { useToken } = theme;

export interface SearchDropdownOption {
    value: string;
    label: React.ReactNode;
}

export interface SearchDropdownProps {
    value: string;
    placeholder?: string;
    options: SearchDropdownOption[];
    onInputChange: (value: string) => void;
    onSelect: (value: string) => void;
    noResultsContent?: React.ReactNode;
    allowClear?: boolean;
    showNoResults?: boolean;
    style?: React.CSSProperties;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
    value,
    placeholder,
    options,
    onInputChange,
    onSelect,
    noResultsContent,
    allowClear = true,
    showNoResults = true,
    style,
}) => {
    const { token } = useToken();
    const { t } = useTranslation();

    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const [internalShowNoResults, setInternalShowNoResults] = useState(false);

    const [displayOptions, setDisplayOptions] = useState<SearchDropdownOption[]>(options);

    const listRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (options.length > 0) {
            setDisplayOptions(options);
        }
    }, [options]);

    useEffect(() => {
        let timer: number | undefined;

        if (options.length === 0 && value.trim() !== "") {
            timer = window.setTimeout(() => {
                setInternalShowNoResults(true);
                setDisplayOptions([]);
            }, 400);
        } else {
            setInternalShowNoResults(false);
            if (options.length === 0 && value.trim() === "") {
                setDisplayOptions([]);
            }
        }

        return () => {
            if (timer !== undefined) {
                window.clearTimeout(timer);
            }
        };
    }, [options, value]);

    useEffect(() => {
        if (displayOptions.length === 0) {
            setHighlightedIndex(-1);
        } else if (highlightedIndex >= displayOptions.length) {
            setHighlightedIndex(displayOptions.length - 1);
        }
    }, [displayOptions.length, highlightedIndex]);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = 0;
        }
    }, [displayOptions]);

    useEffect(() => {
        if (!showNoResults && displayOptions.length === 0) {
            setIsOpen(false);
        }
    }, [showNoResults, displayOptions.length]);

    const handleFocus = () => {
        setIsOpen(true);
    };

    const handleBlur = () => {
        setTimeout(() => setIsOpen(false), 120);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = e.target.value;
        onInputChange(nextValue);
        setIsOpen(true);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (!displayOptions.length) {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlightedIndex((prev) => {
                const next = prev + 1;
                return next >= displayOptions.length ? 0 : next;
            });
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlightedIndex((prev) => {
                if (prev === -1) return displayOptions.length - 1;
                const next = prev - 1;
                return next < 0 ? 0 : next;
            });
        } else if (event.key === "Enter") {
            if (highlightedIndex >= 0 && highlightedIndex < displayOptions.length) {
                event.preventDefault();
                handleSelect(displayOptions[highlightedIndex].value);
            }
        } else if (event.key === "Escape") {
            setIsOpen(false);
            setHighlightedIndex(-1);
        }
    };

    const handleSelect = (selectedValue: string) => {
        onSelect(selectedValue);
        setIsOpen(false);
        setHighlightedIndex(-1);
    };

    const effectiveShowNoResults = showNoResults && internalShowNoResults;
    const shouldOpenDropdown = isOpen && (displayOptions.length > 0 || effectiveShowNoResults);

    const popupWidth = triggerRef.current?.offsetWidth;

    return (
        <Dropdown
            open={shouldOpenDropdown}
            trigger={[]}
            menu={{ items: [] }}
            popupRender={() => (
                <div
                    ref={listRef}
                    style={{
                        width: popupWidth && popupWidth - 8,
                        minWidth: popupWidth && popupWidth - 8,
                        maxWidth: popupWidth && popupWidth - 8,
                        maxHeight: 300,
                        overflowY: "auto",
                        padding: 4,
                        borderRadius: token.borderRadiusLG,
                        boxShadow: token.boxShadowSecondary,
                        background: token.colorBgElevated,
                    }}
                >
                    {displayOptions.length === 0 ? (
                        effectiveShowNoResults ? (
                            <div
                                style={{
                                    padding: 8,
                                    fontSize: 12,
                                    color: token.colorTextTertiary,
                                }}
                            >
                                {noResultsContent ?? t("utils.noResults")}
                            </div>
                        ) : null
                    ) : (
                        displayOptions.map((option, index) => (
                            <div
                                key={option.value}
                                style={{
                                    cursor: "pointer",
                                    borderRadius: token.borderRadiusSM,
                                    padding: "4px 8px",
                                    display: "flex",
                                    alignItems: "center",
                                    background: index === highlightedIndex ? token.controlItemBgActive : "transparent",
                                }}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSelect(option.value)}
                            >
                                {option.label}
                            </div>
                        ))
                    )}
                </div>
            )}
        >
            <div ref={triggerRef} style={{ width: "100%", ...style }}>
                <Input
                    value={value}
                    placeholder={placeholder}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    allowClear={allowClear}
                />
            </div>
        </Dropdown>
    );
};
