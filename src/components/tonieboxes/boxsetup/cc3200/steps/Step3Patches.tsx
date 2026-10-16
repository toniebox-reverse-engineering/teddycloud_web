import { CodeOutlined, ExportOutlined } from "@ant-design/icons";
import { Alert, Button, Collapse, Col, Form, Input, Row, Typography, theme } from "antd";
import { useTranslation } from "react-i18next";

const { Paragraph } = Typography;
const { useToken } = theme;

interface CC3200Step3PatchesProps {
    hostname: string;
    warningTextHostname: string;
    onHostnameChange: (value: string) => void;
    port: string;
    warningTextPort: string;
    onPortChange: (value: string) => void;
    onCreatePortPatch: () => void;
    isPortInvalid: boolean;
}

export const Step3Patches: React.FC<CC3200Step3PatchesProps> = ({
    hostname,
    warningTextHostname,
    onHostnameChange,
    port,
    warningTextPort,
    onPortChange,
    onCreatePortPatch,
    isPortInvalid,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();

    return (
        <>
            <h3>{t("tonieboxes.cc3200BoxFlashing.patches")}</h3>
            <a
                href="https://tonies-wiki.revvox.de/docs/custom-firmware/cc3200/hackieboxng-bl/ofw-patches/"
                target="_blank"
                rel="noopener noreferrer"
            >
                {t("tonieboxes.cc3200BoxFlashing.patchesMoreInformationLink")} {<ExportOutlined />}
            </a>

            <h4>{t("tonieboxes.cc3200BoxFlashing.predefinedUrlPatches")}</h4>
            <Paragraph>{t("tonieboxes.cc3200BoxFlashing.predefinedUrlPatchesIntro")}</Paragraph>

            <Collapse
                size="small"
                items={[
                    {
                        key: "1",
                        label: t("tonieboxes.cc3200BoxFlashing.altUrlFritzBoxPatch.CollapseTitle"),
                        children: (
                            <Paragraph>
                                {t("tonieboxes.cc3200BoxFlashing.altUrlFritzBoxPatch.text")}
                            </Paragraph>
                        ),
                    },
                ]}
                style={{ marginBottom: 16, marginTop: 16 }}
            />

            <Collapse
                size="small"
                items={[
                    {
                        key: "1",
                        label: t("tonieboxes.cc3200BoxFlashing.altUrlPatch.CollapseTitle"),
                        children: (
                            <Paragraph>
                                {t("tonieboxes.cc3200BoxFlashing.altUrlPatch.text")}
                            </Paragraph>
                        ),
                    },
                ]}
                style={{ marginBottom: 16 }}
            />

            <h4>{t("tonieboxes.cc3200BoxFlashing.customUrlPatch")}</h4>

            <Alert
                description={t("tonieboxes.cc3200BoxFlashing.customUrlPatchHint")}
                type="warning"
                style={{ marginBottom: 8 }}
            />

            <Form>
                <Paragraph>{t("tonieboxes.cc3200BoxFlashing.hintPatchHost")}</Paragraph>
                <Form.Item>
                    <Row align="middle" style={{ display: "flex", alignItems: "center" }}>
                        <Col
                            style={{
                                flex: "0 0 200px",
                                color: warningTextHostname ? token.colorErrorText : "unset",
                            }}
                        >
                            <label>{t("tonieboxes.cc3200BoxFlashing.hostname")}</label>
                        </Col>
                        <Col style={{ flex: "1 1 auto" }}>
                            <Input
                                type="text"
                                value={hostname}
                                onChange={(e) => onHostnameChange(e.target.value)}
                            />
                        </Col>
                    </Row>
                    {warningTextHostname && (
                        <p style={{ color: token.colorErrorText }}>{warningTextHostname}</p>
                    )}
                </Form.Item>
            </Form>

            <h4>{t("tonieboxes.cc3200BoxFlashing.customPortPatch")}</h4>

            <Alert
                description={t("tonieboxes.cc3200BoxFlashing.customPortPatchHint")}
                type="info"
                style={{ marginBottom: 8 }}
            />

            <Form>
                <Paragraph>{t("tonieboxes.cc3200BoxFlashing.hintPatchPort")}</Paragraph>
                <Form.Item>
                    <Row align="middle" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Col
                            style={{
                                flex: "0 0 200px",
                                color: warningTextPort ? token.colorErrorText : "unset",
                            }}
                        >
                            <label>{t("tonieboxes.cc3200BoxFlashing.port")}</label>
                        </Col>
                        <Col style={{ flex: "1 1 auto" }}>
                            <Input
                                type="text"
                                inputMode="numeric"
                                value={port}
                                onChange={(e) => onPortChange(e.target.value)}
                            />
                        </Col>
                        <Col>
                            <Button
                                icon={<CodeOutlined />}
                                disabled={isPortInvalid}
                                onClick={onCreatePortPatch}
                            >
                                {t("tonieboxes.cc3200BoxFlashing.createPortPatch")}
                            </Button>
                        </Col>
                    </Row>
                    {warningTextPort && (
                        <p style={{ color: token.colorErrorText }}>{warningTextPort}</p>
                    )}
                </Form.Item>
            </Form>
        </>
    );
};
