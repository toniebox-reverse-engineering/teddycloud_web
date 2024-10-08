import { useTranslation } from "react-i18next";
import { Alert, Typography } from "antd";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../../components/StyledComponents";
import { TonieboxesSubNav } from "../../../../components/tonieboxes/TonieboxesSubNav";
import { Link } from "react-router-dom";

const { Paragraph } = Typography;

export const ESP32LegacyPage = () => {
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
                        { title: t("tonieboxes.BoxFlashing.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t(`tonieboxes.BoxFlashing.title`)}</h1>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
