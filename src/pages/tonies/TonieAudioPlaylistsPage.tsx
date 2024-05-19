import { useTranslation } from "react-i18next";
import {
    HiddenDesktop,
    StyledBreadcrumb,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { Alert, Typography } from "antd";
import { FileBrowser } from "../../components/tonies/FileBrowser";

const { Paragraph } = Typography;

export const TonieAudioPlaylistsPage = () => {
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
                <StyledBreadcrumb
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("tonies.navigationTitle") },
                        { title: t("tonies.tap.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t("tonies.tap.title")}</h1>

                    <Alert
                        message={t("settings.information")}
                        description=<div>
                            Development still in progress - Please be patient or support implementation of this feature!
                        </div>
                        type="info"
                        showIcon
                        style={{ marginBottom: 8 }}
                    />
                    <Paragraph>
                        <FileBrowser
                            special="library"
                            filetypeFilter={[".tap"]}
                            showColumns={["name", "size", "date", "controls"]}
                            isTapList={true}
                        />
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
