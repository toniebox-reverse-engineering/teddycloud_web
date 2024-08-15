import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, message } from "antd";
import BreadcrumbWrapper, {
    HiddenDesktop,
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
    const [newBoxesAllowed, setNewBoxesAllowed] = useState(false);

    useEffect(() => {
        const fetchTonieboxes = async () => {
            // Perform API call to fetch Toniebox data
            const tonieboxData = await api.apiGetTonieboxesIndex();
            setTonieboxes(tonieboxData);
        };

        fetchTonieboxes();

        const fetchNewBoxesAllowed = async () => {
            try {
                const newBoxesAllowed = await api.apiGetNewBoxesAllowed();
                setNewBoxesAllowed(newBoxesAllowed);
            } catch (error) {
                message.error("Fetching new box allowed: " + error);
            }
        };

        fetchNewBoxesAllowed();
    }, []);

    const newBoxesAllowedWarning = newBoxesAllowed ? (
        <Alert
            message={t("tonieboxes.newBoxesAllowed")}
            description={t("tonieboxes.newBoxesAllowedText")}
            type="warning"
            showIcon
            style={{ margin: "16px 0" }}
        />
    ) : (
        ""
    );

    return (
        <>
            <StyledSider>
                <TonieboxesSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <TonieboxesSubNav />
                </HiddenDesktop>
                <BreadcrumbWrapper
                    items={[{ title: t("home.navigationTitle") }, { title: t("tonieboxes.navigationTitle") }]}
                />
                <StyledContent>
                    <h1>{t("tonieboxes.title")}</h1>
                    {newBoxesAllowedWarning}
                    <TonieboxesList tonieboxCards={tonieboxes} />
                </StyledContent>
            </StyledLayout>
        </>
    );
};
