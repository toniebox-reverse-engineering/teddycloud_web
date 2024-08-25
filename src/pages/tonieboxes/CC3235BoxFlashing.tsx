import { useTranslation } from "react-i18next";
import { Typography } from "antd";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { TonieboxesSubNav } from "../../components/tonieboxes/TonieboxesSubNav";
import { Link } from "react-router-dom";

const { Paragraph } = Typography;

export const CC3235BoxFlashingPage = () => {
    const { t } = useTranslation();

    return (
        <>
            <StyledSider>
                <TonieboxesSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <TonieboxesSubNav />
                </HiddenDesktop>
                <BreadcrumbWrapper
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("tonieboxes.navigationTitle") },
                        { title: t("tonieboxes.cc3235BoxFlashing.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t(`tonieboxes.cc3235BoxFlashing.title`)}</h1>
                    <Paragraph>
                        {t(`tonieboxes.cc3235BoxFlashing.hint`)}
                        <ul>
                            <li>
                                <Link to="https://tonies-wiki.revvox.de/docs/tools/teddycloud/setup/" target="_blank">
                                    Patching your Toniebox for using with TeddyCloud
                                </Link>
                            </li>
                        </ul>
                    </Paragraph>

                    <Paragraph>
                        {t(`tonieboxes.cc3235BoxFlashing.hint2`)}
                        <ul>
                            <li>
                                <Link
                                    to="https://tonies-wiki.revvox.de/docs/tools/teddycloud/setup/dump-certs/cc3235/"
                                    target="_blank"
                                >
                                    CC3235 specific setup
                                </Link>
                            </li>
                        </ul>
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
