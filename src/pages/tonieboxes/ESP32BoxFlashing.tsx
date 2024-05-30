import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

import {
    HiddenDesktop,
    StyledBreadcrumb,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { TonieboxesSubNav } from "../../components/tonieboxes/TonieboxesSubNav";
import { Alert, Button, Divider, Switch, Typography, message } from "antd";
import { Link } from "react-router-dom";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Paragraph, Text } = Typography;

export const ESP32BoxFlashing = () => {
    const { t } = useTranslation();

    const [webHttpOnly, setWebHttpOnly] = useState(false);
    const [httpsClientCertAuth, setHttpsClientCertAuth] = useState(false);

    const [newWebHttpOnly, setNewWebHttpOnly] = useState(false);
    const [newHttpsClientCertAuth, setNewHttpsClientCertAuth] = useState(false);

    const [httpsActive, setHttpsActive] = useState(false);

    useEffect(() => {
        if (window.location.protocol === "https:") {
            setHttpsActive(true);
        } else {
            setHttpsActive(false);
        }
    }, []);

    useEffect(() => {
        const fetchWebHttpOnly = async () => {
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/get/core.webHttpOnly`,
                    {
                        method: "GET",
                    }
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setWebHttpOnly(data.toString() === "true");
                setNewWebHttpOnly(data.toString() === "true");
            } catch (error) {
                console.error("Error fetching web Http only: ", error);
            }
        };

        fetchWebHttpOnly();

        const fetchHttpsClientCertAuth = async () => {
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/get/core.webHttpsCertAuth`,
                    {
                        method: "GET",
                    }
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setHttpsClientCertAuth(data.toString() === "true");
                setNewHttpsClientCertAuth(data.toString() === "true");
            } catch (error) {
                console.error("Error fetching  Https Client Cert Auth: ", error);
            }
        };

        fetchHttpsClientCertAuth();
    }, []);

    const triggerWriteConfig = async () => {
        try {
            await api.apiTriggerWriteConfigGet();
        } catch (error) {
            message.error("Error while saving config to file.");
        }
    };

    const handleHttpOnlyChange = (value: any) => {
        setNewWebHttpOnly(value);
    };

    const handleHttpsClientCertAuthChange = (value: any) => {
        setNewHttpsClientCertAuth(value);
    };

    const handleSaveHttpsSettings = async () => {
        try {
            if (newWebHttpOnly !== webHttpOnly) {
                await fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/set/core.webHttpOnly`, {
                    method: "POST",
                    body: newWebHttpOnly?.toString(),
                    headers: {
                        "Content-Type": "text/plain",
                    },
                });
            }
            if (newHttpsClientCertAuth !== httpsClientCertAuth) {
                await fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/set/core.webHttpsCertAuth`, {
                    method: "POST",
                    body: newHttpsClientCertAuth?.toString(),
                    headers: {
                        "Content-Type": "text/plain",
                    },
                });
            }

            if (newWebHttpOnly !== webHttpOnly || newHttpsClientCertAuth !== httpsClientCertAuth) {
                triggerWriteConfig();

                setWebHttpOnly(newWebHttpOnly);
                setHttpsClientCertAuth(newHttpsClientCertAuth);
            }

            const httpsPort = process.env.REACT_APP_TEDDYCLOUD_PORT_HTTPS || "";
            const httpPort = process.env.REACT_APP_TEDDYCLOUD_PORT_HTTP || "";

            if (!newWebHttpOnly && !httpsActive) {
                // Redirect to the HTTPS URL
                const httpsURL = `https://${window.location.host.replace(httpPort, httpsPort)}${
                    window.location.pathname
                }${window.location.search}`;
                window.location.replace(httpsURL);
            } else if (newWebHttpOnly && httpsActive) {
                // Redirect to the HTTP URL
                const httpURL = `http://${window.location.host.replace(httpsPort, httpPort)}${
                    window.location.pathname
                }${window.location.search}`;
                window.location.replace(httpURL);
            }
        } catch (e) {
            message.error("Error while sending data to server.");
        }
    };

    const ESP32BoxFlashingForm = httpsActive ? (
        <>
            <Alert
                message={t("settings.information")}
                description=<div>
                    Development still in progress - Please use legacy{" "}
                    <Link to={process.env.REACT_APP_TEDDYCLOUD_API_URL?.replace("http", "https") + ""} target="_blank">
                        TeddyCloud Administration GUI
                    </Link>{" "}
                    till development is completed.
                </div>
                type="info"
                showIcon
            />
            <Paragraph>Somewhen in future you will be able to do the flashing here.</Paragraph>
        </>
    ) : (
        <>
            <Alert
                message={t("settings.information")}
                description={t("tonieboxes.esp32BoxFlashing.disableHttpOnlyForFlashing")}
                type="info"
                showIcon
            />
        </>
    );

    return (
        <>
            <StyledSider>
                <TonieboxesSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <TonieboxesSubNav />
                </HiddenDesktop>
                <StyledBreadcrumb
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("tonieboxes.esp32BoxFlashing.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t(`tonieboxes.esp32BoxFlashing.title`)}</h1>
                    <Paragraph>
                        <Alert
                            message={t("tonieboxes.esp32BoxFlashing.attention")}
                            description={t("tonieboxes.esp32BoxFlashing.hint")}
                            type="warning"
                            showIcon
                        />
                    </Paragraph>
                    <Divider>{t("tonieboxes.esp32BoxFlashing.httpsSettings")}</Divider>
                    <Paragraph style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Paragraph>
                            <Switch
                                checked={newWebHttpOnly}
                                onChange={handleHttpOnlyChange}
                                style={{ marginRight: 8 }}
                            />
                            <Text>
                                {t("tonieboxes.esp32BoxFlashing.enabledWebHttpOnly")}
                                {". "}
                            </Text>
                        </Paragraph>
                        <Paragraph>
                            <Switch
                                checked={newHttpsClientCertAuth}
                                onChange={handleHttpsClientCertAuthChange}
                                style={{ marginRight: 8 }}
                            />
                            <Text>
                                {t("tonieboxes.esp32BoxFlashing.enabledWebHttpsClientCertAuth")}
                                {". "}
                            </Text>
                        </Paragraph>

                        <Text>
                            {webHttpOnly
                                ? t("tonieboxes.esp32BoxFlashing.redirectToHttpsAfterDeactivation")
                                : t("tonieboxes.esp32BoxFlashing.redirectToHttpAfterActivation")}
                        </Text>
                        <Button
                            onClick={handleSaveHttpsSettings}
                            style={{ margin: 8 }}
                            disabled={webHttpOnly === newWebHttpOnly && httpsClientCertAuth === newHttpsClientCertAuth}
                        >
                            {t("tonieboxes.esp32BoxFlashing.save")}
                        </Button>
                    </Paragraph>
                    <Divider>{t("tonieboxes.esp32BoxFlashing.title")}</Divider>
                    {ESP32BoxFlashingForm}
                </StyledContent>
            </StyledLayout>
        </>
    );
};
