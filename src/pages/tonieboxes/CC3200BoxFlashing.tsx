import { useTranslation } from "react-i18next";
import { Typography } from "antd";

import {
    HiddenDesktop,
    StyledBreadcrumb,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { TonieboxesSubNav } from "../../components/tonieboxes/TonieboxesSubNav";
import { Link } from "react-router-dom";

const { Paragraph } = Typography;

export const CC3200BoxFlashingPage = () => {
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
                <StyledBreadcrumb
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("tonieboxes.navigationTitle") },
                        { title: t("tonieboxes.cc3200BoxFlashing.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t(`tonieboxes.cc3200BoxFlashing.title`)}</h1>
                    <Paragraph>
                        {t(`tonieboxes.cc3200BoxFlashing.hint`)}
                        <ul>
                            <li>
                                <Link to="https://tonies-wiki.revvox.de/docs/tools/teddycloud/" target="_blank">
                                    {t(`tonieboxes.cc3200BoxFlashing.linkGeneral`)}
                                </Link>
                            </li>
                        </ul>
                    </Paragraph>

                    <Paragraph>
                        {t(`tonieboxes.cc3200BoxFlashing.hint2`)}
                        <ul>
                            <li>
                                <Link
                                    to="https://tonies-wiki.revvox.de/docs/tools/teddycloud/dump-certs/cc3200/"
                                    target="_blank"
                                >
                                    {t(`tonieboxes.cc3200BoxFlashing.linkSpecific`)}
                                </Link>
                            </li>
                        </ul>
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
