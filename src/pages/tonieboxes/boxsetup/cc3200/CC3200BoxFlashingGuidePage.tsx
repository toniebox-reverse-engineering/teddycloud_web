import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import BreadcrumbWrapper, {
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../../components/common/StyledComponents";
import { TonieboxesSubNav } from "../../../../components/tonieboxes/TonieboxesSubNav";
import { CC3200BoxFlashingGuide } from "../../../../components/tonieboxes/boxsetup/cc3200/CC3200FlashingGuide";

export const CC3200BoxFlashingGuidePage: React.FC = () => {
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
                        { title: t("tonieboxes.cc3200BoxFlashing.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <CC3200BoxFlashingGuide />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
