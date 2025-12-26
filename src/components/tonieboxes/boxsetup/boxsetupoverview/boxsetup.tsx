import { Link } from "react-router-dom";
import { Alert, Timeline, Typography, theme } from "antd";
import {
    CheckCircleOutlined,
    DeliveredProcedureOutlined,
    SearchOutlined,
    SmileOutlined,
    WarningFilled,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { useNewBoxesAllowed } from "../../../../hooks/getsettings/useGetSettingNewBoxesAllowed";

import { forumUrl, telegramGroupUrl } from "../../../../constants/urls";
import { useReachableNewbieGuideUrls } from "./hooks/useReachableNewbieGuideUrls";
import { handleTCCADerDownload } from "../../../../utils/downloads/handleTCCADerDownload";

const { Paragraph } = Typography;
const { useToken } = theme;

export const BoxSetupContent: React.FC = () => {
    const { t } = useTranslation();
    const { token } = useToken();

    const newBoxesAllowed = useNewBoxesAllowed();
    const reachableNewbieGuideUrls = useReachableNewbieGuideUrls();

    const timelineItems = [
        {
            content: (
                <Paragraph>
                    <h5 style={{ marginTop: 8 }}>{t("tonieboxes.boxSetup.setupTeddyCloud")}</h5>
                    <Paragraph>{t("tonieboxes.boxSetup.setupTeddyCloudText")}</Paragraph>

                    <ul>
                        <li>
                            <Link to="#" onClick={() => handleTCCADerDownload(true)}>
                                {t("tonieboxes.downloadC2DerFile")} (CC3200)
                            </Link>{" "}
                            |{" "}
                            <Link to="#" onClick={() => handleTCCADerDownload(false)}>
                                {t("tonieboxes.downloadCADerFile")} (CC3235, ESP32)
                            </Link>
                        </li>
                    </ul>
                </Paragraph>
            ),
            icon: <CheckCircleOutlined />,
            color: token.colorSuccess,
            style: { paddingBottom: 8 },
        },
        {
            content: (
                <>
                    <h5 style={{ marginTop: 8 }}>{t("tonieboxes.boxSetup.identifyTonieboxVersion")}</h5>
                    <Paragraph>{t("tonieboxes.boxSetup.identifyTonieboxVersionText")}</Paragraph>

                    <ul>
                        <li>
                            <Link to="/tonieboxes/boxsetup/boxversioninfo">
                                {t("tonieboxes.boxSetup.boxVersion.title")}
                            </Link>
                        </li>
                        <li>
                            <Link to="/tonieboxes/boxsetup/openboxguide">
                                {t("tonieboxes.boxSetup.openBoxGuide.title")}
                            </Link>
                        </li>
                        <li>
                            <Link to="/tonieboxes/boxsetup/identifyboxversion">
                                {t("tonieboxes.boxSetup.identifyTonieboxVersion")}
                            </Link>
                        </li>
                    </ul>
                </>
            ),
            icon: <SearchOutlined />,
            style: { paddingBottom: 8 },
        },
        {
            content: (
                <>
                    <h5 style={{ marginTop: 8 }}>{t("tonieboxes.boxSetup.flashBox")}</h5>
                    <Paragraph>{t("tonieboxes.boxSetup.flashBoxText")}</Paragraph>

                    <ul>
                        <li>
                            <Link to="/tonieboxes/boxsetup/esp32/flashing">ESP32</Link>
                            <ul style={{ marginBottom: 0 }}>
                                <li>
                                    <Link to="/tonieboxes/boxsetup/esp32/legacy">
                                        {t("tonieboxes.esp32BoxFlashing.legacy.navigationTitle")}
                                    </Link>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <Link to="/tonieboxes/boxsetup/cc3200/flashing">CC3200</Link>
                        </li>
                        <li>
                            <Link to="/tonieboxes/boxsetup/cc3235/flashing">CC3235</Link>
                        </li>
                    </ul>

                    {reachableNewbieGuideUrls.length > 0 && (
                        <Paragraph style={{ marginTop: 16 }}>
                            <Paragraph>{t("tonieboxes.boxSetup.newbieGuides")}</Paragraph>
                            <ul>
                                {reachableNewbieGuideUrls.map(({ id, url, title }) => (
                                    <li key={id}>
                                        <a href={url} target="_blank">
                                            {title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </Paragraph>
                    )}
                </>
            ),
            icon: <DeliveredProcedureOutlined />,
            style: { paddingBottom: 8 },
        },
        {
            content: (
                <>
                    <h5 style={{ marginTop: 8 }}>{t("tonieboxes.boxSetup.useIt")}</h5>
                    <Paragraph>{t("tonieboxes.boxSetup.useItText")}</Paragraph>
                </>
            ),
            icon: <SmileOutlined />,
            style: { paddingBottom: 8 },
        },
    ];

    return (
        <>
            <h1>{t("tonieboxes.boxSetup.title")}</h1>

            {!newBoxesAllowed.value && (
                <Alert
                    type="warning"
                    showIcon
                    title={t("tonieboxes.noNewBoxesAllowed")}
                    description={t("tonieboxes.noNewBoxesAllowedText")}
                    style={{ marginBottom: 16 }}
                />
            )}

            <Alert
                type="error"
                showIcon
                icon={<WarningFilled />}
                title={t("tonieboxes.warningUseAtYourOwnRisk")}
                description={t("tonieboxes.warningUseAtYourOwnRiskText")}
                style={{ marginBottom: 16 }}
            />

            <Alert
                type="warning"
                closable={{ closeIcon: true, "aria-label": "close" }}
                showIcon
                title={t("tonieboxes.hintLatestFirmwareTitle")}
                description={t("tonieboxes.hintLatestFirmware")}
            />

            <Paragraph style={{ marginTop: 16 }}>
                {t("tonieboxes.boxSetup.boxSetupIntro1")}{" "}
                <Link to={forumUrl} target="_blank">
                    {t("tonieboxes.boxSetup.boxSetupIntroForum")}
                </Link>{" "}
                {t("tonieboxes.boxSetup.boxSetupIntro2")}{" "}
                <Link to={telegramGroupUrl} target="_blank">
                    {t("tonieboxes.boxSetup.boxSetupIntroTelegram")}
                </Link>{" "}
                {t("tonieboxes.boxSetup.boxSetupIntro3")}
            </Paragraph>

            <Paragraph style={{ marginTop: 16 }}>
                <Timeline className="intro" items={timelineItems} />
            </Paragraph>
        </>
    );
};
