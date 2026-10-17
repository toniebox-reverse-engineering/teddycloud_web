import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Col, Empty, Flex, Row, Tag, Typography } from "antd";
import { AppstoreAddOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { usePluginList } from "./hooks/usePluginList";
import PluginTemplateDownloadButton from "../../common/buttons/PluginTemplateDownloadButton";
import { PluginCard } from "../plugincard/PluginCard";
import { PluginDeleteDialog } from "./modals/PluginDeleteModal";
import { PluginHelpModal } from "./modals/PluginHelpModal";
import { PluginUploadModal } from "./modals/PluginUploadModal";
import PluginPagination from "./pagination/PluginPagination";
import { userStorage } from "../../../utils/storage/userStorage";

const { Paragraph } = Typography;
const STORAGE_KEY = "pluginListState";

export const PluginList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const {
        filteredPlugins,
        allSections,
        activeSectionFilters,
        pluginCountBySection,
        toggleSectionFilter,
        hiddenOnly,
        setHiddenOnly,
        hiddenPluginCount,

        isVisibleHelpModal,
        openHelp,
        closeHelp,

        isUploadModalOpen,
        openUpload,
        closeUpload,
        file,
        setFile,
        uploading,
        handleUpload,

        isConfirmDeleteModalOpen,
        pluginIdForDeletion,
        requestDelete,
        handleConfirmDelete,
        handleCancelDelete,
    } = usePluginList();

    const [pageSize, setPageSize] = useState<number>(() => {
        const storedState = userStorage.getItem(STORAGE_KEY);
        if (storedState) {
            try {
                const { pageSize: storedPageSize } = JSON.parse(storedState);
                if (typeof storedPageSize === "number") return storedPageSize;
            } catch (error) {
                console.error("Error parsing stored plugin list state:", error);
            }
        }
        return 12;
    });
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [paginationEnabled, setPaginationEnabled] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const pluginListRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const storedState = userStorage.getItem(STORAGE_KEY);
        if (storedState) {
            try {
                const { pageSize: storedPageSize, showAll: storedShowAll } =
                    JSON.parse(storedState);
                if (storedShowAll) {
                    setPageSize(storedPageSize);
                    setShowAll(true);
                    setPaginationEnabled(false);
                } else {
                    setPageSize(storedPageSize);
                    setCurrentPage(1);
                }
            } catch (error) {
                console.error("Error parsing stored plugin list state:", error);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const stateToStore = JSON.stringify({
            pageSize,
            paginationEnabled,
            showAll,
        });
        userStorage.setItem(STORAGE_KEY, stateToStore);
    }, [pageSize, paginationEnabled, showAll]);

    const handleShowAll = (size?: number) => {
        const effectiveSize = size ?? pageSize;
        setPageSize(effectiveSize);
        setShowAll(true);
        setPaginationEnabled(false);
    };

    const handleShowPagination = () => {
        setPaginationEnabled(true);
        setShowAll(false);
        handlePageSizeChange(1, pageSize);
    };

    const handlePageSizeChange = (current: number, size: number) => {
        setPageSize(size);
        setCurrentPage(current);
        setTimeout(scrollToPluginList, 0);
    };

    const handleSectionFilterChange = (section: string, checked: boolean) => {
        toggleSectionFilter(section, checked);
        setCurrentPage(1);
    };

    const handleHiddenFilterChange = (checked: boolean) => {
        setHiddenOnly(checked);
        setCurrentPage(1);
    };

    const scrollToPluginList = () => {
        const element = pluginListRef.current;

        if (!element) {
            return;
        }

        const rect = element.getBoundingClientRect();

        if (rect.top < 0) {
            window.scrollTo({
                top: window.scrollY + rect.top - 16,
                behavior: "smooth",
            });
        }
    };

    const currentPageData = showAll
        ? filteredPlugins
        : filteredPlugins.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const listPagination = (
        <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap" }}>
            {!paginationEnabled ? (
                <Button onClick={handleShowPagination} style={{ marginBottom: 8 }}>
                    {t("tonies.tonies.showPagination")}
                </Button>
            ) : (
                <PluginPagination
                    currentPage={currentPage}
                    onChange={handlePageSizeChange}
                    total={filteredPlugins.length}
                    pageSize={pageSize}
                    additionalButtonOnClick={() => handleShowAll()}
                />
            )}
        </div>
    );

    return (
        <>
            <h1>{t("community.plugins.title")}</h1>

            <div
                style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                }}
            >
                <Paragraph>{t("community.plugins.intro")}</Paragraph>
                <Paragraph
                    style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                    }}
                >
                    <Button disabled icon={<AppstoreAddOutlined />} onClick={openUpload}>
                        {t("community.plugins.addButton")}
                    </Button>
                    <PluginTemplateDownloadButton />
                    <Button icon={<QuestionCircleOutlined />} onClick={openHelp}>
                        {t("community.plugins.helpButton")}
                    </Button>
                </Paragraph>
            </div>
            <Alert
                type="warning"
                showIcon
                title="WIP - To be extended soon... meanwhile you can upload plugins manually into teddycloud/data/www/plugins using any SFTP-Client"
                style={{ margin: 16 }}
            />
            <>
                <h2>{t("community.plugins.installedPlugins")}</h2>
                <div style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {allSections.map((section) => {
                        const isChecked = activeSectionFilters.includes(section);

                        return (
                            <Badge
                                count={pluginCountBySection[section] || 0}
                                color="grey"
                                size="small"
                                offset={[0, 2]}
                                key={section}
                            >
                                <Tag.CheckableTag
                                    checked={isChecked}
                                    onChange={(checked) =>
                                        handleSectionFilterChange(section, checked)
                                    }
                                >
                                    {section.charAt(0).toUpperCase() + section.slice(1)}
                                </Tag.CheckableTag>
                            </Badge>
                        );
                    })}

                    <Badge count={hiddenPluginCount} color="grey" size="small" offset={[0, 2]}>
                        <Tag.CheckableTag checked={hiddenOnly} onChange={handleHiddenFilterChange}>
                            {t("community.plugins.hidden")}
                        </Tag.CheckableTag>
                    </Badge>
                </div>

                <Flex ref={pluginListRef} vertical gap={16}>
                    {filteredPlugins.length === 0 ? (
                        <Empty description={t("community.plugins.empty")} />
                    ) : (
                        <>
                            {listPagination}

                            <Row gutter={[16, 16]}>
                                {currentPageData.map((plugin) => (
                                    <Col
                                        key={plugin.pluginId}
                                        xs={24}
                                        sm={12}
                                        md={12}
                                        lg={8}
                                        xl={8}
                                        xxl={6}
                                        style={{ minWidth: 0, display: "flex" }}
                                    >
                                        <PluginCard
                                            plugin={plugin}
                                            onOpen={(pluginId) =>
                                                navigate(`/community/tcplugins/${pluginId}`)
                                            }
                                            onOpenHomepage={(url) => window.open(url, "_blank")}
                                            onDelete={requestDelete}
                                        />
                                    </Col>
                                ))}
                            </Row>

                            {listPagination}
                        </>
                    )}
                </Flex>

                <PluginHelpModal open={isVisibleHelpModal} onClose={closeHelp} />
                <PluginUploadModal
                    open={isUploadModalOpen}
                    uploading={uploading}
                    file={file}
                    onFileChange={setFile}
                    onOk={handleUpload}
                    onCancel={closeUpload}
                />
                <PluginDeleteDialog
                    open={isConfirmDeleteModalOpen}
                    pluginId={pluginIdForDeletion}
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                />
            </>
        </>
    );
};
