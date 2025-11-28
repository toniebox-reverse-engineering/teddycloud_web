import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/common/StyledComponents";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { FileBrowser } from "../../components/tonies/filebrowser/FileBrowser";
import { TonieboxOverlaySelect } from "../../components/tonies/common/elements/TonieboxOverlaySelect";
import { useTonieboxContentOverlay } from "../../hooks/useTonieboxContentOverlay";

export const ContentPage = () => {
    const { t } = useTranslation();
    const { overlay, tonieBoxContentDirs, changeOverlay } = useTonieboxContentOverlay();

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
                        { title: t("tonies.content.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignContent: "center",
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 8,
                            alignItems: "center",
                            marginBottom: 8,
                        }}
                    >
                        <h1>{t("tonies.content.title")}</h1>
                        <TonieboxOverlaySelect
                            tonieBoxContentDirs={tonieBoxContentDirs}
                            overlay={overlay}
                            onChange={changeOverlay}
                            selectProps={{ size: "small", style: { maxWidth: 300 } }}
                        />
                    </div>
                    <FileBrowser special="" overlay={overlay} />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
