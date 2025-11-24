import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, Col, Row, Flex, theme, Typography, Divider } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";

import BreadcrumbWrapper, {
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../components/common/StyledComponents";
import { TonieboxesSubNav } from "../../../components/tonieboxes/TonieboxesSubNav";

const { Paragraph, Title } = Typography;
const { useToken } = theme;

interface Version {
    name: string;
    pros: string[];
    cons: string[];
}

interface VersionCardsProps {
    versions: Version[];
}

const VersionCards: React.FC<VersionCardsProps> = ({ versions }) => {
    const { t } = useTranslation();
    const { token } = useToken();

    return (
        <Row gutter={16} justify="start">
            {versions.map((version, index) => (
                <Col key={index} xs={24} md={12} xl={8}>
                    <Card title={version.name} size="small" variant="outlined" style={{ marginBottom: 8 }}>
                        {/* Pros */}
                        <Title level={5} style={{ marginTop: 0 }}>
                            {t("tonieboxes.boxSetup.boxVersion.pros")}
                        </Title>

                        {version.pros.length > 0 ? (
                            <Flex vertical gap={4}>
                                {version.pros.map((item, i) => (
                                    <>
                                        <Flex
                                            key={i}
                                            align="flex-start"
                                            gap={8}
                                            style={{
                                                flexWrap: "nowrap",
                                            }}
                                        >
                                            <CheckOutlined
                                                style={{
                                                    color: "green",
                                                    marginTop: 4,
                                                }}
                                            />
                                            <Paragraph
                                                style={{
                                                    marginBottom: 0,
                                                    textAlign: "right",
                                                }}
                                            >
                                                {item}
                                            </Paragraph>
                                        </Flex>
                                        <Divider style={{ margin: "8px 0" }} />
                                    </>
                                ))}
                            </Flex>
                        ) : (
                            <Paragraph
                                style={{
                                    marginBottom: 0,
                                    textAlign: "center",
                                }}
                            >
                                {t("tonieboxes.boxSetup.boxVersion.emptyPros")}
                            </Paragraph>
                        )}

                        {/* Cons */}
                        <Title level={5} style={{ marginTop: 16 }}>
                            {t("tonieboxes.boxSetup.boxVersion.cons")}
                        </Title>

                        {version.cons.length > 0 ? (
                            <Flex vertical gap={4}>
                                {version.cons.map((item, i) => (
                                    <>
                                        <Flex
                                            key={i}
                                            align="flex-start"
                                            gap={8}
                                            style={{
                                                flexWrap: "nowrap",
                                            }}
                                        >
                                            <CloseOutlined
                                                style={{
                                                    color: token.colorError,
                                                    marginTop: 4,
                                                }}
                                            />
                                            <Paragraph
                                                style={{
                                                    marginBottom: 0,
                                                    textAlign: "right",
                                                }}
                                            >
                                                {item}
                                            </Paragraph>
                                        </Flex>
                                        <Divider style={{ margin: "8px 0" }} />
                                    </>
                                ))}
                            </Flex>
                        ) : (
                            <Paragraph
                                style={{
                                    marginBottom: 0,
                                    textAlign: "center",
                                }}
                            >
                                {t("tonieboxes.boxSetup.boxVersion.emptyCons")}
                            </Paragraph>
                        )}
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export const BoxVersionInformationPage: React.FC = () => {
    const { t } = useTranslation();

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
                        {
                            title: <Link to="/tonieboxes/boxsetup">{t("tonieboxes.boxSetup.navigationTitle")}</Link>,
                        },
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
