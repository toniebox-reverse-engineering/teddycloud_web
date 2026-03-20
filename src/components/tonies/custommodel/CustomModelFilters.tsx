import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, Collapse, Input, Select } from "antd";
import { languageOptions } from "../../common/icons/LanguageFlagIcon";
import type { FilterFieldKey } from "./types/customModelEditorTypes";

export type CustomModelFiltersProps = {
    filterText: string;
    setFilterText: (v: string) => void;
    seriesFilter: string;
    setSeriesFilter: (v: string) => void;
    episodeFilter: string;
    setEpisodeFilter: (v: string) => void;
    selectedLanguages: string[];
    setSelectedLanguages: (v: string[]) => void;
    filterFields: FilterFieldKey[];
    setFilterFields: (v: FilterFieldKey[]) => void;
    filterCollapsed: boolean;
    setFilterCollapsed: (v: boolean) => void;
};

export const CustomModelFilters: React.FC<CustomModelFiltersProps> = ({
    filterText,
    setFilterText,
    seriesFilter,
    setSeriesFilter,
    episodeFilter,
    setEpisodeFilter,
    selectedLanguages,
    setSelectedLanguages,
    filterFields,
    setFilterFields,
    filterCollapsed,
    setFilterCollapsed,
}) => {
    const { t } = useTranslation();
    const allowedFilterFields: FilterFieldKey[] = ["series", "model", "title", "episodes", "release", "language", "category", "no"];
    return (
        <Collapse
            items={[{
                key: "custom-model-filters",
                label: filterCollapsed ? t("tonies.tonies.filterBar.showFilters") : t("tonies.tonies.filterBar.hideFilters"),
                children: (
                    <>
                        <Card size="small" title={t("tonies.tonies.filterBar.basicFilters")} style={{ marginBottom: 8 }}>
                            <Input allowClear placeholder={t("tonies.tonies.filterBar.searchPlaceholder")} value={filterText} onChange={(e) => setFilterText(e.target.value)} style={{ marginBottom: 8 }} />
                            <Input placeholder={t("tonies.tonies.filterBar.seriesFilterPlaceholder")} value={seriesFilter} onChange={(e) => setSeriesFilter(e.target.value)} style={{ marginBottom: 8 }} />
                            <Input placeholder={t("tonies.tonies.filterBar.episodeFilterPlaceholder")} value={episodeFilter} onChange={(e) => setEpisodeFilter(e.target.value)} style={{ marginBottom: 8 }} />
                            <Select mode="multiple" placeholder={t("tonies.tonies.filterBar.languagePlaceholder")} value={selectedLanguages} onChange={(values: string[]) => setSelectedLanguages(values)} style={{ width: "100%", marginBottom: 8 }}>
                                {languageOptions.map((langKey: string) => <Select.Option key={langKey} value={langKey}>{langKey ? t("languageUtil." + langKey) : t("languageUtil.other")}</Select.Option>)}
                            </Select>
                            <Select<FilterFieldKey[]> mode="multiple" placeholder={t("tonies.customEditor.filterFieldsPlaceholder")} value={filterFields} style={{ width: "100%" }} onChange={(values: FilterFieldKey[]) => {
                                const next = values.filter((value): value is FilterFieldKey => allowedFilterFields.includes(value));
                                setFilterFields(next.length > 0 ? next : ["series", "model"]);
                            }} options={[
                                { value: "series", label: t("tonies.addNewCustomTonieModal.series") },
                                { value: "model", label: t("tonies.addNewCustomTonieModal.model") },
                                { value: "title", label: t("tonies.addNewCustomTonieModal.formfieldTitle") },
                                { value: "episodes", label: t("tonies.addNewCustomTonieModal.episode") },
                                { value: "release", label: t("tonies.addNewCustomTonieModal.release") },
                                { value: "language", label: t("tonies.addNewCustomTonieModal.language") },
                                { value: "category", label: t("tonies.addNewCustomTonieModal.category") },
                                { value: "no", label: t("tonies.addNewCustomTonieModal.no") },
                            ]} />
                        </Card>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                            <Button onClick={() => { setFilterText(""); setSeriesFilter(""); setEpisodeFilter(""); setSelectedLanguages([]); }}>
                                {t("tonies.tonies.filterBar.resetFilters")}
                            </Button>
                        </div>
                    </>
                ),
            }]}
            activeKey={filterCollapsed ? [] : ["custom-model-filters"]}
            onChange={(key) => {
                const activeKeys = Array.isArray(key) ? key : key ? [key] : [];
                setFilterCollapsed(activeKeys.length === 0);
            }}
            bordered={false}
            style={{ marginBottom: 8 }}
        />
    );
};
