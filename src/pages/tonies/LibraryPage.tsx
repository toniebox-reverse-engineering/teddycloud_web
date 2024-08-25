import { useTranslation } from "react-i18next";
import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";

import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { FileBrowser } from "../../components/utils/FileBrowser";

export const LibraryPage = () => {
    const { t } = useTranslation();
    return (
        <>
            <StyledSider>
                <ToniesSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <ToniesSubNav />
                </HiddenDesktop>
                <BreadcrumbWrapper
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("tonies.navigationTitle") },
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
