import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import BreadcrumbWrapper, {
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../../../components/common/StyledComponents";
import { TonieboxesSubNav } from "../../../../components/tonieboxes/TonieboxesSubNav";
import { Alert, Typography } from "antd";

const { Paragraph } = Typography;

export const TB2BoxFlashingGuidePage: React.FC = () => {
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
                        {
                            title: (
                                <Link to="/tonieboxes/boxsetup">
                                    {t("tonieboxes.boxSetup.navigationTitle")}
                                </Link>
                            ),
                        },
                        { title: t("tonieboxes.tb2BoxFlashing.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("tonieboxes.tb2BoxFlashing.title")}</h1>
                    <Alert
                        type="info"
                        closable={{ closeIcon: true, "aria-label": "close" }}
                        showIcon
                        title={t("tonieboxes.tb2BoxFlashing.underDevelopment")}
                        description={
                            <Paragraph>
                                {t("tonieboxes.tb2BoxFlashing.underDevelopmentBePatient")}
                            </Paragraph>
                        }
                    />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
