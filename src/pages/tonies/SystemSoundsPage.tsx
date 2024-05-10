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

const api = new TeddyCloudApi(defaultAPIConfig());
const { Option } = Select;

export const SystemSoundsPage = () => {
    const { t } = useTranslation();

    // Define the state with TonieCardProps[] type
    const [tonies, setTonies] = useState<TonieCardProps[]>([]);
    const [tonieBoxContentDirs, setTonieboxContentDirs] = useState<Array<[string, string[], string]>>([]);
    const [overlay, setOverlay] = useState(() => {
        const savedOverlay = localStorage.getItem("overlay");
        return savedOverlay ? savedOverlay : "";
    });

    useEffect(() => {
        const overlay = localStorage.getItem("overlay");
        if (overlay) {
            setOverlay(overlay);
        }
    }, []);

    useEffect(() => {
        const fetchContentDirs = async () => {
            const tonieboxData = await api.apiGetTonieboxesIndex();

            const tonieboxContentDirs = await Promise.all(
                tonieboxData.map(async (toniebox) => {
                    const contentDir = await api.apiGetTonieboxContentDir(toniebox.ID);
                    return [contentDir, toniebox.boxName, toniebox.ID] as [string, string, string];
                })
            );

            const groupedContentDirs: [string, string[], string][] = tonieboxContentDirs.reduce(
                (acc: [string, string[], string][], [contentDir, boxName, boxID]) => {
                    const existingGroupIndex = acc.findIndex((group) => group[0] === contentDir);
                    if (existingGroupIndex !== -1) {
                        acc[existingGroupIndex][1].push(boxName);
                        setOverlay(acc[existingGroupIndex][2]);
                    } else {
                        acc.push([contentDir, [boxName], boxID]);
                    }
                    return acc;
                },
                []
            );

            const contentDir = await api.apiGetTonieboxContentDir("");
            const existingGroupIndex = groupedContentDirs.findIndex((group) => group[0] === contentDir);
            if (existingGroupIndex === -1) {
                groupedContentDirs.push(["", ["TeddyCloud Default Content Dir"], ""]);
            }

            const updatedContentDirs: [string, string[], string][] = groupedContentDirs.map(
                ([contentDir, boxNames, boxId]) => [contentDir, boxNames, boxId]
            );

            setTonieboxContentDirs(updatedContentDirs);
        };
        fetchContentDirs();
    }, []);

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

    const handleSelectChange = (overlay: string) => {
        setOverlay(overlay);
        localStorage.setItem("overlay", overlay);
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
                    <ToniesList showFilter={false} tonieCards={tonies.filter((tonie) => tonie.type === "system")} />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
