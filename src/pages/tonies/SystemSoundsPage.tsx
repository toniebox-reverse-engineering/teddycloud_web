import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { TonieCardProps } from "../../components/tonies/TonieCard"; // Import the TonieCard component and its props type
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";
import { ToniesList } from "../../components/tonies/ToniesList";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { Select } from "antd";
import { useTonieboxContent } from "../../components/utils/OverlayContentDirectories";

const api = new TeddyCloudApi(defaultAPIConfig());
const { Option } = Select;

export const SystemSoundsPage = () => {
    const { t } = useTranslation();

    // Define the state with TonieCardProps[] type
    const [tonies, setTonies] = useState<TonieCardProps[]>([]);
    const { tonieBoxContentDirs, overlay, handleSelectChange } = useTonieboxContent();

    useEffect(() => {
        const fetchTonies = async () => {
            // Perform API call to fetch Tonie data
            const tonieData = await api.apiGetTagIndex(overlay ? overlay : "");
            setTonies(
                tonieData.sort((a, b) => {
                    if (a.tonieInfo.series < b.tonieInfo.series) {
                        return -1;
                    }
                    if (a.tonieInfo.series > b.tonieInfo.series) {
                        return 1;
                    }
                    if (a.tonieInfo.episode < b.tonieInfo.episode) {
                        return -1;
                    }
                    if (a.tonieInfo.episode > b.tonieInfo.episode) {
                        return 1;
                    }
                    return 0;
                })
            );
        };

        fetchTonies();
    }, [overlay]);

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
                        { title: t("tonies.system-sounds.navigationTitle") },
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
                        <h1>{t("tonies.system-sounds.title")}</h1>
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
                    <ToniesList
                        showFilter={false}
                        showPagination={true}
                        tonieCards={tonies.filter((tonie) => tonie.type === "system")}
                        overlay={overlay}
                        readOnly={false}
                    />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
