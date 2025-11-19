import { createRoot } from "react-dom/client";

import { TonieCardProps } from "../../../types/tonieTypes";
import { NotificationTypeEnum } from "../../../types/teddyCloudNotificationTypes";

import { TeddyCloudApi } from "../../../api/apis/TeddyCloudApi";
import { defaultAPIConfig } from "../../../config/defaultApiConfig";

import ConfirmationDialog from "../../common/ConfirmationDialog";

const api = new TeddyCloudApi(defaultAPIConfig());

export const setNoCloud = async (
    tonieCards: TonieCardProps[],
    selectedTonies: string[],
    t: any,
    overlay: any,
    addNotification: Function,
    value: boolean,
    handleUpdateCard: Function
) => {
    const selected = tonieCards.filter((c) => selectedTonies.includes(c.ruid));

    for (const card of selected) {
        const model = `${card.tonieInfo.series}` + (card.tonieInfo.episode ? ` - ${card.tonieInfo.episode}` : "");

        try {
            await api.apiPostTeddyCloudContentJson(card.ruid, "nocloud=" + value, overlay);

            addNotification(
                NotificationTypeEnum.Success,
                value ? t("tonies.messages.cloudAccessBlocked") : t("tonies.messages.cloudAccessEnabled"),
                value
                    ? t("tonies.messages.cloudAccessBlockedDetails", {
                          model: model,
                          ruid: card.ruid,
                      })
                    : t("tonies.messages.cloudAccessEnabledDetails", {
                          model: model,
                          ruid: card.ruid,
                      }),
                t("tonies.title")
            );
            const updated = await api.apiGetTagInfo(card.ruid, overlay);
            handleUpdateCard(updated);
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.couldNotChangeCloudFlag"),
                t("tonies.messages.couldNotChangeCloudFlagDetails", {
                    model: card.tonieInfo.model,
                    ruid: card.ruid,
                }) + error,
                t("tonies.title")
            );
        }
    }
};

export const setLiveFlag = async (
    tonieCards: TonieCardProps[],
    selectedTonies: string[],
    t: any,
    overlay: any,
    addNotification: Function,
    value: boolean,
    handleUpdateCard: Function
) => {
    const selected = tonieCards.filter((c) => selectedTonies.includes(c.ruid));

    for (const card of selected) {
        const model = `${card.tonieInfo.series}` + (card.tonieInfo.episode ? ` - ${card.tonieInfo.episode}` : "");
        try {
            await api.apiPostTeddyCloudContentJson(card.ruid, "live=" + value, overlay);

            addNotification(
                NotificationTypeEnum.Success,
                value ? t("tonies.messages.liveEnabled") : t("tonies.messages.liveDisabled"),
                value
                    ? t("tonies.messages.liveEnabledDetails", {
                          model: model,
                          ruid: card.ruid,
                      })
                    : t("tonies.messages.liveDisabledDetails", {
                          model: model,
                          ruid: card.ruid,
                      }),
                t("tonies.title")
            );
            const updated = await api.apiGetTagInfo(card.ruid, overlay);
            handleUpdateCard(updated);
        } catch (error) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.couldNotChangeLiveFlag"),
                t("tonies.messages.couldNotChangeLiveFlagDetails", {
                    model: card.tonieInfo.model,
                    ruid: card.ruid,
                }) + error,
                t("tonies.title")
            );
        }
    }
};

async function showConfirm(t: any, tonieLabel: string): Promise<boolean> {
    return new Promise((resolve) => {
        const div = document.createElement("div");
        document.body.appendChild(div);

        const root = createRoot(div);

        const handleOk = () => {
            cleanup();
            resolve(true);
        };

        const handleCancel = () => {
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            root.unmount();
            div.remove();
        };

        root.render(
            <ConfirmationDialog
                title={t("tonies.confirmHideModal.title")}
                open={true}
                okText={t("tonies.confirmHideModal.hide")}
                cancelText={t("tonies.confirmHideModal.cancel")}
                content={t("tonies.confirmHideModal.confirmHideDialog", { tonieToHide: tonieLabel })}
                handleOk={handleOk}
                handleCancel={handleCancel}
            />
        );
    });
}

export async function hideSelectedTonies(
    tonieCards: TonieCardProps[],
    selectedTonies: string[],
    t: any,
    overlay: string | undefined,
    addNotification: Function,
    onHide: (ruid: string) => void
) {
    const selected = tonieCards.filter((c) => selectedTonies.includes(c.ruid));
    for (const card of selected) {
        const model = `${card.tonieInfo.series}` + (card.tonieInfo.episode ? ` - ${card.tonieInfo.episode}` : "");
        const confirm = await showConfirm(t, model);
        if (!confirm) continue;

        try {
            await api.apiPostTeddyCloudContentJson(card.ruid, "hide=true", overlay);

            addNotification(
                NotificationTypeEnum.Success,
                t("tonies.messages.hideTonieSuccessful"),
                t("tonies.messages.hideTonieSuccessfulDetails", { ruid: card.ruid }),
                t("tonies.navigationTitle")
            );
            onHide(card.ruid);
        } catch (err) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonies.messages.hideTonieFailed"),
                t("tonies.messages.hideTonieFailedDetails", { ruid: card.ruid }) + String(err),
                t("tonies.navigationTitle")
            );
        }
    }
}
