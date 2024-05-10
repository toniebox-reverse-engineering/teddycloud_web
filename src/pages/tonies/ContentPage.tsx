import { useEffect, useState } from "react";
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
import { FileBrowser } from "../../components/tonies/FileBrowser";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";

const api = new TeddyCloudApi(defaultAPIConfig());
const { Option } = Select;

export const ContentPage = () => {
    const { t } = useTranslation();
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
                    <FileBrowser special="" overlay={overlay} />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
