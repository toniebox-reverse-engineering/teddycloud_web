import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Alert } from "antd";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/common/StyledComponents";

import { TonieboxesSubNav } from "../../components/tonieboxes/TonieboxesSubNav";
import { TonieboxesList } from "../../components/tonieboxes/tonieboxeslist/TonieboxesList";

import { useNewBoxesAllowed } from "../../hooks/getsettings/useGetSettingNewBoxesAllowed";
import { useTonieboxes } from "../../hooks/useTonieboxes";

export const TonieboxesPage = () => {
    const { t } = useTranslation();

    const newBoxesAllowed = useNewBoxesAllowed();
    const { tonieboxes } = useTonieboxes();

    return (
        <>
            <StyledSider>
                <TonieboxesSubNav />
            </StyledSider>

            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                        { title: t("tonieboxes.navigationTitle") },
                    ]}
                />

                <StyledContent>
                    <h1>{t("tonieboxes.title")}</h1>

                    {newBoxesAllowed.value && (
                        <Alert
                            title={t("tonieboxes.newBoxesAllowed")}
                            description={t("tonieboxes.newBoxesAllowedText")}
                            type="warning"
                            showIcon
                            style={{ margin: "16px 0" }}
                        />
                    )}

                    <TonieboxesList tonieboxCards={tonieboxes} />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
