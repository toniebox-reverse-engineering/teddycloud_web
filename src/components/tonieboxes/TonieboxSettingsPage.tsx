import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Divider, Form, Radio, message } from "antd";
import { Formik } from "formik";
import { OptionsList, TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import OptionItem from "../utils/OptionItem";

const api = new TeddyCloudApi(defaultAPIConfig());

export const TonieboxSettingsPage: React.FC<{ overlay: string }> = ({ overlay }) => {
    const [options, setOptions] = useState<OptionsList | undefined>();
    const { t } = useTranslation();
    const [settingsLevel, setSettingsLevel] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSettingsLevel = async () => {
            try {
                const response = await api.apiGetTeddyCloudSettingRaw("core.settings_level");

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setSettingsLevel(data.toString());
            } catch (error) {
                console.error("Error fetching settings level: ", error);
            }
        };

        fetchSettingsLevel();
    }, []);

    useEffect(() => {
        const fetchOptions = async () => {
            setLoading(true);
            const optionsRequest = (await api.apiGetIndexGet(overlay)) as OptionsList;
            if (optionsRequest?.options?.length && optionsRequest?.options?.length > 0) {
                setOptions(optionsRequest);
            }

            setLoading(false);
        };

        fetchOptions();
    }, [overlay, settingsLevel]);

    const triggerWriteConfig = async () => {
        try {
            await api.apiTriggerWriteConfigGet();
        } catch (error) {
            message.error("Error while saving config to file.");
        }
    };

    const handleChange = async (value: any) => {
        try {
            await api.apiPostTeddyCloudSetting("core.settings_level", value);
            triggerWriteConfig();
            setSettingsLevel(value);
        } catch (e) {
            message.error("Error while sending data to server.");
        }
    };

    return (
        <>
            <Alert
                message={t("settings.warning")}
                description=<div>{t("settings.warningHint")}</div>
                type="warning"
                showIcon
                style={{ margin: "8px" }}
            />

            <Divider>{t("settings.title")}</Divider>
            <Formik
                // validationSchema={settingsValidationSchema}
                initialValues={{
                    test: "test",
                }}
                onSubmit={(values: any) => {
                    // nothing to submit because of field onchange
                }}
            >
                <Form labelCol={{ span: 8 }} wrapperCol={{ span: 14 }} layout="horizontal">
                    {
                        // to do change that to upcoming flag which indicates if overlaying make sense
                        options?.options?.map((option, index, array) => {
                            if (
                                option.iD.includes("core.settings_level") ||
                                (!option.iD.includes("core.certdir") &&
                                    !option.iD.includes("core.client_cert.") &&
                                    !option.iD.includes("core.flex_") &&
                                    !option.iD.includes("core.contentdir") &&
                                    !option.iD.includes("toniebox.") &&
                                    !option.iD.includes("cloud.enabled") &&
                                    !option.iD.includes("cloud.enableV1Claim") &&
                                    !option.iD.includes("cloud.enableV1CloudReset") &&
                                    !option.iD.includes("cloud.enableV1FreshnessCheck") &&
                                    !option.iD.includes("cloud.enableV1Log") &&
                                    !option.iD.includes("cloud.enableV1Time") &&
                                    !option.iD.includes("cloud.enableV1Ota") &&
                                    !option.iD.includes("cloud.enableV2Content") &&
                                    !option.iD.includes("cloud.cacheOta") &&
                                    !option.iD.includes("cloud.localOta") &&
                                    !option.iD.includes("cloud.cacheContent") &&
                                    !option.iD.includes("cloud.cacheToLibrary") &&
                                    !option.iD.includes("cloud.markCustomTagByPass") &&
                                    !option.iD.includes("cloud.prioCustomContent") &&
                                    !option.iD.includes("cloud.updateOnLowerAudioId") &&
                                    !option.iD.includes("cloud.dumpRuidAuthContentJson"))
                            ) {
                                return null; // Returning null instead of an empty string
                            }

                            const parts = option.iD.split(".");
                            const lastParts = array[index - 1] ? array[index - 1].iD.split(".") : [];
                            return (
                                <React.Fragment key={`option-${option.iD}`}>
                                    {parts.slice(0, -1).map((part, partIndex) => {
                                        if (lastParts[partIndex] !== part) {
                                            if (partIndex === 0) {
                                                return (
                                                    <h3
                                                        style={{
                                                            marginLeft: `${partIndex * 20}px`,
                                                            marginBottom: "10px",
                                                        }}
                                                        key={`category-${part}`}
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
                                                        key={`category-${part}`}
                                                    >
                                                        .{part}
                                                    </h4>
                                                );
                                            }
                                        }
                                        return null;
                                    })}
                                    <OptionItem option={option} overlayId={overlay} key={`option-item-${option.iD}`} />
                                </React.Fragment>
                            );
                        })
                    }
                </Form>
            </Formik>
            <Divider>{t("settings.levelLabel")}</Divider>
            <Radio.Group
                value={settingsLevel}
                onChange={(e) => handleChange(e.target.value)}
                style={{ display: "flex", justifyContent: "center", marginTop: 8 }}
                disabled={loading}
            >
                <Radio.Button value="1">Basic</Radio.Button>
                <Radio.Button value="2">Detail</Radio.Button>
                <Radio.Button value="3">Expert</Radio.Button>
            </Radio.Group>
        </>
    );
};
