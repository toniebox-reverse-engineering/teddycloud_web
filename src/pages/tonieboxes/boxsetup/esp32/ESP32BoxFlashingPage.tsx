import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import BreadcrumbWrapper, {
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../../components/common/StyledComponents";
import { TonieboxesSubNav } from "../../../../components/tonieboxes/TonieboxesSubNav";
import { Flashing } from "../../../../components/tonieboxes/boxsetup/esp32/flashing/Flashing";
import { useGetSettingUseRevvoxFlasher } from "../../../../hooks/getsettings/useGetSettingUseRevvoxFlasher";
import LoadingSpinner from "../../../../components/common/elements/LoadingSpinner";

export const ESP32BoxFlashingPage: React.FC = () => {
    const { t } = useTranslation();

    const useRevvoxFlasher = useGetSettingUseRevvoxFlasher();

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
                        { title: t("tonieboxes.esp32BoxFlashing.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    {useRevvoxFlasher === null ? <LoadingSpinner /> : <Flashing useRevvoxFlasher={useRevvoxFlasher} />}
                </StyledContent>
            </StyledLayout>
        </>
    );
};
