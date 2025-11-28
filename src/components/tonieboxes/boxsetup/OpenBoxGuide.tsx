import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Image, Timeline, Typography } from "antd";
import { InfoCircleOutlined, SmileOutlined } from "@ant-design/icons";

import openTBStep1_1 from "../../../assets/boxSetup/openTB_step1_1.png";
import openTBStep1_2 from "../../../assets/boxSetup/openTB_step1_2.png";
import openTBStep2 from "../../../assets/boxSetup/openTB_step2.png";
import openTBStep3 from "../../../assets/boxSetup/openTB_step3.png";
import openTBStep4 from "../../../assets/boxSetup/openTB_step4.png";
import openTBStep5 from "../../../assets/boxSetup/openTB_step5.png";

const { Paragraph } = Typography;

export const OpenBoxGuide: React.FC = () => {
    const { t } = useTranslation();

    const [showFirstImage, setShowFirstImage] = useState(true);
    const [intervalDuration, setIntervalDuration] = useState(500);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setShowFirstImage((prev) => !prev);
            setIntervalDuration((prev) => (prev === 500 ? 2000 : 500));
        }, intervalDuration);

        return () => clearInterval(interval);
    }, [intervalDuration]);

    const items = [
        {
            content: (
                <>
                    <h3>{t("tonieboxes.boxSetup.openBoxGuide.step1")}</h3>
                    <Image src={showFirstImage ? openTBStep1_1 : openTBStep1_2} style={{ maxWidth: 350 }} alt="" />
                    <Paragraph style={{ marginTop: 16 }}>
                        <ul>
                            <li>{t("tonieboxes.boxSetup.openBoxGuide.step1Text1")}</li>
                            <li>{t("tonieboxes.boxSetup.openBoxGuide.step1Text2")}</li>
                        </ul>
                        <Paragraph>
                            <InfoCircleOutlined /> {t("tonieboxes.boxSetup.openBoxGuide.step1Text3")}
                        </Paragraph>
                    </Paragraph>
                </>
            ),
            style: { paddingBottom: 8 },
        },
        {
            content: (
                <>
                    <h3>{t("tonieboxes.boxSetup.openBoxGuide.step2")}</h3>
                    <Image src={openTBStep2} style={{ maxWidth: 350 }} alt="" />
                    <Paragraph style={{ marginTop: 16 }}>
                        <ul>
                            <li>{t("tonieboxes.boxSetup.openBoxGuide.step2Text")}</li>
                        </ul>
                    </Paragraph>
                </>
            ),
            style: { paddingBottom: 8 },
        },
        {
            content: (
                <>
                    <h3>{t("tonieboxes.boxSetup.openBoxGuide.step3")}</h3>
                    <Image src={openTBStep3} style={{ maxWidth: 350 }} alt="" />
                    <Paragraph style={{ marginTop: 16 }}>
                        <ul>
                            <li>{t("tonieboxes.boxSetup.openBoxGuide.step3Text")}</li>
                        </ul>
                    </Paragraph>
                </>
            ),
            style: { paddingBottom: 8 },
        },
        {
            content: (
                <>
                    <h3>{t("tonieboxes.boxSetup.openBoxGuide.step4")}</h3>
                    <Image src={openTBStep4} style={{ maxWidth: 350 }} alt="" />
                    <Paragraph style={{ marginTop: 16 }}>
                        <ul>
                            <li>{t("tonieboxes.boxSetup.openBoxGuide.step4Text")}</li>
                        </ul>
                    </Paragraph>
                </>
            ),
            style: { paddingBottom: 8 },
        },
        {
            content: (
                <>
                    <h3>{t("tonieboxes.boxSetup.openBoxGuide.step5")}</h3>
                    <Image src={openTBStep5} style={{ maxWidth: 350 }} alt="" />
                    <Paragraph style={{ marginTop: 16 }}>
                        <ul>
                            <li>{t("tonieboxes.boxSetup.openBoxGuide.step5Text1")}</li>
                            <li>{t("tonieboxes.boxSetup.openBoxGuide.step5Text2")}</li>
                        </ul>
                    </Paragraph>
                </>
            ),
            style: { paddingBottom: 8 },
        },
        {
            content: <Paragraph>{t("tonieboxes.boxSetup.openBoxGuide.finally")}</Paragraph>,
            icon: <SmileOutlined />,
            style: { paddingBottom: 8 },
        },
    ];

    return (
        <>
            <Paragraph style={{ fontSize: "small" }}>
                {t("tonieboxes.boxSetup.openBoxGuide.guideSourcePart1")}{" "}
                <Link to={t("tonieboxes.boxSetup.openBoxGuide.link1")} target="_blank">
                    iFixit[1]
                </Link>{" "}
                {t("tonieboxes.boxSetup.openBoxGuide.guideSourcePart2")}{" "}
                <Link to={t("tonieboxes.boxSetup.openBoxGuide.link2")} target="_blank">
                    iFixit[2]
                </Link>
                . {t("tonieboxes.boxSetup.openBoxGuide.guideSourcePart3")}{" "}
                <Link to="https://www.ifixit.com/User/828031/Tobias+Isakeit">Tobias Isakeit</Link>{" "}
                {t("tonieboxes.boxSetup.openBoxGuide.guideSourcePart4")}{" "}
                <Link to="https://creativecommons.org/licenses/by-nc-sa/3.0/" target="_blank">
                    {t("tonieboxes.boxSetup.openBoxGuide.guideSourceLicense")}
                </Link>
            </Paragraph>

            <Image.PreviewGroup>
                <Timeline mode="start" items={items} />
            </Image.PreviewGroup>

            <Paragraph>
                {t("tonieboxes.boxSetup.openBoxGuide.alternativeGuidelineVideo")}{" "}
                <Link to="https://www.youtube.com/watch?v=Cv9ID4-P6_A" target="_blank">
                    https://www.youtube.com/watch?v=Cv9ID4-P6_A
                </Link>
            </Paragraph>
        </>
    );
};
