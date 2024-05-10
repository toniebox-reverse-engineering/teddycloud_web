import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    HiddenDesktop,
    StyledBreadcrumb,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { TonieboxCardProps } from "../../components/tonieboxes/TonieboxCard"; // Import the TonieboxCard component and its props type
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";
import { TonieboxesList } from "../../components/tonieboxes/TonieboxesList";
import { TonieboxesSubNav } from "../../components/tonieboxes/TonieboxesSubNav";

const api = new TeddyCloudApi(defaultAPIConfig());

export const TonieboxesPage = () => {
    const { t } = useTranslation();

    // Define the state with TonieCardProps[] type
    const [tonieboxes, setTonieboxes] = useState<TonieboxCardProps[]>([]);

    useEffect(() => {
        const fetchTonieboxes = async () => {
            // Perform API call to fetch Toniebox data
            const tonieboxData = await api.apiGetTonieboxesIndex();
            setTonieboxes(tonieboxData);
        };

        fetchTonieboxes();
    }, []);

    return (
        <>
            <StyledSider>
                <TonieboxesSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <TonieboxesSubNav />
                </HiddenDesktop>
                <StyledBreadcrumb
                    items={[{ title: t("home.navigationTitle") }, { title: t("tonieboxes.navigationTitle") }]}
                />
                <StyledContent>
                    <h1>{t("tonieboxes.title")}</h1>
                    <TonieboxesList tonieboxCards={tonieboxes} />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
