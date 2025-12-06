import React from "react";
import { Alert, Col, Divider, Form, Input, Row, theme, Typography } from "antd";
import { Checkbox } from "antd";

import { ESP32Flasher } from "../hooks/useESP32Flasher";
import { useTranslation } from "react-i18next";

const { Paragraph } = Typography;
const { useToken } = theme;
interface Step1Props {
    state: ESP32Flasher;
    setState: React.Dispatch<React.SetStateAction<ESP32Flasher>>;
    backupHint: React.ReactNode;
    contentProgress: React.ReactNode;
}

const sanitizeHostname = (input: string) => {
    return input.replace(/[^a-zA-Z0-9-.]/g, "").trim();
};

export const Step1PatchFlash: React.FC<Step1Props> = ({ state, setState, backupHint, contentProgress }) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const stepStatusText = state.showStatus && (
        <div className="status" style={{ marginBottom: 16, color: state.error ? token.colorErrorText : "unset" }}>
            <i>{state.state}</i>
        </div>
    );

    return (
        <>
            <h3>{t("tonieboxes.esp32BoxFlashing.esp32flasher.titlePatchFlash")}</h3>
            <div>
                {!state.actionInProgress && (
                    <Paragraph>
                        <Alert type="info" description={t("tonieboxes.esp32BoxFlashing.esp32flasher.hintPatchFlash")} />
                    </Paragraph>
                )}
                {stepStatusText}
                {!state.actionInProgress && state.downloadLink ? (
                    <Paragraph style={{ marginBottom: 16 }}>{backupHint}</Paragraph>
                ) : (
                    ""
                )}
                <Form>
                    <Divider>{t("tonieboxes.esp32BoxFlashing.esp32flasher.hostnameSettings")}</Divider>
                    <Paragraph>{t("tonieboxes.esp32BoxFlashing.esp32flasher.hintPatchHost")}</Paragraph>
                    <Form.Item>
                        <Row align="middle" style={{ display: "flex", alignItems: "center" }}>
                            <Col>
                                <Checkbox
                                    checked={state.flagPreviousHostname}
                                    onChange={(e) => {
                                        setState((prev) => ({
                                            ...prev,
                                            flagPreviousHostname: e.target.checked,
                                        }));
                                    }}
                                >
                                    {t("tonieboxes.esp32BoxFlashing.esp32flasher.flagPreviousHostname")}
                                </Checkbox>
                            </Col>
                        </Row>
                    </Form.Item>
                    {state.flagPreviousHostname && (
                        <Form.Item>
                            <Row align="middle" style={{ display: "flex", alignItems: "center" }}>
                                <Col style={{ flex: "0 0 200px" }}>
                                    <label>{t("tonieboxes.esp32BoxFlashing.esp32flasher.previousHostname")}</label>
                                </Col>
                                <Col style={{ flex: "1 1 auto" }}>
                                    <Input
                                        type="text"
                                        value={state.previousHostname}
                                        onChange={(e) => {
                                            const value = sanitizeHostname(e.target.value);
                                            setState((prev) => ({
                                                ...prev,
                                                previousHostname: value,
                                            }));
                                        }}
                                    />
                                </Col>
                            </Row>
                            {state.warningTextHostname && (
                                <p style={{ color: token.colorErrorText }}>
                                    {t("tonieboxes.esp32BoxFlashing.esp32flasher.hostnameTooLong")}
                                </p>
                            )}
                        </Form.Item>
                    )}

                    <Form.Item>
                        <Row align="middle" style={{ display: "flex", alignItems: "center" }}>
                            <Col
                                style={{
                                    flex: "0 0 200px",
                                    color: state.warningTextHostname ? token.colorErrorText : "unset",
                                }}
                            >
                                <label>{t("tonieboxes.esp32BoxFlashing.esp32flasher.hostname")}</label>
                            </Col>
                            <Col style={{ flex: "1 1 auto" }}>
                                <Input
                                    type="text"
                                    value={state.hostname}
                                    onChange={(e) => {
                                        const value = sanitizeHostname(e.target.value);
                                        let warningText = "";
                                        if (value.length > 12) {
                                            warningText = t("tonieboxes.esp32BoxFlashing.esp32flasher.hostnameTooLong");
                                        }
                                        setState((prev) => ({
                                            ...prev,
                                            hostname: value,
                                            warningTextHostname: warningText,
                                        }));
                                    }}
                                />
                            </Col>
                        </Row>
                        {state.warningTextHostname && (
                            <p style={{ color: token.colorErrorText }}>
                                {t("tonieboxes.esp32BoxFlashing.esp32flasher.hostnameTooLong")}
                            </p>
                        )}
                    </Form.Item>

                    <Divider>{t("tonieboxes.esp32BoxFlashing.esp32flasher.wifiSettings")}</Divider>
                    <Paragraph>{t("tonieboxes.esp32BoxFlashing.esp32flasher.hintPatchWifi")}</Paragraph>
                    <Form.Item>
                        <Row align="middle" style={{ display: "flex", alignItems: "center" }}>
                            <Col
                                style={{
                                    flex: "0 0 200px",
                                    color: state.warningTextWifi ? token.colorErrorText : "unset",
                                }}
                            >
                                <label>{t("tonieboxes.esp32BoxFlashing.esp32flasher.wifiSSID")}</label>
                            </Col>
                            <Col style={{ flex: "1 1 auto" }}>
                                <Input
                                    autoComplete="off"
                                    name="wifi-ssid"
                                    id="wifi-ssid"
                                    type="text"
                                    defaultValue={state.wifi_ssid}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setState((prev) => ({
                                            ...prev,
                                            wifi_ssid: value,
                                            warningTextWifi:
                                                (e.target.value && state.wifi_pass) ||
                                                (!e.target.value && !state.wifi_pass)
                                                    ? ""
                                                    : t(
                                                          "tonieboxes.esp32BoxFlashing.esp32flasher.wifiCredentialsIncomplete"
                                                      ),
                                        }));
                                    }}
                                />
                            </Col>
                        </Row>
                    </Form.Item>
                    <Form.Item>
                        <Row align="middle" style={{ display: "flex", alignItems: "center" }}>
                            <Col
                                style={{
                                    flex: "0 0 200px",
                                    color: state.warningTextWifi ? token.colorErrorText : "unset",
                                }}
                            >
                                <label>{t("tonieboxes.esp32BoxFlashing.esp32flasher.wifiPassword")}</label>
                            </Col>
                            <Col style={{ flex: "1 1 auto" }}>
                                <Input.Password
                                    autoComplete="new-password"
                                    name="wifi-pass"
                                    id="wifi-pass"
                                    defaultValue={state.wifi_pass}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setState((prev) => ({
                                            ...prev,
                                            wifi_pass: value,
                                            warningTextWifi:
                                                (e.target.value && state.wifi_ssid) ||
                                                (!e.target.value && !state.wifi_ssid)
                                                    ? ""
                                                    : t(
                                                          "tonieboxes.esp32BoxFlashing.esp32flasher.wifiCredentialsIncomplete"
                                                      ),
                                        }));
                                    }}
                                />
                            </Col>
                        </Row>
                        {state.warningTextWifi && (
                            <p style={{ color: token.colorErrorText }}>
                                {t("tonieboxes.esp32BoxFlashing.esp32flasher.wifiCredentialsIncomplete")}
                            </p>
                        )}
                    </Form.Item>
                </Form>
            </div>
            {contentProgress}
        </>
    );
};
