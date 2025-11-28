import React from "react";
import { Alert, Button, Select, Tooltip, Typography } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { QuestionCircleOutlined, SyncOutlined } from "@ant-design/icons";

import BreadcrumbWrapper, {
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../../components/common/StyledComponents";
import { TonieboxesSubNav } from "../../../../components/tonieboxes/TonieboxesSubNav";
import { useESP32Flasher } from "../../../../components/tonieboxes/boxsetup/esp32/flashing/hooks/useESP32Flasher";
import { Flashing } from "../../../../components/tonieboxes/boxsetup/esp32/flashing/Flashing";

const { Paragraph } = Typography;
const { Option } = Select;

export const ESP32BoxFlashingPage: React.FC = () => {
    const { t } = useTranslation();
    const flasher = useESP32Flasher();
    const { httpsActive, openHttpsUrl, baudRate, baudRates, handleBaudrateChange } = flasher;

    return (
        <>
            <StyledSider>
                <TonieboxesSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                        { title: <Link to="/tonieboxes">{t("tonieboxes.navigationTitle")}</Link> },
                        { title: <Link to="/tonieboxes/boxsetup">{t("tonieboxes.boxSetup.navigationTitle")}</Link> },
                        { title: t("tonieboxes.esp32BoxFlashing.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                        }}
                    >
                        <h1>{t("tonieboxes.esp32BoxFlashing.title")}</h1>
                        {httpsActive && (
                            <Paragraph
                                style={{
                                    fontSize: "small",
                                    display: "flex",
                                    gap: 8,
                                    width: 210,
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <div style={{ textAlign: "end", textWrap: "nowrap" }}>
                                    {t("tonieboxes.esp32BoxFlashing.baudRate")}
                                </div>
                                <Select defaultValue={baudRate} onChange={handleBaudrateChange}>
                                    {baudRates.map((rate) => (
                                        <Option key={rate} value={rate}>
                                            {rate}
                                        </Option>
                                    ))}
                                </Select>
                                <Tooltip title={t("tonieboxes.esp32BoxFlashing.baudRateInfo")} placement="top">
                                    <QuestionCircleOutlined style={{ fontSize: "18px", cursor: "pointer" }} />
                                </Tooltip>
                            </Paragraph>
                        )}
                    </div>
                    {!httpsActive ? (
                        <>
                            <Alert
                                title={t("tonieboxes.esp32BoxFlashing.attention")}
                                description={
                                    <>
                                        <Paragraph>{t("tonieboxes.esp32BoxFlashing.hint")}</Paragraph>
                                        <Paragraph>
                                            <Button icon={<SyncOutlined />} onClick={openHttpsUrl}>
                                                {t("tonieboxes.esp32BoxFlashing.redirect")}
                                            </Button>
                                        </Paragraph>
                                    </>
                                }
                                type="warning"
                                showIcon
                            />
                            <Paragraph style={{ marginTop: 16 }}>
                                <Paragraph>{t("tonieboxes.esp32BoxFlashing.legacy.followLegacyApproach")}</Paragraph>
                                <Paragraph>
                                    <Link to="/tonieboxes/boxsetup/esp32/legacy">
                                        <Button>{t("tonieboxes.esp32BoxFlashing.legacy.navigationTitle")}</Button>
                                    </Link>
                                </Paragraph>
                            </Paragraph>
                        </>
                    ) : (
                        <Flashing flasher={flasher} />
                    )}
                </StyledContent>
            </StyledLayout>
        </>
    );
};
