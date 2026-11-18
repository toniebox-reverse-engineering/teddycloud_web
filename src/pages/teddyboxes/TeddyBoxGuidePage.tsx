import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Flex, Typography } from "antd";

import BreadcrumbWrapper, {
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/common/StyledComponents";
import { TeddyBoxGraphic } from "../../components/teddybox/graphics/TeddyBoxGraphic";
import { TeddyBoxesSubNav } from "../../components/teddyboxes/TeddyBoxesSubNav";
import { TEDDYBOX_BOX_COLORS, TEDDYBOXES_ROUTE } from "../../constants/teddybox";

const { Paragraph } = Typography;

/** Steps in the order a parent goes through them. */
const STEPS = ["create", "setup", "open", "install", "restrict", "child", "parent", "login"];

export const TeddyBoxGuidePage = () => {
    const { t } = useTranslation();

    return (
        <>
            <StyledSider>
                <TeddyBoxesSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                        { title: <Link to={TEDDYBOXES_ROUTE}>{t("teddybox.title")}</Link> },
                        { title: t("teddybox.guide.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <Flex gap={24} align="center" wrap>
                        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                            <h1>{t("teddybox.guide.title")}</h1>
                            <Paragraph>{t("teddybox.guide.intro")}</Paragraph>
                        </div>
                        <TeddyBoxGraphic
                            color={TEDDYBOX_BOX_COLORS[0]}
                            style={{ width: 160, flex: "none", margin: "0 auto" }}
                        />
                    </Flex>
                    {STEPS.map((step, index) => {
                        const items = t(`teddybox.guide.steps.${step}.items`, {
                            returnObjects: true,
                        }) as string[];
                        return (
                            <section key={step}>
                                <h2>
                                    {index + 1}. {t(`teddybox.guide.steps.${step}.title`)}
                                </h2>
                                <Paragraph>{t(`teddybox.guide.steps.${step}.text`)}</Paragraph>
                                {Array.isArray(items) && items.length > 0 && (
                                    <ul>
                                        {items.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        );
                    })}
                </StyledContent>
            </StyledLayout>
        </>
    );
};
