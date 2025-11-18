import React, { useState } from "react";
import { AutoComplete, Button, Card, Collapse, Dropdown, Input, Select, Switch, Tooltip, theme } from "antd";
import {
    DeleteOutlined,
    FilterOutlined,
    QuestionCircleOutlined,
    SaveOutlined,
    SearchOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { languageOptions } from "../../utils/languageUtil";
import CustomFilterHelpModal from "../utils/CustomFilterHelpModal";
import HelpModal from "../../components/utils/ToniesHelpModal";
import type { ToniesFilterActions, ToniesFilterSettings, ToniesFilterState } from "../../types/toniesFilterTypes";

const { useToken } = theme;
const { Option } = Select;

export interface ToniesFilterPanelProps {
    state: ToniesFilterState;
    actions: ToniesFilterActions;
    existingFilters: Record<string, ToniesFilterSettings>;
    onSaveFilter: (name: string) => void;
    onLoadFilter: (name: string) => void;
    onDeleteFilter: (name: string) => void;
    showFilter: boolean;
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

export const ToniesFilterPanel: React.FC<ToniesFilterPanelProps> = ({
    state,
    actions,
    existingFilters,
    onSaveFilter,
    onLoadFilter,
    onDeleteFilter,
    showFilter,
    collapsed,
    setCollapsed,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();

    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isCustomFilterHelpOpen, setIsCustomFilterHelpOpen] = useState(false);
    const [customFilterOptions, setCustomFilterOptions] = useState<{ value: string }[]>([]);

    const {
        searchText,
        seriesFilter,
        episodeFilter,
        selectedLanguages,
        validFilter,
        invalidFilter,
        existsFilter,
        notExistsFilter,
        liveFilter,
        unsetLiveFilter,
        nocloudFilter,
        unsetNocloudFilter,
        hasCloudAuthFilter,
        unsetHasCloudAuthFilter,
        filterLastTonieboxRUIDs,
        customFilter,
        customFilterValid,
        customFilterError,
        filterName,
        popoverOpen,
    } = state;

    const {
        setSearchText,
        setSeriesFilter,
        setEpisodeFilter,
        setSelectedLanguages,
        setValidFilter,
        setInvalidFilter,
        setExistsFilter,
        setNotExistsFilter,
        setLiveFilter,
        setUnsetLiveFilter,
        setNocloudFilter,
        setUnsetNocloudFilter,
        setHasCloudAuthFilter,
        setUnsetHasCloudAuthFilter,
        setFilterLastTonieboxRUIDs,
        setCustomFilter,
        setFilterName,
        setPopoverOpen,
        getCustomFilterCompletions,
        applyFilters,
        resetFilters,
        validateCustomFilter,
    } = actions;

    const handleCustomFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCustomFilter(value);
        validateCustomFilter(value);
    };

    const handleCustomFilterSearch = (value: string) => {
        const options = getCustomFilterCompletions(value).map((v) => ({ value: v }));
        setCustomFilterOptions(options);
    };

    const handleCustomFilterSelect = (selection: string) => {
        const current = customFilter || "";
        const endsWithSpace = /\s$/.test(current);
        let newValue: string;

        if (!current.trim()) {
            newValue = selection;
        } else if (endsWithSpace) {
            newValue = current + selection;
        } else {
            newValue = current.replace(/([^\s()]+)$/, selection);
        }

        const updatedFilter = newValue + " ";
        setCustomFilter(updatedFilter);
        validateCustomFilter(updatedFilter);
        handleCustomFilterSearch(updatedFilter);
    };

    const menuItems = [
        <Input
            key="filter-name-input"
            placeholder={t("tonies.tonies.filterBar.enterNewFilterName")}
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            allowClear
        />,
        <div key="filter-buttons" style={{ display: "flex", gap: 8 }}>
            <Button
                icon={<SaveOutlined />}
                onClick={() => filterName && onSaveFilter(filterName)}
                disabled={!filterName}
                style={{ width: "100%" }}
            >
                {t("tonies.tonies.filterBar.saveFilter")}
            </Button>
            <Button
                icon={<FilterOutlined />}
                onClick={() => {
                    if (filterName) {
                        onLoadFilter(filterName);
                        setPopoverOpen(false);
                    }
                }}
                disabled={!filterName}
                style={{ width: "100%" }}
            >
                {t("tonies.tonies.filterBar.loadFilter")}
            </Button>
        </div>,
        <div
            key="saved-filters"
            style={{
                maxHeight: 200,
                overflowY: "auto",
                display: "flex",
                alignContent: "flex-start",
                flexDirection: "column",
                gap: 8,
            }}
        >
            {Object.keys(existingFilters).length > 0 ? (
                Object.keys(existingFilters).map((key) => (
                    <div key={key} style={{ display: "flex", gap: 8 }}>
                        <Button
                            type="text"
                            style={{ width: "100%", textAlign: "left" }}
                            onClick={() => {
                                setFilterName(key);
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    maxWidth: 180,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {key}
                            </div>
                        </Button>
                        <Button
                            icon={<DeleteOutlined />}
                            onClick={() => {
                                onDeleteFilter(key);
                            }}
                            type="text"
                        />
                    </div>
                ))
            ) : (
                <div>{t("tonies.tonies.filterBar.noSavedFilters")}</div>
            )}
        </div>,
    ];

    const filterPanelContent = (
        <div style={{ padding: "12px 0" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                    flexWrap: "wrap",
                    gap: 8,
                }}
            >
                <h3 style={{ margin: 0 }}>{t("tonies.tonies.filterBar.title")}</h3>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <Dropdown
                            open={popoverOpen}
                            onOpenChange={(open) => setPopoverOpen(open)}
                            menu={{ items: [] }}
                            trigger={["click"]}
                            popupRender={() => (
                                <div
                                    style={{
                                        padding: 12,
                                        width: 260,
                                        background: token.colorBgContainer,
                                        borderRadius: 8,
                                        border: "1px solid " + token.colorBorderSecondary,
                                        boxShadow: token.colorBorderSecondary + " 0 4px 12px",
                                        overflow: "visible",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 12,
                                    }}
                                >
                                    {menuItems.map((itm, index) => (
                                        <div key={index}>{itm}</div>
                                    ))}
                                </div>
                            )}
                        >
                            <Button>{t("tonies.tonies.filterBar.filters")}</Button>
                        </Dropdown>
                    </div>
                </div>
            </div>

            <Card size="small" title={t("tonies.tonies.filterBar.basicFilters")} style={{ marginBottom: 8 }}>
                <Input
                    id="search-field"
                    placeholder={t("tonies.tonies.filterBar.searchPlaceholder")}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    suffix={<SearchOutlined onMouseDown={(e) => e.preventDefault()} onClick={() => applyFilters()} />}
                    style={{ marginBottom: 8 }}
                />

                <Input
                    placeholder={t("tonies.tonies.filterBar.seriesFilterPlaceholder")}
                    value={seriesFilter}
                    onChange={(e) => setSeriesFilter(e.target.value)}
                    style={{ marginBottom: 8 }}
                />

                <Input
                    placeholder={t("tonies.tonies.filterBar.episodeFilterPlaceholder")}
                    value={episodeFilter}
                    onChange={(e) => setEpisodeFilter(e.target.value)}
                    style={{ marginBottom: 8 }}
                />

                <Select
                    mode="multiple"
                    placeholder={t("tonies.tonies.filterBar.languagePlaceholder")}
                    value={selectedLanguages}
                    onChange={(values) => setSelectedLanguages(values)}
                    style={{ width: "100%" }}
                >
                    {languageOptions.map((key) => (
                        <Option key={key} value={key}>
                            {key ? t("languageUtil." + key) : t("languageUtil.other")}
                        </Option>
                    ))}
                </Select>
            </Card>

            <Card size="small" title={t("tonies.tonies.filterBar.statusFilters")} style={{ marginBottom: 8 }}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                        gap: "12px",
                    }}
                >
                    {(
                        [
                            [validFilter, setValidFilter, "valid"],
                            [invalidFilter, setInvalidFilter, "invalid"],
                            [existsFilter, setExistsFilter, "exists"],
                            [notExistsFilter, setNotExistsFilter, "notExists"],
                            [liveFilter, setLiveFilter, "live"],
                            [unsetLiveFilter, setUnsetLiveFilter, "unsetLive"],
                            [nocloudFilter, setNocloudFilter, "noCloud"],
                            [unsetNocloudFilter, setUnsetNocloudFilter, "unsetNoCloud"],
                            [hasCloudAuthFilter, setHasCloudAuthFilter, "hasCloudAuth"],
                            [unsetHasCloudAuthFilter, setUnsetHasCloudAuthFilter, "unsetHasCloudAuth"],
                            [filterLastTonieboxRUIDs, setFilterLastTonieboxRUIDs, "lastPlayed"],
                        ] as [boolean, (value: boolean) => void, string][]
                    ).map(([checked, setter, labelKey]) => (
                        <div key={labelKey} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Switch checked={checked} onChange={(val) => setter(val)} />
                            {t(`tonies.tonies.filterBar.${labelKey}`)}
                        </div>
                    ))}
                </div>
            </Card>

            <Card size="small" title={t("tonies.tonies.filterBar.customFilter.label")} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {!customFilterValid && (
                        <Tooltip title={customFilterError} placement="right">
                            <WarningOutlined style={{ color: token.colorErrorText }} />
                        </Tooltip>
                    )}
                    <AutoComplete
                        style={{ width: "100%" }}
                        options={customFilterOptions}
                        value={customFilter}
                        onSelect={handleCustomFilterSelect}
                        onSearch={handleCustomFilterSearch}
                        filterOption={false}
                    >
                        <Input
                            placeholder={t("tonies.tonies.filterBar.customFilter.placeholder")}
                            onChange={handleCustomFilterChange}
                            suffix={
                                <Button
                                    icon={<QuestionCircleOutlined />}
                                    type="text"
                                    size="small"
                                    onClick={() => setIsCustomFilterHelpOpen(true)}
                                    style={{ padding: 0 }}
                                />
                            }
                        />
                    </AutoComplete>
                </div>
            </Card>

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 12,
                    marginTop: 16,
                    flexWrap: "wrap",
                }}
            >
                <Button onClick={() => resetFilters()}>{t("tonies.tonies.filterBar.resetFilters")}</Button>
                <Button type="primary" onClick={() => applyFilters()}>
                    {t("tonies.tonies.filterBar.applyFilters")}
                </Button>
            </div>
        </div>
    );

    const filterPanelContentItem = [
        {
            key: "search-filter",
            label: collapsed ? t("tonies.tonies.filterBar.showFilters") : t("tonies.tonies.filterBar.hideFilters"),
            children: filterPanelContent,
        },
    ];

    if (!showFilter) {
        return (
            <>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 8,
                        flexWrap: "wrap",
                        alignItems: "baseline",
                        marginBottom: 8,
                    }}
                >
                    <Button size="small" icon={<QuestionCircleOutlined />} onClick={() => setIsHelpModalOpen(true)}>
                        {t("fileBrowser.help.showHelp")}
                    </Button>
                </div>
                {isHelpModalOpen && (
                    <HelpModal isHelpModalOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
                )}
            </>
        );
    }

    return (
        <>
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "baseline",
                    marginBottom: 8,
                }}
            >
                <Button size="small" icon={<QuestionCircleOutlined />} onClick={() => setIsHelpModalOpen(true)}>
                    {t("fileBrowser.help.showHelp")}
                </Button>
            </div>
            {isHelpModalOpen && (
                <HelpModal isHelpModalOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
            )}
            {isCustomFilterHelpOpen && (
                <CustomFilterHelpModal
                    visible={isCustomFilterHelpOpen}
                    onClose={() => setIsCustomFilterHelpOpen(false)}
                />
            )}

            <Collapse
                items={filterPanelContentItem}
                defaultActiveKey={collapsed ? [] : ["search-filter"]}
                onChange={() => setCollapsed(!collapsed)}
                bordered={false}
            />
        </>
    );
};
