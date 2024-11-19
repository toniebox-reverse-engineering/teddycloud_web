import { Alert, Divider, Form, Radio, theme } from "antd";
import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom"; // Import Link from React Router
import { OptionsList, TeddyCloudApi } from "../../api";
import { SettingsSubNav } from "../../components/settings/SettingsSubNav";
import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import SettingsDataHandler from "../../data/SettingsDataHandler";
import { SettingsOptionItem } from "../../components/form/SettingsOptionItem";
import SettingsButton from "../../components/utils/SettingsButtons";
import LoadingSpinner from "../../components/utils/LoadingSpinner";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";

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

const { useToken } = theme;

export const SettingsPage = () => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { addNotification, setFetchCloudStatus } = useTeddyCloud();

    const [options, setOptions] = useState<OptionsList | undefined>();
    const [footerHeight, setFooterHeight] = useState(51);
    const [showArrow, setShowArrow] = useState(true);
    const [settingsLevel, setSettingsLevel] = useState("");
    const [loading, setLoading] = useState(true);

    SettingsDataHandler.initialize(addNotification, t, setFetchCloudStatus);

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
        if (!settingsLevel) return;
        const fetchOptions = async () => {
            setLoading(true);
            const optionsRequest = (await api.apiGetIndexGet("")) as OptionsList;
            if (optionsRequest?.options?.length && optionsRequest?.options?.length > 0) {
                setOptions(optionsRequest);
                SettingsDataHandler.getInstance().initializeSettings(optionsRequest.options, undefined);
            }
            setLoading(false);
        };

        settingsLevel ? fetchOptions() : "";
    }, [settingsLevel]);

    const triggerWriteConfig = async () => {
        try {
            await api.apiTriggerWriteConfigGet();
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("settings.errorWhileSavingConfig"),
                t("settings.errorWhileSavingConfigDetails") + error,
                t("tonieboxes.navigationTitle")
            );
        }
    };

    const handleChange = async (value: any) => {
        try {
            await api.apiPostTeddyCloudSetting("core.settings_level", value);
            triggerWriteConfig();
            setSettingsLevel(value);
        } catch (e) {
            addNotification(
                NotificationTypeEnum.Error,
                t("settings.errorWhileSavingConfig"),
                t("settings.errorWhileSavingConfigDetails") + e,
                t("tonieboxes.navigationTitle")
            );
        }
    };

    useEffect(() => {
        const footerElement = document.querySelector("footer") as HTMLElement | null;
        const updateFooterHeightAndScrollState = () => {
            if (footerElement) {
                setFooterHeight(footerElement.offsetHeight || 0);
            }

            const scrollTop = window.scrollY;
            const windowHeight = window.innerHeight;
            const fullHeight = document.documentElement.scrollHeight;

            if (scrollTop + windowHeight >= fullHeight - 20) {
                setShowArrow(false);
            } else {
                setShowArrow(true);
            }
        };

        let resizeObserver: ResizeObserver | null = null;
        if (footerElement) {
            setFooterHeight(footerElement.offsetHeight || 0);
            resizeObserver = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    const target = entry.target as HTMLElement;
                    if (target === footerElement) {
                        setFooterHeight(target.offsetHeight);
                    }
                }
                updateFooterHeightAndScrollState();
            });
            resizeObserver.observe(footerElement);
        }

        window.addEventListener("scroll", updateFooterHeightAndScrollState);
        window.addEventListener("resize", updateFooterHeightAndScrollState);

        updateFooterHeightAndScrollState();

        return () => {
            window.removeEventListener("scroll", updateFooterHeightAndScrollState);
            window.removeEventListener("resize", updateFooterHeightAndScrollState);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, []);

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
                <SettingsButton></SettingsButton>
            </div>
        </div>
    );

    return (
        <>
            <StyledSider>
                <SettingsSubNav />
            </StyledSider>
            <StyledLayout>
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
                        type="info"
                        showIcon
                        style={{ margin: "8px 0" }}
                    />
                    <Divider>{t("settings.title")}</Divider>
                    {loading ? (
                        <LoadingSpinner />
                    ) : (
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
                        onChange={(e) => handleChange(e.target.value)}
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
                </StyledContent>
            </StyledLayout>
        </>
    );
};
