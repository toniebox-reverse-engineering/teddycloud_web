import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../../../components/StyledComponents";
import { TonieboxesSubNav } from "../../../../components/tonieboxes/TonieboxesSubNav";
import { ESP32LegacyFlashingGuide } from "../../../../components/tonieboxes/boxsetup/esp32/legacy/ESP32LegacyFlashingGuide";

export const ESP32LegacyFlashingGuidePage: React.FC = () => {
    const { t } = useTranslation();

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
                        { title: t("tonieboxes.esp32BoxFlashing.legacy.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <ESP32LegacyFlashingGuide />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
