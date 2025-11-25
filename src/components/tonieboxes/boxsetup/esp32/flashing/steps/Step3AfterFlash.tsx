import React from "react";
import { Alert, Button, Collapse, Divider, theme, Typography } from "antd";

import { ESP32Flasher } from "../hooks/useESP32Flasher";
import { useTranslation } from "react-i18next";
import { SafetyCertificateOutlined } from "@ant-design/icons";

const { Paragraph, Text } = Typography;
const { useToken } = theme;

interface Step3Props {
    state: ESP32Flasher;
    certDir: string;
    disableButtons: boolean;
    contentProgress: React.ReactNode;
    extractCertsFromFlash: () => void;
}

export const Step3AfterFlash: React.FC<Step3Props> = ({
    state,
    certDir,
    disableButtons,
    contentProgress,
    extractCertsFromFlash,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();

    const stepStatusText = state.showStatus && (
        <div className="status" style={{ marginBottom: 16, color: state.error ? token.colorErrorText : "unset" }}>
            <i>{state.state}</i>
        </div>
    );

    const certDirWithMac = `${certDir}/${state.chipMac ? state.chipMac.replaceAll(":", "").toLowerCase() : "<mac>"}`;

    return state.resetBox ? (
        <>
            <h3>{t("tonieboxes.esp32BoxFlashing.esp32flasher.titleESP32FirmwareFlashed")}</h3>
            <Paragraph>
                <Alert
                    type="success"
                    description={t("tonieboxes.esp32BoxFlashing.esp32flasher.hintESP32FirmwareReseted")}
                />
            </Paragraph>
            {stepStatusText}
            {contentProgress}
        </>
    ) : (
        <>
            <h3>{t("tonieboxes.esp32BoxFlashing.esp32flasher.titleESP32FirmwareFlashed")}</h3>
            <Paragraph>
                <Alert
                    type="success"
                    description={t("tonieboxes.esp32BoxFlashing.esp32flasher.hintESP32FirmwareFlashed")}
                />
            </Paragraph>
            {stepStatusText}
            {contentProgress}
            {(state.downloadLink || state.downloadLinkPatched) && (
                <>
                    <Alert
                        type="info"
                        style={{ marginTop: 16 }}
                        showIcon={true}
                        title={t("tonieboxes.esp32BoxFlashing.esp32flasher.extractCertificates")}
                        description={
                            <div>
                                <Typography>
                                    <Divider>{t("tonieboxes.esp32BoxFlashing.esp32flasher.automatically")}</Divider>
                                    <Paragraph>
                                        {t(
                                            "tonieboxes.esp32BoxFlashing.esp32flasher.extractCertificatesAutomaticallyHint"
                                        )}
                                    </Paragraph>
                                    <Button
                                        icon={<SafetyCertificateOutlined />}
                                        disabled={disableButtons}
                                        type="primary"
                                        onClick={extractCertsFromFlash}
                                        style={{ marginBottom: 8 }}
                                    >
                                        {t("tonieboxes.esp32BoxFlashing.esp32flasher.extractCertificates")}
                                    </Button>
                                    <Paragraph>
                                        {t(
                                            "tonieboxes.esp32BoxFlashing.esp32flasher.extractCertificatesAutomaticallyHint2",
                                            {
                                                certDir,
                                                mac: state.chipMac.replaceAll(":", "").toLocaleLowerCase(),
                                            }
                                        )}
                                    </Paragraph>
                                </Typography>
                                <Divider>{t("tonieboxes.esp32BoxFlashing.esp32flasher.manually")}</Divider>
                                <Typography style={{ marginBottom: 8 }}>
                                    {t("tonieboxes.esp32BoxFlashing.esp32flasher.extractCertificatesManuallyHint")}
                                </Typography>
                                <Typography>
                                    <Collapse
                                        size="small"
                                        items={[
                                            {
                                                key: "1",
                                                label: t(
                                                    "tonieboxes.esp32BoxFlashing.esp32flasher.extractCertificatesManually"
                                                ),
                                                children: (
                                                    <Typography>
                                                        <Paragraph>
                                                            {t(
                                                                "tonieboxes.esp32BoxFlashing.esp32flasher.extractCertificatesManuallyHintP1"
                                                            )}{" "}
                                                            <Text code>
                                                                docker exec -it &lt;container-name&gt; bash
                                                            </Text>
                                                            .
                                                        </Paragraph>

                                                        <Paragraph>
                                                            <pre style={{ fontSize: 12 }}>
                                                                {`# Please check the filename of your backup
# Be sure you are in the TeddyCloud directory
# cd /teddycloud/ # just for docker
mkdir ${certDirWithMac}
teddycloud --esp32-extract data/firmware/` +
                                                                    (state.filename
                                                                        ? state.filename
                                                                        : "ESP32_<mac>.bin") +
                                                                    ` --destination ${certDirWithMac}`}
                                                            </pre>
                                                        </Paragraph>
                                                        <Paragraph>
                                                            {t(
                                                                "tonieboxes.esp32BoxFlashing.esp32flasher.extractCertificatesManuallyHintP2"
                                                            )}
                                                        </Paragraph>
                                                        <Paragraph>
                                                            <pre style={{ fontSize: 12 }}>
                                                                {`mv ${certDirWithMac}/CLIENT.DER ${certDirWithMac}/client.der
mv ${certDirWithMac}/PRIVATE.DER ${certDirWithMac}/private.der
mv ${certDirWithMac}/CA.DER ${certDirWithMac}/ca.der`}
                                                            </pre>
                                                        </Paragraph>

                                                        <Paragraph>
                                                            {t(
                                                                "tonieboxes.esp32BoxFlashing.esp32flasher.extractCertificatesManuallyHintP3"
                                                            )}
                                                        </Paragraph>
                                                        <Paragraph>
                                                            <pre style={{ fontSize: 12 }}>
                                                                {`cp ${certDirWithMac}/client.der ${certDir}/client.der
cp ${certDirWithMac}/private.der ${certDir}/private.der
cp ${certDirWithMac}/ca.der ${certDir}/ca.der`}
                                                            </pre>
                                                        </Paragraph>
                                                    </Typography>
                                                ),
                                            },
                                        ]}
                                    />
                                </Typography>
                            </div>
                        }
                    />
                    <Paragraph style={{ marginTop: 16 }}>
                        {t("tonieboxes.esp32BoxFlashing.esp32flasher.downloadFlashFilesHint")}
                        <ul style={{ marginTop: 8 }}>
                            {state.downloadLink && (
                                <li>
                                    <a href={state.downloadLink} download={state.filename} title={state.filename}>
                                        {t("tonieboxes.esp32BoxFlashing.esp32flasher.downloadLink")}
                                    </a>
                                </li>
                            )}
                            {state.downloadLinkPatched && (
                                <li>
                                    <a
                                        href={state.downloadLinkPatched}
                                        download={"patched_" + state.filename}
                                        title={"patched_" + state.filename}
                                    >
                                        {t("tonieboxes.esp32BoxFlashing.esp32flasher.downloadLinkPatched")}
                                    </a>
                                </li>
                            )}
                        </ul>
                    </Paragraph>
                </>
            )}
        </>
    );
};
