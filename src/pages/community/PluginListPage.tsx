import { useTranslation } from "react-i18next";
import { Badge, Button, Card, List, Modal, theme, Tooltip, Typography, Upload, Tag, Alert } from "antd";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { CommunitySubNav } from "../../components/community/CommunitySubNav";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    AppstoreAddOutlined,
    DeleteOutlined,
    DesktopOutlined,
    HomeOutlined,
    QuestionCircleOutlined,
    UploadOutlined,
} from "@ant-design/icons";

import CodeSnippet from "../../components/utils/CodeSnippet";
import { useTeddyCloud } from "../../TeddyCloudContext";
import ConfirmationDialog from "../../components/utils/ConfirmationDialog";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Paragraph } = Typography;
const { useToken } = theme;

export const PluginListPage = () => {
    const { t } = useTranslation();
    const { token } = useToken();
    const navigate = useNavigate();
    const { addNotification, plugins, fetchPlugins } = useTeddyCloud();

    const [isVisibleHelpModal, setIsVisibleHelpModal] = useState<boolean>(false);
    const [pluginIdForDeletion, setPluginIdForDeletion] = useState<string>("");
    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);

    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const allSections = Array.from(
        new Set(plugins.map((p) => p.teddyCloudSection || t("community.plugins.filter.unknown")))
    );

    const [activeSectionFilters, setActiveSectionFilters] = useState<string[]>(allSections);

    useEffect(() => {
        setActiveSectionFilters(allSections);
    }, [plugins]);

    const contentHelpModal = (
        <Paragraph>
            <strong>{t("community.plugins.help.title")}</strong>
            <Paragraph>{t("community.plugins.help.intro")}</Paragraph>

            <strong>{t("community.plugins.help.folderStructureTitle")}</strong>
            <CodeSnippet
                language="plain"
                code={`your-plugin-name/
    ├── plugin.json
    ├── index.html
    ├── preview.png
    └── (other plugin files)`}
            />

            <strong>{t("community.plugins.help.descriptionTitle")}</strong>
            <Paragraph>{t("community.plugins.help.descriptionIntro")}</Paragraph>

            <strong>{t("community.plugins.help.exampleTitle")}</strong>
            <CodeSnippet
                language="json"
                code={`{
  "pluginName": "Awesome Plugin",
  "description": "A short summary of what this plugin does.",
  "author": "Authors name",
  "version": "Version of the plugin",
  "pluginHomepage": "Homepage of the plugin",
  "teddyCloudSection": "tonies",
}`}
            />

            <strong>{t("community.plugins.help.fieldsTitle")}</strong>
            <List
                size="small"
                dataSource={[
                    ["pluginName", t("community.plugins.help.fields.pluginName")],
                    ["description", t("community.plugins.help.fields.description")],
                    ["author", t("community.plugins.help.fields.author")],
                    ["version", t("community.plugins.help.fields.version")],
                    ["pluginHomepage", t("community.plugins.help.fields.pluginHomepage")],
                    ["teddyCloudSection", t("community.plugins.help.fields.teddyCloudSection")],
                ]}
                renderItem={([field, desc]) => (
                    <List.Item>
                        <strong>{field}</strong>: {desc}
                    </List.Item>
                )}
            />
        </Paragraph>
    );

    const helpModal = (
        <Modal
            width="auto"
            open={isVisibleHelpModal}
            title={t("community.plugins.help.popoverTitle")}
            onCancel={() => setIsVisibleHelpModal(false)}
            onOk={() => setIsVisibleHelpModal(false)}
            cancelButtonProps={{ style: { display: "none" } }}
        >
            {contentHelpModal}
        </Modal>
    );

    const handleFileChange = (info: any) => {
        const fileList = info.fileList.slice(-1); // Keep only the latest file
        setFile(fileList.length ? fileList[0].originFileObj : null);
    };

    const handleCloseUpload = () => {
        setFile(null);
        setIsUploadModalOpen(false);
    };

    const handleUpload = async () => {
        if (!file) {
            addNotification(
                NotificationTypeEnum.Warning,
                t("community.plugins.upload.warningUploadingPlugin"),
                t("community.plugins.upload.warningUploadingPluginDetails"),
                t("community.plugins.title")
            );
            return;
        }
        const formData = new FormData();
        formData.append("file", file);
        setUploading(true);

        try {
            const response = await api.apiPostTeddyCloudFormDataRaw(`/api/plugins/upload`, formData);

            if (!response.ok) throw new Error(response.statusText);
            addNotification(
                NotificationTypeEnum.Success,
                t("community.plugins.upload.successUploadingPlugin"),
                t("community.plugins.upload.successUploadingPluginDetails", {
                    filename: file.name,
                }),
                t("community.plugins.title")
            );
            setFile(null);
            handleCloseUpload();
            fetchPlugins();
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("community.plugins.upload.errorUploadingPlugin"),
                t("community.plugins.upload.errorUploadingPluginDetails", {
                    filename: file.name,
                }) + error,
                t("community.plugins.title")
            );
        } finally {
            setUploading(false);
        }
    };

    const uploadPluginModal = (
        <Modal
            open={isUploadModalOpen}
            title={t("community.plugins.upload.uploadModal")}
            onCancel={handleCloseUpload}
            onOk={handleUpload}
            okText={t("community.plugins.upload.add")}
            okButtonProps={{ loading: uploading, disabled: !file }}
            cancelButtonProps={{ disabled: uploading }}
        >
            <Paragraph>{t("community.plugins.upload.uploadModalHint")}</Paragraph>
            <Upload
                beforeUpload={() => false}
                onChange={handleFileChange}
                accept=".zip"
                onRemove={() => setFile(null)}
                maxCount={1}
                fileList={file ? [{ uid: file.name, name: file.name }] : []}
            >
                <Button icon={<UploadOutlined />}>{t("community.plugins.upload.selectPluginZip")}</Button>
            </Upload>
        </Modal>
    );

    const handleConfirmDelete = async () => {
        try {
            // TODO: Replace with actual API endpoint
            const response = await api.apiPostTeddyCloudRaw(`/api/plugins/delete/${pluginIdForDeletion}`);

            if (!response.ok) throw new Error(response.statusText);
            addNotification(
                NotificationTypeEnum.Success,
                t("community.plugins.deletion.successDeletingPlugin"),
                t("community.plugins.deletion.successDeletingPluginDetails", {
                    filename: pluginIdForDeletion,
                }),
                t("community.plugins.title")
            );
            setFile(null);
            handleCloseUpload();
            fetchPlugins();
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("community.plugins.deletion.errorDeletingPlugin"),
                t("community.plugins.deletion.errorDeletingPluginDetails", {
                    filename: pluginIdForDeletion,
                }) + error,
                t("community.plugins.title")
            );
        }
        setIsConfirmDeleteModalOpen(false);
    };

    const handleCancelDelete = () => {
        setIsConfirmDeleteModalOpen(false);
    };

    const handleDelete = (pluginId: string) => {
        setPluginIdForDeletion(pluginId);
        setIsConfirmDeleteModalOpen(true);
    };

    const deleteTonieboxModal = (
        <ConfirmationDialog
            title={t("community.plugins.deletion.confirmDeleteModal")}
            open={isConfirmDeleteModalOpen}
            okText={t("community.plugins.deletion.delete")}
            cancelText={t("community.plugins.cancel")}
            content={t("community.plugins.deletion.confirmDeleteDialog", { pluginId: pluginIdForDeletion })}
            handleOk={handleConfirmDelete}
            handleCancel={handleCancelDelete}
        />
    );

    const pluginCountBySection = plugins.reduce<Record<string, number>>((acc, plugin) => {
        const section = plugin.teddyCloudSection || t("community.plugins.filter.unknown");
        acc[section] = (acc[section] || 0) + 1;
        return acc;
    }, {});

    return (
        <>
            <StyledSider>
                <CommunitySubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("community.navigationTitle") },
                        { title: t("community.plugins.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("community.plugins.title")}</h1>
                    {/* WIP remove when implemented */}
                    <Alert
                        type="warning"
                        showIcon
                        message="WIP - To be extended soon... meanwhile you can upload plugins manually using any SFTP-Client and add a plugins.json in the plugins-folder (in WWW directory!) which lists the plugin folders like ['PluginA','PluginB']"
                        style={{ margin: 32 }}
                    />

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "space-between" }}>
                        <Paragraph>{t("community.plugins.intro")}</Paragraph>
                        <Paragraph
                            style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "space-between" }}
                        >
                            <Button disabled icon={<AppstoreAddOutlined />} onClick={() => setIsUploadModalOpen(true)}>
                                {t("community.plugins.addButton")}
                            </Button>
                            <Button icon={<QuestionCircleOutlined />} onClick={() => setIsVisibleHelpModal(true)}>
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
                                            onChange={(checked) => {
                                                setActiveSectionFilters((prev) =>
                                                    checked ? [...prev, section] : prev.filter((s) => s !== section)
                                                );
                                            }}
                                        >
                                            <span>{section.charAt(0).toUpperCase() + section.slice(1)}</span>
                                        </Tag.CheckableTag>
                                    </Badge>
                                );
                            })}
                        </div>
                        <List
                            grid={{
                                gutter: 16,
                                xs: 1,
                                sm: 2,
                                md: 2,
                                lg: 3,
                                xl: 3,
                                xxl: 4,
                            }}
                            dataSource={plugins.filter((plugin) => {
                                const section = plugin.teddyCloudSection || t("community.plugins.filter.unknown");
                                return activeSectionFilters.includes(section);
                            })}
                            renderItem={(plugin) => (
                                <Card
                                    hoverable={false}
                                    size="small"
                                    key={plugin.pluginId}
                                    style={{
                                        paddingLeft: 8,
                                        paddingRight: 8,
                                        width: "100%",
                                        margin: 8,
                                        borderRadius: 8,
                                        background: token.colorBgContainerDisabled,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                    }}
                                    title={
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            {plugin.teddyCloudSection ? (
                                                <Badge.Ribbon
                                                    placement="start"
                                                    text={
                                                        plugin.teddyCloudSection.charAt(0).toUpperCase() +
                                                        plugin.teddyCloudSection.slice(1)
                                                    }
                                                    style={{ marginLeft: 8 }}
                                                >
                                                    <div style={{ marginTop: 28, marginLeft: 16 }}>
                                                        <h3>
                                                            <strong>{plugin.pluginName}</strong>
                                                        </h3>
                                                    </div>
                                                </Badge.Ribbon>
                                            ) : (
                                                <h3>
                                                    <strong>{plugin.pluginName}</strong>
                                                </h3>
                                            )}
                                        </div>
                                    }
                                    actions={[
                                        <Tooltip title={t("community.plugins.open")} key="details">
                                            <DesktopOutlined
                                                style={{ cursor: "pointer" }}
                                                onClick={() => navigate(`/community/plugin/${plugin.pluginId}`)}
                                            />
                                        </Tooltip>,
                                        plugin.pluginHomepage && (
                                            <Tooltip title={t("community.plugins.visitHomepage")} key="homepage">
                                                <HomeOutlined
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => window.open(plugin.pluginHomepage, "_blank")}
                                                />
                                            </Tooltip>
                                        ),
                                        <Tooltip title={t("community.plugins.delete")} key="delete">
                                            <DeleteOutlined
                                                style={{ cursor: "pointer", color: token.colorError }}
                                                onClick={() => handleDelete(plugin.pluginId)}
                                            />
                                        </Tooltip>,
                                    ]}
                                >
                                    <img
                                        style={{
                                            maxHeight: 180,
                                            maxWidth: "100%",
                                            width: "auto",
                                            height: "auto",
                                            borderRadius: 0,
                                        }}
                                        alt={`${plugin.pluginName} preview`}
                                        src={`/web/plugins/${plugin.pluginId}/preview.png`}
                                        onError={(e) => (e.currentTarget.style.display = "none")}
                                    />
                                    <Paragraph type="secondary" style={{ marginBottom: 8 }}>
                                        {plugin.author && `${t("community.plugins.by")} ${plugin.author}`}
                                        {plugin.version && ` - v${plugin.version}`}
                                    </Paragraph>
                                    {plugin.description && (
                                        <Paragraph style={{ marginBottom: 8 }}>{plugin.description}</Paragraph>
                                    )}
                                </Card>
                            )}
                            locale={{ emptyText: t("community.plugins.empty") }}
                        />
                        {helpModal}
                        {deleteTonieboxModal}
                        {uploadPluginModal}
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
