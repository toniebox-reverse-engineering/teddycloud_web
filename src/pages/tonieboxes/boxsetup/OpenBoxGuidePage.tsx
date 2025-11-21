import { useTranslation } from "react-i18next";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../../components/StyledComponents";
import { TonieboxesSubNav } from "../../../components/tonieboxes/TonieboxesSubNav";
import { OpenBoxGuide } from "../../../components/tonieboxes/boxsetup/OpenBoxGuide";
import { Link } from "react-router-dom";

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
                        { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                        { title: <Link to="/tonieboxes">{t("tonieboxes.navigationTitle")}</Link> },
                        { title: <Link to="/tonieboxes/boxsetup">{t("tonieboxes.boxSetup.navigationTitle")}</Link> },
                        { title: t("tonieboxes.boxSetup.openBoxGuide.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("tonieboxes.boxSetup.openBoxGuide.title")}</h1>
                    <OpenBoxGuide />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
