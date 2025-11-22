import { TonieCardProps } from "../../../../types/tonieTypes";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { TeddyCloudApi } from "../../../../api/apis/TeddyCloudApi";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export type ConfirmFn = (tonieLabel: string) => Promise<boolean>;

export const setNoCloud = async (
    tonieCards: TonieCardProps[],
    selectedTonies: string[],
    t: any,
    overlay: any,
    addNotification: (type: NotificationTypeEnum, title: string, description: string, context: string) => void,
    value: boolean,
    handleUpdateCard: (card: TonieCardProps) => void
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
                    ? t("tonies.messages.cloudAccessBlockedDetails", { model, ruid: card.ruid })
                    : t("tonies.messages.cloudAccessEnabledDetails", { model, ruid: card.ruid }),
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
    addNotification: (type: NotificationTypeEnum, title: string, description: string, context: string) => void,
    value: boolean,
    handleUpdateCard: (card: TonieCardProps) => void
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
                    ? t("tonies.messages.liveEnabledDetails", { model, ruid: card.ruid })
                    : t("tonies.messages.liveDisabledDetails", { model, ruid: card.ruid }),
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

export async function hideSelectedTonies(
    tonieCards: TonieCardProps[],
    selectedTonies: string[],
    t: any,
    overlay: string | undefined,
    addNotification: (type: NotificationTypeEnum, title: string, description: string, context: string) => void,
    onHide: (ruid: string) => void,
    confirmFn: ConfirmFn
) {
    const selected = tonieCards.filter((c) => selectedTonies.includes(c.ruid));

    for (const card of selected) {
        const model = `${card.tonieInfo.series}` + (card.tonieInfo.episode ? ` - ${card.tonieInfo.episode}` : "");

        const confirmed = await confirmFn(model);
        if (!confirmed) continue;

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
