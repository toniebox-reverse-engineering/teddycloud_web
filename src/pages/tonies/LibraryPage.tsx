import { useTranslation } from "react-i18next";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/StyledComponents";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { FileBrowser } from "../../components/utils/FileBrowser";
import { Link } from "react-router-dom";

export const LibraryPage = () => {
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
                        { title: t("tonies.library.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("tonies.library.title")}</h1>
                    <FileBrowser special="library" />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
