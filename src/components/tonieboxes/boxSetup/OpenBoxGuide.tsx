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

export function openBoxGuide(): JSX.Element {
    const { t } = useTranslation();
    const [showFirstImage, setShowFirstImage] = useState(true);
    const [intervalDuration, setIntervalDuration] = useState(500);

    useEffect(() => {
        let interval: number;
        interval = window.setInterval(() => {
            setShowFirstImage((prev) => !prev);
            setIntervalDuration((prevDuration) => (prevDuration === 500 ? 2000 : 500));
        }, intervalDuration);

        return () => clearInterval(interval);
    }, [intervalDuration]);

    const items = [
        {
            children: (
                <>
                    <h3>{t("tonieboxes.boxSetup.openBoxGuide.step1")}</h3>
                    {showFirstImage ? (
                        <Image src={openTBStep1_1} style={{ maxWidth: 350 }} alt="" />
                    ) : (
                        <Image src={openTBStep1_2} style={{ maxWidth: 350 }} alt="" />
                    )}
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
            children: (
                <>
                    <h3>{t("tonieboxes.boxSetup.openBoxGuide.step2")}</h3>
                    <Image style={{ maxWidth: 350 }} src={openTBStep2} alt={""} />

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
            children: (
                <>
                    <h3>{t("tonieboxes.boxSetup.openBoxGuide.step3")}</h3>
                    <Image style={{ maxWidth: 350 }} src={openTBStep3} alt={""} />
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
            children: (
                <>
                    <h3>{t("tonieboxes.boxSetup.openBoxGuide.step4")}</h3>
                    <Image style={{ maxWidth: 350 }} src={openTBStep4} alt={""} />
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
            children: (
                <>
                    <h3>{t("tonieboxes.boxSetup.openBoxGuide.step5")}</h3>
                    <Image style={{ maxWidth: 350 }} src={openTBStep5} alt={""} />
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
            children: (
                <>
                    <Paragraph>{t("tonieboxes.boxSetup.openBoxGuide.finally")}</Paragraph>
                </>
            ),
            dot: <SmileOutlined />,
            style: { paddingBottom: 8 },
        },
    ];

    return (
        <>
            <h1>{t("tonieboxes.boxSetup.openBoxGuide.title")}</h1>
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
                    {t("tonieboxes.boxSetup.openBoxGuide.guideSourceLicense")}.
                </Link>
            </Paragraph>
            <Image.PreviewGroup>
                <Timeline mode={"left"} items={items} />
            </Image.PreviewGroup>
            <Paragraph>
                {t("tonieboxes.boxSetup.openBoxGuide.alternativeGuidelineVideo")}{" "}
                <Link to="https://www.youtube.com/watch?v=Cv9ID4-P6_A" target="_blank">
                    https://www.youtube.com/watch?v=Cv9ID4-P6_A
                </Link>
            </Paragraph>
        </>
    );
}
