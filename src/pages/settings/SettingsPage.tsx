import React from "react";
import { Form, Alert, Divider, Radio, message } from "antd";
import { Link } from "react-router-dom"; // Import Link from React Router
import { useTranslation } from "react-i18next";
import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { SettingsSubNav } from "../../components/settings/SettingsSubNav";
import { OptionsList, TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { useEffect, useState } from "react";
import OptionItem from "../../components/utils/OptionItem";
import { Formik } from "formik";

const api = new TeddyCloudApi(defaultAPIConfig());

/** TODO: Create validation schema for all settings before submitting them to backend
import * as Yup from "yup";
...
const settingsValidationSchema = Yup.object().shape({
  test: Yup.string().required("Dies ist ein Pflichtfeld."),
  booleanToCheck: Yup.string()
    .required("Pflichtfeld.")
    .oneOf(["on"], "Muss true sein."),
});
 */

export const SettingsPage = () => {
    const { t } = useTranslation();
    const [options, setOptions] = useState<OptionsList | undefined>();

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
            const optionsRequest = (await api.apiGetIndexGet("")) as OptionsList;
            if (optionsRequest?.options?.length && optionsRequest?.options?.length > 0) {
                setOptions(optionsRequest);
            }
            setLoading(false);
        };

        fetchOptions();
    }, [settingsLevel]);

    const triggerWriteConfig = async () => {
        try {
            await api.apiTriggerWriteConfigGet();
        } catch (error) {
            message.error("Error while saving config to file.");
        }
    };

    const handleChange = async (value: any) => {
        try {
            api.apiPostTeddyCloudSetting("core.settings_level", value);
            triggerWriteConfig();
            setSettingsLevel(value);
        } catch (e) {
            message.error("Error while sending data to server.");
        }
    };

    return (
        <>
            <StyledSider>
                <SettingsSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <SettingsSubNav />
                </HiddenDesktop>
                <BreadcrumbWrapper
                    items={[{ title: t("home.navigationTitle") }, { title: t("settings.navigationTitle") }]}
                />
                <StyledContent>
                    <h1>{t(`settings.title`)}</h1>
                    <Alert
                        message={t("settings.information")}
                        description=<div>
                            {t("settings.hint")} <Link to="/tonieboxes">{t("settings.tonieboxes")}</Link>.
                        </div>
                        type="info"
                        showIcon
                    />
                    <Alert
                        message={t("settings.warning")}
                        description=<div>{t("settings.warningHint")}</div>
                        type="warning"
                        showIcon
                        style={{ margin: "8px 0" }}
                    />
                    <Divider>{t("settings.title")}</Divider>
                    <Formik
                        //validationSchema={settingsValidationSchema}
                        initialValues={{
                            test: "test",
                        }}
                        onSubmit={(values: any) => {
                            // nothing to submit because of field onchange
                        }}
                    >
                        <Form labelCol={{ span: 8 }} wrapperCol={{ span: 14 }} layout="horizontal">
                            {options?.options?.map((option, index, array) => {
                                if (option.iD.includes("core.settings_level")) {
                                    return null;
                                }
                                const parts = option.iD.split(".");
                                const lastParts = array[index - 1] ? array[index - 1].iD.split(".") : [];
                                return (
                                    <React.Fragment key={index}>
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
                                        <OptionItem option={option} noOverlay={true} key={option.iD} />
                                    </React.Fragment>
                                );
                            })}
                        </Form>
                    </Formik>
                    <Divider>{t("settings.levelLabel")}</Divider>
                    <Radio.Group
                        value={settingsLevel}
                        onChange={(e) => handleChange(e.target.value)}
                        style={{ display: "flex", justifyContent: "center", marginTop: 8 }}
                        disabled={loading}
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
                </StyledContent>
            </StyledLayout>
        </>
    );
};
