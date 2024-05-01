import React, { useState, useEffect } from 'react';
import { List, Switch, Input, Button, Collapse } from 'antd';
import { useTranslation } from 'react-i18next';
import { TonieCard, TonieCardProps } from '../../components/tonies/TonieCard';

const { Panel } = Collapse;

export const ToniesList: React.FC<{ tonieCards: TonieCardProps[] }> = ({ tonieCards }) => {
    const { t } = useTranslation();
    const [filteredTonies, setFilteredTonies] = useState(tonieCards);
    const [searchText, setSearchText] = useState('');
    const [seriesFilter, setSeriesFilter] = useState('');
    const [episodeFilter, setEpisodeFilter] = useState('');
    const [validFilter, setValidFilter] = useState(false);
    const [existsFilter, setExistsFilter] = useState(false);
    const [liveFilter, setLiveFilter] = useState(false);
    const [nocloudFilter, setNocloudFilter] = useState(false);
    const [collapsed, setCollapsed] = useState(true);
    const [loading, setLoading] = useState(true); // Add loading state

    useEffect(() => {
        setFilteredTonies(tonieCards); // Initialize filteredTonies with tonieCards
        setLoading(false); // Set loading to false when tonieCards are available
    }, [tonieCards]);

    const handleFilter = () => {
        let filtered = tonieCards.filter(tonie =>
            tonie.tonieInfo.series.toLowerCase().includes(seriesFilter.toLowerCase())
            && tonie.tonieInfo.episode.toLowerCase().includes(episodeFilter.toLowerCase())
            && (!validFilter || tonie.valid)
            && (!existsFilter || tonie.exists)
            && (!liveFilter || tonie.live)
            && (!nocloudFilter || tonie.nocloud)
        );
        if (searchText) {
            filtered = filtered.filter(tonie =>
                tonie.tonieInfo.series.toLowerCase().includes(searchText.toLowerCase())
                || tonie.tonieInfo.episode.toLowerCase().includes(searchText.toLowerCase())
                || tonie.tonieInfo.model.toLowerCase().includes(searchText.toLowerCase())
                || tonie.ruid.toLowerCase().includes(searchText.toLowerCase())
                || tonie.uid.toLowerCase().includes(searchText.toLowerCase())
                || tonie.tonieInfo.model.toLowerCase().includes(searchText.toLowerCase())
            );
        }
        setFilteredTonies(filtered);
    };

    const handleResetFilters = () => {
        setSearchText('');
        setSeriesFilter('');
        setEpisodeFilter('');
        setValidFilter(false);
        setExistsFilter(false);
        setLiveFilter(false);
        setNocloudFilter(false);
        setFilteredTonies(tonieCards);
    };

    if (loading) {
        return <div>Loading...</div>;
    }


    return (
        <div className="tonies-list-container">
            <Collapse
                defaultActiveKey={[]}
                onChange={() => setCollapsed(!collapsed)}
                bordered={false}
            >
                <Panel header={collapsed ? t('tonies.tonies.filterBar.showFilters') : t('tonies.tonies.filterBar.hideFilters')} key="search-filter">

                    <label htmlFor="search-field" className="filter-label">{t('tonies.tonies.filterBar.searchLabel')}</label>
                    <Input.Search
                        id="search-field"
                        placeholder={t('tonies.tonies.filterBar.searchPlaceholder')}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onSearch={handleFilter}
                        enterButton
                        style={{ margin: "8px 0 8px 0" }}

                    />
                    <div className="filter-container">
                        <label className="filter-label">{t('tonies.tonies.filterBar.filterLabel')}</label>
                        <Input
                            style={{ margin: "8px 0 8px 0" }}
                            placeholder={t('tonies.tonies.filterBar.seriesFilterPlaceholder')}
                            value={seriesFilter}
                            onChange={(e) => setSeriesFilter(e.target.value)}
                        />
                        <Input
                            style={{ margin: "8px 0 8px 0" }}
                            placeholder={t('tonies.tonies.filterBar.episodeFilterPlaceholder')}
                            value={episodeFilter}
                            onChange={(e) => setEpisodeFilter(e.target.value)}
                        />
                        <div>
                            <div style={{ display: "flex", flexWrap: "wrap" }}>
                                <div style={{ flexWrap: "nowrap", marginRight: 16 }}><Switch checked={validFilter} onChange={(checked) => setValidFilter(checked)} style={{ margin: "8px 0 8px 0" }} /> {t("tonies.tonies.filterBar.valid")}</div>
                                <div style={{ flexWrap: "nowrap", marginRight: 16 }}><Switch checked={existsFilter} onChange={(checked) => setExistsFilter(checked)} style={{ margin: "8px 0 8px 0" }} /> {t("tonies.tonies.filterBar.exists")}</div>
                                <div style={{ flexWrap: "nowrap", marginRight: 16 }}><Switch checked={liveFilter} onChange={(checked) => setLiveFilter(checked)} style={{ margin: "8px 0 8px 0" }} /> {t("tonies.tonies.filterBar.live")}</div>
                                <div style={{ flexWrap: "nowrap", marginRight: 16 }}><Switch checked={nocloudFilter} onChange={(checked) => setNocloudFilter(checked)} style={{ margin: "8px 0 8px 0" }} /> {t("tonies.tonies.filterBar.noCloud")}</div>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                <Button onClick={handleResetFilters} style={{ marginLeft: 16 }}>{t('tonies.tonies.filterBar.resetFilters')}</Button>
                                <Button onClick={handleFilter} style={{ marginLeft: 16 }}>{t('tonies.tonies.filterBar.applyFilters')}</Button>
                            </div>
                        </div>
                    </div></Panel>
            </Collapse>
            <List
                grid={{
                    gutter: 16,
                    xs: 1,
                    sm: 2,
                    md: 2,
                    lg: 3,
                    xl: 4,
                    xxl: 6
                }}
                pagination={{
                    showSizeChanger: true,
                    defaultPageSize: 24,
                    pageSizeOptions: ["24", "48", "96", "192"],
                    position: "both",
                    style: { marginBottom: "16px" },
                    locale: {
                        items_per_page: t('tonies.tonies.pageSelector'),
                    }
                }}
                dataSource={filteredTonies}
                renderItem={(tonie) => (
                    <List.Item>
                        <TonieCard tonieCard={tonie} />
                    </List.Item>
                )}
            />
        </div>
    );
};
