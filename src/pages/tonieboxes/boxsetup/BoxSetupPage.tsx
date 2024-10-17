import { useTranslation } from "react-i18next";
import { Alert, theme, Timeline, Typography } from "antd";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../components/StyledComponents";
import { TonieboxesSubNav } from "../../../components/tonieboxes/TonieboxesSubNav";
import { Link } from "react-router-dom";
import { CheckCircleOutlined, DeliveredProcedureOutlined, SearchOutlined, SmileOutlined } from "@ant-design/icons";

const { Paragraph } = Typography;
const { useToken } = theme;

export const BoxSetupPage = () => {
    const { t } = useTranslation();
    const { token } = useToken();

    const items = [
        {
            children: (
                <>
                    <h5 style={{ marginTop: 8 }}>{t("tonieboxes.boxSetup.setupTeddyCloud")}</h5>
                    <Paragraph>{t("tonieboxes.boxSetup.setupTeddyCloudText")}</Paragraph>
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
                    <Alert
                        type="warning"
                        closeIcon
                        showIcon
                        message={t("tonieboxes.hintLatestFirmwareTitle")}
                        description={t("tonieboxes.hintLatestFirmware")}
                    ></Alert>
                    <Paragraph style={{ marginTop: 16 }}>
                        {t("tonieboxes.boxSetup.boxSetupIntro1")}{" "}
                        <Link to="https://forum.revvox.de/" target="_blank">
                            {t("tonieboxes.boxSetup.boxSetupIntroForum")}
                        </Link>{" "}
                        {t("tonieboxes.boxSetup.boxSetupIntro2")}{" "}
                        <Link to="https://t.me/toniebox_reverse_engineering" target="_blank">
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
