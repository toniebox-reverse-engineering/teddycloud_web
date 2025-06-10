import { useTranslation } from "react-i18next";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../../components/StyledComponents";
import { TonieboxesSubNav } from "../../../components/tonieboxes/TonieboxesSubNav";
import { openBoxGuide } from "../../../components/tonieboxes/boxSetup/OpenBoxGuide";

export const OpenBoxGuidePage = () => {
    const { t } = useTranslation();

    return (
        <>
            <StyledSider>
                <TonieboxesSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("tonieboxes.navigationTitle") },
                        { title: t("tonieboxes.boxSetup.navigationTitle") },
                        { title: t("tonieboxes.boxSetup.openBoxGuide.navigationTitle") },
                    ]}
                />
                <StyledContent>{openBoxGuide()}</StyledContent>
            </StyledLayout>
        </>
    );
};
