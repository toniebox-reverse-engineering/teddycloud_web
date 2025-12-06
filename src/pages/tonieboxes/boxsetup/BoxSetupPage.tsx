import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import BreadcrumbWrapper, {
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../components/common/StyledComponents";
import { TonieboxesSubNav } from "../../../components/tonieboxes/TonieboxesSubNav";
import { BoxSetupContent } from "../../../components/tonieboxes/boxsetup/boxsetupoverview/boxsetup";

export const BoxSetupPage = () => {
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
                        { title: t("tonieboxes.boxSetup.navigationTitle") },
                    ]}
                />

                <StyledContent>
                    <BoxSetupContent />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
