import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Alert, theme, Timeline, Typography } from "antd";
import { CheckCircleOutlined, DeliveredProcedureOutlined, SearchOutlined, SmileOutlined } from "@ant-design/icons";

import { forumUrl, telegramGroupUrl } from "../../../constants";

import { TeddyCloudApi } from "../../../api";
import { defaultAPIConfig } from "../../../config/defaultApiConfig";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../components/StyledComponents";
import { TonieboxesSubNav } from "../../../components/tonieboxes/TonieboxesSubNav";
import { useTeddyCloud } from "../../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../../types/teddyCloudNotificationTypes";
import { handleTCCADerDownload } from "../../../utils/helpers";

const api = new TeddyCloudApi(defaultAPIConfig());

const { Paragraph } = Typography;
const { useToken } = theme;

export const BoxSetupPage = () => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { addNotification } = useTeddyCloud();

    const [newBoxesAllowed, setNewBoxesAllowed] = useState(true);

    useEffect(() => {
        const fetchNewBoxesAllowed = async () => {
            try {
                const newBoxesAllowed = await api.apiGetNewBoxesAllowed();
                setNewBoxesAllowed(newBoxesAllowed);
            } catch (error) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("settings.messages.errorFetchingSetting"),
                    t("settings.messages.errorFetchingSettingDetails", {
                        setting: "core.allowNewBox",
                    }) + error,
                    t("tonieboxes.navigationTitle")
                );
            }
        };
        fetchNewBoxesAllowed();
    }, []);

    const items = [
        {
            children: (
                <>
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
                </>
            ),
            dot: <CheckCircleOutlined />,
            color: token.colorSuccess,
            style: { paddingBottom: 8 },
        },
        {
            children: (
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
            dot: <SearchOutlined />,
            style: { paddingBottom: 8 },
        },
        {
            children: (
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
                </>
            ),
            dot: <DeliveredProcedureOutlined />,
            style: { paddingBottom: 8 },
        },
        {
            children: (
                <>
                    <h5 style={{ marginTop: 8 }}>{t("tonieboxes.boxSetup.useIt")}</h5>
                    <Paragraph>{t("tonieboxes.boxSetup.useItText")}</Paragraph>
                </>
            ),
            dot: <SmileOutlined />,
            style: { paddingBottom: 8 },
        },
    ];

    return (
        <>
            <StyledSider>
                <TonieboxesSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <TonieboxesSubNav />
                </HiddenDesktop>
                <BreadcrumbWrapper
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("tonieboxes.navigationTitle") },
                        { title: t("tonieboxes.boxSetup.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t(`tonieboxes.boxSetup.title`)}</h1>
                    {!newBoxesAllowed && (
                        <Alert
                            type="warning"
                            showIcon
                            message={t("tonieboxes.noNewBoxesAllowed")}
                            description={t("tonieboxes.noNewBoxesAllowedText")}
                            style={{ marginBottom: 16 }}
                        />
                    )}
                    <Alert
                        type="warning"
                        closeIcon
                        showIcon
                        message={t("tonieboxes.hintLatestFirmwareTitle")}
                        description={t("tonieboxes.hintLatestFirmware")}
                    ></Alert>
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
                        <Timeline items={items} />
                    </Paragraph>{" "}
                </StyledContent>
            </StyledLayout>
        </>
    );
};
