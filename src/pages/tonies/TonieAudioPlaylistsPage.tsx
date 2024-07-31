import { useTranslation } from "react-i18next";
import {
    HiddenDesktop,
    StyledBreadcrumb,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { Alert, Button, Typography } from "antd";
import { FileBrowser } from "../../components/utils/FileBrowser";
import TonieAudioPlaylistEditor from "../../components/tonies/TonieAudioPlaylistEditor";
import { useState } from "react";

const { Paragraph } = Typography;

export const TonieAudioPlaylistsPage = () => {
    const { t } = useTranslation();
    const [TAPEditorOpen, setTAPEditorOpen] = useState(false);

    const onCreate = (values: any) => {
        console.log("Received values of form: ", values);
        setTAPEditorOpen(false);
    };

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

                    <FileBrowser
                        special="library"
                        filetypeFilter={[".tap"]}
                        showColumns={["picture", "name", "size", "date", "controls"]}
                        isTapList={true}
                    />
                    <Paragraph>
                        <div>
                            <Button
                                type="primary"
                                style={{ marginTop: 8 }}
                                onClick={() => {
                                    setTAPEditorOpen(true);
                                }}
                            >
                                {t("tonies.tapEditor.titleCreate")}
                            </Button>
                            <TonieAudioPlaylistEditor
                                open={TAPEditorOpen}
                                onCreate={onCreate}
                                onCancel={() => {
                                    setTAPEditorOpen(false);
                                }}
                            />
                        </div>
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
