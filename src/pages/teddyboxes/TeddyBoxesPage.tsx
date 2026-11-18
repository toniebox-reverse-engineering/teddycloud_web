import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Alert, Button, Typography } from "antd";

import BreadcrumbWrapper, {
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/common/StyledComponents";
import { TeddyBoxesList } from "../../components/teddyboxes/TeddyBoxesList";
import { TeddyBoxesSubNav } from "../../components/teddyboxes/TeddyBoxesSubNav";
import { TEDDYBOXES_GUIDE_ROUTE } from "../../constants/teddybox";
import { isPhoneOrTablet } from "../../utils/browser/browserUtils";
import { useImageCaching } from "../../components/teddybox/hooks/useImageCaching";
import { useTeddyCloud } from "../../provider/TeddyCloudProvider";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";

const { Paragraph } = Typography;

export const TeddyBoxesPage = () => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();
    const caching = useImageCaching();

    const enableCaching = async () => {
        try {
            await caching.enable();
            addNotification(
                NotificationTypeEnum.Success,
                t("teddybox.caching.enabled"),
                t("teddybox.caching.enabledDetails"),
                t("teddybox.title"),
            );
        } catch (err) {
            addNotification(
                NotificationTypeEnum.Error,
                t("teddybox.caching.failed"),
                err instanceof Error ? err.message : String(err),
                t("teddybox.title"),
            );
        }
    };

    return (
        <>
            <StyledSider>
                <TeddyBoxesSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: <Link to="/">{t("home.navigationTitle")}</Link> },
                        { title: t("teddybox.title") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("teddybox.pageTitle")}</h1>
                    <Paragraph>
                        {t("teddybox.intro")}{" "}
                        <Link to={TEDDYBOXES_GUIDE_ROUTE}>{t("teddybox.guide.linkText")}</Link>
                    </Paragraph>
                    {/* original tonies are only shown in full size with cached pictures */}
                    {caching.enabled === false && (
                        <Alert
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                            title={t("teddybox.caching.title")}
                            description={t("teddybox.caching.text")}
                            action={
                                <Button
                                    size="small"
                                    type="primary"
                                    loading={caching.saving}
                                    onClick={() => void enableCaching()}
                                >
                                    {t("teddybox.caching.enable")}
                                </Button>
                            }
                        />
                    )}
                    <TeddyBoxesList />
                    {/* a web page cannot block the home button, the device has to do it;
                        only of interest on the phone or tablet of the child */}
                    {isPhoneOrTablet() && (
                        <Alert
                            type="info"
                            showIcon
                            style={{ marginTop: 24 }}
                            title={t("teddybox.pinning.title")}
                            description={
                                <>
                                    {t("teddybox.pinning.text")}{" "}
                                    <Link to={TEDDYBOXES_GUIDE_ROUTE}>
                                        {t("teddybox.pinning.guideLink")}
                                    </Link>
                                </>
                            }
                        />
                    )}
                </StyledContent>
            </StyledLayout>
        </>
    );
};
