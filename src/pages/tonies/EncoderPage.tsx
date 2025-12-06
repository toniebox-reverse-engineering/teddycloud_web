import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/common/StyledComponents";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { Encoder } from "../../components/tonies/encoder/Encoder";

export const EncoderPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <>
            <StyledSider>
                <ToniesSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                        { title: <Link to="/tonies">{t("tonies.navigationTitle")}</Link> },
                        { title: t("tonies.encoder.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("tonies.encoder.title")}</h1>
                    <Encoder />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
