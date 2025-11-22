import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../../../components/StyledComponents";
import { TonieboxesSubNav } from "../../../../components/tonieboxes/TonieboxesSubNav";
import { CC3235BoxFlashingGuide } from "../../../../components/tonieboxes/boxsetup/cc3235/CC3235BoxFlashingGuide";

export const CC3235BoxFlashingGuidePage: React.FC = () => {
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
                        { title: t("tonieboxes.cc3235BoxFlashing.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <CC3235BoxFlashingGuide />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
