import React from "react";
import { Alert, Divider, Form, Radio, theme } from "antd";
import { Formik } from "formik";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import SettingsDataHandler from "../../../data/SettingsDataHandler";
import { useTeddyCloud } from "../../../contexts/TeddyCloudContext";
import LoadingSpinner from "../../common/elements/LoadingSpinner";
import SettingsButton from "../../common/buttons/SettingsButtons";
import { SettingsOptionItem } from "../../common/form/SettingsOptionItem";
import { useSettingsData } from "./hooks/useSettingsData";
import { useStickySavePanel } from "./hooks/useStickySavePanel";

const { useToken } = theme;

type SettingsOption = {
    iD: string;
};

export const Settings: React.FC = () => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { addNotification, setFetchCloudStatus } = useTeddyCloud();

    SettingsDataHandler.initialize(addNotification, t, setFetchCloudStatus);

    const { options, settingsLevel, loading, handleChangeSettingsLevel } = useSettingsData();
    const { footerHeight, showArrow } = useStickySavePanel();

    const settingsOptions: SettingsOption[] = (options?.options ?? []) as SettingsOption[];

    const savePanel = (
        <div
            style={{
                position: "sticky",
                bottom: footerHeight - 1,
                padding: "16px 0",
                marginBottom: -24,
                backgroundColor: token.colorBgContainer,
                zIndex: 501,
            }}
            id="save-panel"
            className="sticky-save-panel"
        >
            <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap" }}>
                <div style={{ padding: 8, fontSize: "smaller", color: token.colorTextDescription }}>
                    {showArrow && t("settings.keepScrolling")}
                </div>
                <SettingsButton />
            </div>
        </div>
    );

    return (
        <>
            <h1>{t("settings.title")}</h1>

            <Alert
                message={t("settings.information")}
                description={
                    <div>
                        {t("settings.hint")} <Link to="/tonieboxes">{t("settings.tonieboxes")}</Link>.
                    </div>
                }
                type="info"
                showIcon
            />
            <Alert
                message={t("settings.warning")}
                description={<div>{t("settings.warningHint")}</div>}
                type="info"
                showIcon
                style={{ margin: "8px 0" }}
            />

            <Divider>{t("settings.title")}</Divider>

            {loading ? (
                <LoadingSpinner />
            ) : (
                <Formik
                    initialValues={{
                        test: "test",
                    }}
                    onSubmit={() => {
                        // nichts zu submitten, weil alles per onChange gespeichert wird
                    }}
                >
                    <Form labelCol={{ span: 8 }} wrapperCol={{ span: 14 }} layout="horizontal">
                        {settingsOptions.map((option, index, array) => {
                            if (option.iD.includes("core.settings_level")) {
                                return null;
                            }

                            const parts = option.iD.split(".");
                            const lastParts = array[index - 1] ? array[index - 1].iD.split(".") : [];

                            return (
                                <React.Fragment key={option.iD}>
                                    {parts.slice(0, -1).map((part, partIndex) => {
                                        if (lastParts[partIndex] !== part) {
                                            if (partIndex === 0) {
                                                return (
                                                    <h3
                                                        style={{
                                                            marginLeft: `${partIndex * 20}px`,
                                                            marginBottom: "10px",
                                                        }}
                                                        key={`category-${option.iD}-${partIndex}`}
                                                    >
                                                        Category {part}
                                                    </h3>
                                                );
                                            } else {
                                                return (
                                                    <h4
                                                        style={{
                                                            marginLeft: `${partIndex * 10}px`,
                                                            marginTop: "10px",
                                                            marginBottom: "10px",
                                                        }}
                                                        key={`category-${option.iD}-${partIndex}`}
                                                    >
                                                        .{part}
                                                    </h4>
                                                );
                                            }
                                        }
                                        return null;
                                    })}
                                    <SettingsOptionItem noOverlay={true} iD={option.iD} />
                                </React.Fragment>
                            );
                        })}
                    </Form>
                </Formik>
            )}

            <Divider>{t("settings.levelLabel")}</Divider>

            <Radio.Group
                value={settingsLevel}
                onChange={(e) => handleChangeSettingsLevel(e.target.value)}
                style={{ display: "flex", justifyContent: "center", marginTop: 8 }}
                disabled={loading || SettingsDataHandler.getInstance().hasUnchangedChanges()}
            >
                <Radio.Button value="1" key="1">
                    Basic
                </Radio.Button>
                <Radio.Button value="2" key="2">
                    Detail
                </Radio.Button>
                <Radio.Button value="3" key="3">
                    Expert
                </Radio.Button>
            </Radio.Group>

            {savePanel}
        </>
    );
};
