import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    HiddenDesktop,
    StyledBreadcrumb,
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
import { useLocation } from "react-router-dom";
import { useTonieboxContent } from "../../components/tonies/OverlayContentDirectories";

const api = new TeddyCloudApi(defaultAPIConfig());
const { Option } = Select;

export const ToniesPage = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const linkOverlay = searchParams.get("overlay");

    const { t } = useTranslation();

    // Define the state with TonieCardProps[] type
    const [tonies, setTonies] = useState<TonieCardProps[]>([]);
    const { tonieBoxContentDirs, overlay, handleSelectChange } = useTonieboxContent(linkOverlay);

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
                <StyledBreadcrumb
                    items={[{ title: t("home.navigationTitle") }, { title: t("tonies.navigationTitle") }]}
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
                        <h1 style={{ width: "200px" }}>{t("tonies.title")}</h1>
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
                    </div>
                    <ToniesList showFilter={true} tonieCards={tonies.filter((tonie) => tonie.type === "tag")} />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
