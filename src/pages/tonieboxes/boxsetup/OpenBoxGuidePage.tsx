import { useTranslation } from "react-i18next";
import { Typography } from "antd";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../components/StyledComponents";
import { TonieboxesSubNav } from "../../../components/tonieboxes/TonieboxesSubNav";
import { Link } from "react-router-dom";

const { Paragraph } = Typography;

export const OpenBoxGuidePage = () => {
    const { t } = useTranslation();

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
                        { title: t("tonieboxes.boxSetup.openBoxGuide.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("tonieboxes.boxSetup.openBoxGuide.title")}</h1>
                    <Paragraph>{t("tonieboxes.boxSetup.openBoxGuide.intro")}</Paragraph>
                    <ul>
                        <li>
                            <Link to={t("tonieboxes.boxSetup.openBoxGuide.link1")} target="_blank">
                                {t("tonieboxes.boxSetup.openBoxGuide.link1")}
                            </Link>
                        </li>
                        <li>
                            <Link to="https://www.youtube.com/watch?v=Cv9ID4-P6_A" target="_blank">
                                https://www.youtube.com/watch?v=Cv9ID4-P6_A
                            </Link>
                        </li>
                    </ul>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
