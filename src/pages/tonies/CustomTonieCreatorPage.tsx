import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import BreadcrumbWrapper, {
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/common/StyledComponents";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { CustomModelEditor } from "../../components/tonies/custommodel/CustomModelEditor";
import { useTonieboxContentOverlay } from "../../hooks/useTonieboxContentOverlay";

export const CustomTonieCreatorPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { overlay } = useTonieboxContentOverlay();

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
                        { title: t("tonies.customToniesEditorJsonEntry") },
                    ]}
                />
                <StyledContent>
                    <h1 style={{ marginBottom: 16 }}>{t("tonies.customToniesEditorJsonEntry")}</h1>
                    <CustomModelEditor
                        open={true}
                        mode="full"
                        onClose={() => navigate("/tonies")}
                        overlay={overlay ?? ""}
                    />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
