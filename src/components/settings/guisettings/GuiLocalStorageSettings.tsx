import { Alert, Button, Collapse, Divider, Typography, Upload } from "antd";
import type { UploadProps } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useGuiLocalSettings } from "./hooks/useGUILocalSettings";

const { Panel } = Collapse;
const { Title, Text } = Typography;

export const GuiLocalStorageSettings = () => {
    const { t } = useTranslation();

    const { localSettings, settingKeys, exportLocalStorage, importFromJsonString } = useGuiLocalSettings();

    const beforeUpload: UploadProps["beforeUpload"] = (file) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target?.result;
            if (typeof content === "string") {
                importFromJsonString(content);
            }
        };

        reader.readAsText(file);
        return false;
    };

    return (
        <>
            <Title level={2}>{t("settings.guiSettings.title")}</Title>
            <Divider />

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {settingKeys.length > 0 && (
                    <Button type="primary" onClick={exportLocalStorage}>
                        {t("settings.guiSettings.exportSettings")}
                    </Button>
                )}

                <Upload beforeUpload={beforeUpload} showUploadList={false} accept=".json">
                    <Button icon={<UploadOutlined />}>{t("settings.guiSettings.importSettings")}</Button>
                </Upload>
            </div>

            {settingKeys.length === 0 ? (
                <Alert type="info" title={t("settings.guiSettings.noLocalSettings")} />
            ) : (
                <Collapse accordion>
                    {settingKeys.map((key) => {
                        const value = localSettings[key];

                        return (
                            <Panel header={<Text strong>{key}</Text>} key={key}>
                                <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                    {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                                </pre>
                            </Panel>
                        );
                    })}
                </Collapse>
            )}
        </>
    );
};
