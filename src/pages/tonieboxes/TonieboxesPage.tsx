import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "antd";
import { TonieboxCardProps } from "../../types/tonieboxTypes";

import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";

import BreadcrumbWrapper, {
    HiddenDesktop,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { TonieboxesList } from "../../components/tonieboxes/TonieboxesList";
import { TonieboxesSubNav } from "../../components/tonieboxes/TonieboxesSubNav";
import { useTeddyCloud } from "../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../types/teddyCloudNotificationTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

export const TonieboxesPage = () => {
    const { t } = useTranslation();
    const { addNotification } = useTeddyCloud();

    // Define the state with TonieCardProps[] type
    const [tonieboxes, setTonieboxes] = useState<TonieboxCardProps[]>([]);
    const [newBoxesAllowed, setNewBoxesAllowed] = useState(false);

    useEffect(() => {
        const fetchTonieboxes = async () => {
            try {
                // Perform API call to fetch Toniebox data
                const tonieboxData = await api.apiGetTonieboxesIndex();
                setTonieboxes(tonieboxData);
            } catch (error) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("tonieboxes.messages.errorFetchingTonieboxes"),
                    t("tonieboxes.messages.errorFetchingTonieboxes") + ": " + error,
                    t("tonieboxes.navigationTitle")
                );
            }
        };

        fetchTonieboxes();

        const fetchNewBoxesAllowed = async () => {
            try {
                const newBoxesAllowed = await api.apiGetNewBoxesAllowed();
                setNewBoxesAllowed(newBoxesAllowed);
            } catch (error) {
                addNotification(
                    NotificationTypeEnum.Error,
                    t("settings.messages.errorFetchingSetting"),
                    t("settings.messages.errorFetchingSettingDetails", {
                        setting: "core.allowNewBox",
                    }) + error,
                    t("tonieboxes.navigationTitle")
                );
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
