import { useTranslation } from "react-i18next";
import { Alert } from "antd";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../components/common/StyledComponents";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { FileBrowser } from "../../components/tonies/filebrowser/FileBrowser";
import { Link } from "react-router-dom";

export const TeddyAudioPlaylistsPage = () => {
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
                        { title: t("tonies.tap.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("tonies.tap.title")}</h1>

                    <Alert
                        title={t("settings.information")}
                        description=<div>Development still in progress - Feature is still unstable!</div>
                        type="info"
                        showIcon
                        style={{ marginBottom: 8 }}
                    />
                    <FileBrowser
                        special="library"
                        filetypeFilter={[".tap"]}
                        showColumns={["picture", "name", "size", "date", "controls"]}
                        isTapList={true}
                    />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
