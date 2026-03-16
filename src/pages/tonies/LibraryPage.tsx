import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Segmented } from "antd";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/common/StyledComponents";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { FileBrowser } from "../../components/tonies/filebrowser/FileBrowser";
import { Link } from "react-router-dom";

const VIEW_LIBRARY = "library";
const VIEW_CUSTOM_IMAGES = "custom_img";

export const LibraryPage = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const view = searchParams.get("view") === VIEW_CUSTOM_IMAGES ? VIEW_CUSTOM_IMAGES : VIEW_LIBRARY;

    const setView = (value: string) => {
        setSearchParams(value === VIEW_CUSTOM_IMAGES ? { view: VIEW_CUSTOM_IMAGES } : {});
    };

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
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                        <h1 style={{ margin: 0 }}>{t("tonies.library.title")}</h1>
                        <Segmented
                            value={view}
                            onChange={setView}
                            options={[
                                { label: t("tonies.libraryAudio.navigationTitle"), value: VIEW_LIBRARY },
                                { label: t("tonies.customImages.navigationTitle"), value: VIEW_CUSTOM_IMAGES },
                            ]}
                        />
                    </div>
                    <FileBrowser key={view} special={view} />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
