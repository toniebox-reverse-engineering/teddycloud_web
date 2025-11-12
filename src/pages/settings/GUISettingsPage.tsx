import { Alert, Button, Collapse, Divider, Typography, Upload, message } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { SettingsSubNav } from "../../components/settings/SettingsSubNav";
import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { UploadOutlined } from "@ant-design/icons";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";

import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

const { Panel } = Collapse;
const { Title, Text } = Typography;

const api = new TeddyCloudApi(defaultAPIConfig());

export const GUISettingsPage = () => {
    const { t } = useTranslation();

    const { addNotification } = useTeddyCloud();
    const [localSettings, setLocalSettings] = useState<Record<string, any>>({});

    useEffect(() => {
        loadLocalSettings();
    }, []);

    const loadLocalSettings = () => {
        const entries: Record<string, any> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                try {
                    entries[key] = JSON.parse(localStorage.getItem(key) || "null");
                } catch {
                    entries[key] = localStorage.getItem(key);
                }
            }
        }
        setLocalSettings(entries);
    };

    const handleExportLocalStorage = async () => {
        const exportData: Record<string, any> = {};
        let tcversion = "";

        await api
            .apiGetTeddyCloudSettingRaw("internal.version.v_long")
            .then((response) => response.text())
            .then((data) => (tcversion = data))
            .catch((error) => console.error("Error fetching data:", error));

        exportData.teddycloudExport = {
            teddycloudVersion: tcversion,
            exportVersion: "1.0",
            exportedAt: new Date().toISOString(),
        };

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                try {
                    exportData[key] = JSON.parse(localStorage.getItem(key) || "null");
                } catch {
                    exportData[key] = localStorage.getItem(key);
                }
            }
        }

        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, "0");
        const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        const filename = `teddycloud_local_storage_${dateStr}_${timeStr}.json`;

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target?.result as string);

                if (!importedData.teddycloudExport) {
                    throw new Error("Invalid Teddycloud JSON file");
                }

                delete importedData.teddycloudExport;

                Object.entries(importedData).forEach(([key, value]) => {
                    localStorage.setItem(key, JSON.stringify(value));
                });
                loadLocalSettings();

                addNotification(
                    NotificationTypeEnum.Success,
                    t("settings.guiSettings.jsonLoaded"),
                    t("settings.guiSettings.jsonLoadedDetails"),
                    t("settings.title")
                );
            } catch (err) {
                console.error(err);
                addNotification(
                    NotificationTypeEnum.Error,
                    t("settings.guiSettings.jsonLoadFailed"),
                    t("settings.guiSettings.jsonLoadFailedDetails") + err,
                    t("settings.title")
                );
            }
        };
        reader.readAsText(file);
        return false;
    };

    const settingKeys = Object.keys(localSettings);

    return (
        <>
            <StyledSider>
                <SettingsSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                        { title: <Link to="/settings">{t("settings.navigationTitle")}</Link> },
                        { title: t("settings.guiSettings.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <Title level={2}>{t("settings.guiSettings.title")}</Title>
                    <Divider />

                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        {settingKeys.length > 0 ? (
                            <Button type="primary" onClick={handleExportLocalStorage}>
                                {t("settings.guiSettings.exportSettings")}
                            </Button>
                        ) : (
                            ""
                        )}

                        <Upload beforeUpload={handleUpload} showUploadList={false} accept=".json">
                            <Button icon={<UploadOutlined />}>{t("settings.guiSettings.importSettings")}</Button>
                        </Upload>
                    </div>

                    {settingKeys.length === 0 ? (
                        <Alert type="info" message={t("settings.guiSettings.noLocalSettings")} />
                    ) : (
                        <Collapse accordion>
                            {settingKeys.map((key) => (
                                <Panel header={<Text strong>{key}</Text>} key={key}>
                                    <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                        {typeof localSettings[key] === "object"
                                            ? JSON.stringify(localSettings[key], null, 2)
                                            : String(localSettings[key])}
                                    </pre>
                                </Panel>
                            ))}
                        </Collapse>
                    )}
                </StyledContent>
            </StyledLayout>
        </>
    );
};
