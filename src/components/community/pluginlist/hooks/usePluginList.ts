import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { useTeddyCloud } from "../../../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { TeddyCloudPlugin } from "../../plugincard/PluginCard";

const api = new TeddyCloudApi(defaultAPIConfig());

export const usePluginList = () => {
    const { t } = useTranslation();
    const { addNotification, plugins, fetchPlugins } = useTeddyCloud();

    const [isVisibleHelpModal, setIsVisibleHelpModal] = useState(false);
    const [pluginIdForDeletion, setPluginIdForDeletion] = useState<string>("");
    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);

    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const allSections = useMemo(
        () =>
            Array.from(new Set(plugins.map((p: any) => p.teddyCloudSection || t("community.plugins.filter.unknown")))),
        [plugins, t]
    );

    const [activeSectionFilters, setActiveSectionFilters] = useState<string[]>(allSections);

    useEffect(() => {
        setActiveSectionFilters(allSections);
    }, [allSections]);

    const pluginCountBySection = useMemo(
        () =>
            (plugins as TeddyCloudPlugin[]).reduce<Record<string, number>>((acc, plugin) => {
                const section = plugin.teddyCloudSection || t("community.plugins.filter.unknown");
                acc[section] = (acc[section] || 0) + 1;
                return acc;
            }, {}),
        [plugins, t]
    );

    const filteredPlugins = useMemo(
        () =>
            (plugins as TeddyCloudPlugin[]).filter((plugin) => {
                const section = plugin.teddyCloudSection || t("community.plugins.filter.unknown");
                return activeSectionFilters.includes(section);
            }),
        [plugins, activeSectionFilters, t]
    );

    const toggleSectionFilter = (section: string, checked: boolean) => {
        setActiveSectionFilters((prev) => (checked ? [...prev, section] : prev.filter((s) => s !== section)));
    };

    const openHelp = () => setIsVisibleHelpModal(true);
    const closeHelp = () => setIsVisibleHelpModal(false);

    const openUpload = () => setIsUploadModalOpen(true);
    const closeUpload = () => {
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
            closeUpload();
            fetchPlugins();
        } catch (error: any) {
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

    const handleConfirmDelete = async () => {
        try {
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
            closeUpload();
            fetchPlugins();
        } catch (error: any) {
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

    const requestDelete = (pluginId: string) => {
        setPluginIdForDeletion(pluginId);
        setIsConfirmDeleteModalOpen(true);
    };

    return {
        // data
        plugins: plugins as TeddyCloudPlugin[],
        filteredPlugins,
        allSections,
        activeSectionFilters,
        pluginCountBySection,

        // filters
        toggleSectionFilter,

        // help modal
        isVisibleHelpModal,
        openHelp,
        closeHelp,

        // upload modal
        isUploadModalOpen,
        openUpload,
        closeUpload,
        file,
        setFile,
        uploading,
        handleUpload,

        // delete dialog
        isConfirmDeleteModalOpen,
        pluginIdForDeletion,
        requestDelete,
        handleConfirmDelete,
        handleCancelDelete,
    };
};
