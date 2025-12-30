import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Col, Empty, Row, Tag, Typography } from "antd";
import { AppstoreAddOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { usePluginList } from "./hooks/usePluginList";
import PluginTemplateDownloadButton from "../../common/buttons/PluginTemplateDownloadButton";
import { PluginCard } from "../plugincard/PluginCard";
import { PluginDeleteDialog } from "./modals/PluginDeleteModal";
import { PluginHelpModal } from "./modals/PluginHelpModal";
import { PluginUploadModal } from "./modals/PluginUploadModal";

const { Paragraph } = Typography;

export const PluginList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const {
        filteredPlugins,
        allSections,
        activeSectionFilters,
        pluginCountBySection,
        toggleSectionFilter,

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

    return (
        <>
            <h1>{t("community.plugins.title")}</h1>
            <Alert
                type="warning"
                showIcon
                title="WIP - To be extended soon... meanwhile you can upload plugins manually into teddycloud/data/www/plugins using any SFTP-Client"
                style={{ margin: 32 }}
            />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "space-between" }}>
                <Paragraph>{t("community.plugins.intro")}</Paragraph>
                <Paragraph style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "space-between" }}>
                    <Button disabled icon={<AppstoreAddOutlined />} onClick={openUpload}>
                        {t("community.plugins.addButton")}
                    </Button>
                    <PluginTemplateDownloadButton />
                    <Button icon={<QuestionCircleOutlined />} onClick={openHelp}>
                        {t("community.plugins.helpButton")}
                    </Button>
                </Paragraph>
            </div>
            <Paragraph>
                <h2>{t("community.plugins.installedPlugins")}</h2>
                <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {allSections.map((section) => {
                        const isChecked = activeSectionFilters.includes(section);
                        return (
                            <Badge
                                count={pluginCountBySection[section] || 0}
                                color="grey"
                                size="small"
                                offset={[-8, 4]}
                                key={section}
                            >
                                <Tag.CheckableTag
                                    key={section}
                                    checked={isChecked}
                                    onChange={(checked) => toggleSectionFilter(section, checked)}
                                >
                                    <span>{section.charAt(0).toUpperCase() + section.slice(1)}</span>
                                </Tag.CheckableTag>
                            </Badge>
                        );
                    })}
                </div>
                {filteredPlugins.length === 0 ? (
                    <Empty description={t("community.plugins.empty")} />
                ) : (
                    <Row gutter={8}>
                        {filteredPlugins.map((plugin) => (
                            <Col key={plugin.pluginId} xs={24} sm={12} md={12} lg={8} xl={8} xxl={6}>
                                <div
                                    style={{
                                        height: "100%",
                                        display: "flex",
                                    }}
                                >
                                    <PluginCard
                                        plugin={plugin}
                                        onOpen={(pluginId) => navigate(`/community/tcplugins/${pluginId}`)}
                                        onOpenHomepage={(url) => window.open(url, "_blank")}
                                        onDelete={requestDelete}
                                    />
                                </div>
                            </Col>
                        ))}
                    </Row>
                )}

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
            </Paragraph>
        </>
    );
};
