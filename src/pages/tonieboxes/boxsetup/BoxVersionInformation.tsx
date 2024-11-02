import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, Col, List, Row, Typography } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../components/StyledComponents";
import { TonieboxesSubNav } from "../../../components/tonieboxes/TonieboxesSubNav";

const { Paragraph, Title } = Typography;

export const BoxVersionInformationPage = () => {
    const { t } = useTranslation();

    interface Version {
        name: string;
        pros: string[];
        cons: string[];
    }

    interface VersionCardsProps {
        versions: Version[];
    }

    const versionsData: Version[] = [
        {
            name: "V1/V2 CC3200",
            pros: [
                t("tonieboxes.boxSetup.boxVersion.cc3200pro1"),
                t("tonieboxes.boxSetup.boxVersion.cc3200pro2"),
                t("tonieboxes.boxSetup.boxVersion.cc3200pro3"),
                t("tonieboxes.boxSetup.boxVersion.cc3200pro4"),
                t("tonieboxes.boxSetup.boxVersion.cc3200pro5"),
            ],
            cons: [t("tonieboxes.boxSetup.boxVersion.cc3200con1")],
        },
        {
            name: "V3 CC3235",
            pros: [],
            cons: [
                t("tonieboxes.boxSetup.boxVersion.cc3235con1"),
                t("tonieboxes.boxSetup.boxVersion.cc3235con2"),
                t("tonieboxes.boxSetup.boxVersion.cc3235con3"),
            ],
        },
        {
            name: "V4 ESP32",
            pros: [
                t("tonieboxes.boxSetup.boxVersion.esp32pro1"),
                t("tonieboxes.boxSetup.boxVersion.esp32pro2"),
                t("tonieboxes.boxSetup.boxVersion.esp32pro3"),
            ],
            cons: [t("tonieboxes.boxSetup.boxVersion.esp32con1"), t("tonieboxes.boxSetup.boxVersion.esp32con2")],
        },
    ];

    const VersionCards: React.FC<VersionCardsProps> = ({ versions }) => (
        <Row gutter={16} justify="start">
            {versions.map((version, index) => (
                <Col key={index} xs={24} md={12} xl={8}>
                    <Card title={version.name} size="small" bordered style={{ marginBottom: 8 }}>
                        <Title level={5} style={{ marginTop: 0 }}>
                            {t("tonieboxes.boxSetup.boxVersion.pros")}
                        </Title>
                        {version.pros.length > 0 ? (
                            <List
                                dataSource={version.pros}
                                renderItem={(item) => (
                                    <List.Item>
                                        <CheckOutlined style={{ color: "green", marginRight: 8 }} />
                                        <Paragraph style={{ marginBottom: 0, textAlign: "right" }}>{item}</Paragraph>
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <List.Item>
                                <Paragraph style={{ marginBottom: 0, textAlign: "center" }}>
                                    {t("tonieboxes.boxSetup.boxVersion.emptyPros")}
                                </Paragraph>
                            </List.Item>
                        )}
                        <Title level={5} style={{ marginTop: 0 }}>
                            {t("tonieboxes.boxSetup.boxVersion.cons")}
                        </Title>
                        {version.cons.length > 0 ? (
                            <List
                                dataSource={version.cons}
                                renderItem={(item) => (
                                    <List.Item>
                                        <CloseOutlined style={{ color: "red", marginRight: 8 }} />
                                        <Paragraph style={{ marginBottom: 0, textAlign: "right" }}>{item}</Paragraph>
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <List.Item>
                                <Paragraph style={{ marginBottom: 0, textAlign: "center" }}>
                                    {t("tonieboxes.boxSetup.boxVersion.emptyCons")}
                                </Paragraph>
                            </List.Item>
                        )}
                    </Card>
                </Col>
            ))}
        </Row>
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
                <BreadcrumbWrapper
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("tonieboxes.navigationTitle") },
                        { title: t("tonieboxes.boxSetup.boxVersion.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("tonieboxes.boxSetup.boxVersion.title")}</h1>
                    <Paragraph>
                        {t("tonieboxes.boxSetup.boxVersion.intro")}
                        <ul>
                            <li>
                                <b>V1/V2</b>: {t("tonieboxes.boxSetup.boxVersion.uses")} TI CC3200
                            </li>
                            <li>
                                <b>V3</b>: {t("tonieboxes.boxSetup.boxVersion.uses")} TI CC3235
                            </li>
                            <li>
                                <b>V4</b>: {t("tonieboxes.boxSetup.boxVersion.uses")} ESP32
                            </li>
                        </ul>
                    </Paragraph>
                    <h3>{t("tonieboxes.boxSetup.boxVersion.whatVersion")}</h3>
                    <Paragraph>{t("tonieboxes.boxSetup.boxVersion.whatVersionIntro")}</Paragraph>
                    <VersionCards versions={versionsData} />
                    <h4>{t("tonieboxes.boxSetup.boxVersion.whatVersionConclusionHeader")}</h4>
                    <Paragraph>{t("tonieboxes.boxSetup.boxVersion.whatVersionConclusion")}</Paragraph>
                    <h3>{t("tonieboxes.boxSetup.boxVersion.howToIdentify")}</h3>
                    <Paragraph>
                        {t("tonieboxes.boxSetup.boxVersion.howToIdentifyIntro")}
                        <ul>
                            <li>
                                <b>{t("tonieboxes.boxSetup.boxVersion.countryOfManufacture")}</b>{" "}
                                {t("tonieboxes.boxSetup.boxVersion.countryOfManufactureText")}
                            </li>
                            <li>
                                <b>{t("tonieboxes.boxSetup.boxVersion.macAddressCheck")}</b>{" "}
                                {t("tonieboxes.boxSetup.boxVersion.macAddressCheckText")}
                            </li>
                        </ul>
                        {t("tonieboxes.boxSetup.boxVersion.howToIdentifyOutro")}{" "}
                        <Link to="/tonieboxes/boxsetup/identifyboxversion">
                            {t("tonieboxes.boxSetup.identifyTonieboxVersion")}
                        </Link>
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
