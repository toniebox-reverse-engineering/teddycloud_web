import { useTranslation } from "react-i18next";
import { Select } from "antd";
import {
    HiddenDesktop,
    StyledBreadcrumb,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";

import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { FileBrowser } from "../../components/utils/FileBrowser";
import { useTonieboxContent } from "../../components/utils/OverlayContentDirectories";

const { Option } = Select;

export const ContentPage = () => {
    const { t } = useTranslation();

    const { tonieBoxContentDirs, overlay, handleSelectChange } = useTonieboxContent();

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
                            alignItems: "center",
                        }}
                    >
                        <h1>{t("tonies.content.title")}</h1>
                        {tonieBoxContentDirs.length > 1 ? (
                            <Select
                                id="contentDirectorySelect"
                                defaultValue=""
                                onChange={handleSelectChange}
                                style={{ maxWidth: "300px" }}
                                value={overlay}
                                title={t("tonies.content.showToniesOfBoxes")}
                            >
                                {tonieBoxContentDirs.map(([contentDir, boxNames, boxId]) => (
                                    <Option key={boxId} value={boxId}>
                                        {boxNames.join(", ")}
                                    </Option>
                                ))}
                            </Select>
                        ) : (
                            ""
                        )}
                    </div>
                    <FileBrowser special="" overlay={overlay} />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
