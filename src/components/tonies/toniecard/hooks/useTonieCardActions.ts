import { useState } from "react";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../../../api";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { TonieCardProps } from "../../../../types/tonieTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

type UseTonieCardActionsParams = {
    tonieCard: TonieCardProps;
    overlay: string;
    modelTitle: string;
    t: (key: string, options?: Record<string, unknown>) => string;
    addNotification: (
        type: NotificationTypeEnum,
        title: string,
        description: string,
        context?: string,
    ) => void;
    addLoadingNotification: (key: string, title: string, description?: string) => void;
    closeLoadingNotification: (key: string) => void;
    fetchUpdatedTonieCard: () => Promise<void>;
    // the list remounts all cards on an update, which would close an open modal
    onVerified: (verifiedTonieCard: TonieCardProps, checkedTonieCard: TonieCardProps) => void;
};

export const useTonieCardActions = ({
    tonieCard,
    overlay,
    modelTitle,
    t,
    addNotification,
    addLoadingNotification,
    closeLoadingNotification,
    fetchUpdatedTonieCard,
    onVerified,
}: UseTonieCardActionsParams) => {
    const [isBackgroundDownloading, setIsBackgroundDownloading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const notifySuccess = (message: string, description: string) => {
        addNotification(NotificationTypeEnum.Success, message, description, t("tonies.title"));
    };

    const notifyError = (message: string, description: string, error?: unknown) => {
        addNotification(
            NotificationTypeEnum.Error,
            message,
            `${description}${error ?? ""}`,
            t("tonies.title"),
        );
    };

    const handleLiveClick = async () => {
        try {
            const nextLive = !tonieCard.live;
            await api.apiPostTeddyCloudContentJson(tonieCard.ruid, "live=" + nextLive, overlay);

            if (nextLive) {
                notifySuccess(
                    t("tonies.messages.liveEnabled"),
                    t("tonies.messages.liveEnabledDetails", {
                        model: modelTitle,
                        ruid: tonieCard.ruid,
                    }).replace(' "" ', " "),
                );
            } else {
                notifySuccess(
                    t("tonies.messages.liveDisabled"),
                    t("tonies.messages.liveDisabledDetails", {
                        model: modelTitle,
                        ruid: tonieCard.ruid,
                    }).replace(' "" ', " "),
                );
            }

            await fetchUpdatedTonieCard();
        } catch (error) {
            notifyError(
                t("tonies.messages.couldNotChangeLiveFlag"),
                t("tonies.messages.couldNotChangeLiveFlagDetails", {
                    model: modelTitle,
                    ruid: tonieCard.ruid,
                }).replace(' "" ', ""),
                error,
            );
        }
    };

    const handleNoCloudClick = async () => {
        try {
            const nextNoCloud = !tonieCard.nocloud;
            await api.apiPostTeddyCloudContentJson(
                tonieCard.ruid,
                "nocloud=" + nextNoCloud,
                overlay,
            );

            if (nextNoCloud) {
                notifySuccess(
                    t("tonies.messages.cloudAccessBlocked"),
                    t("tonies.messages.cloudAccessBlockedDetails", {
                        model: modelTitle,
                        ruid: tonieCard.ruid,
                    }).replace(' "" ', " "),
                );
            } else {
                notifySuccess(
                    t("tonies.messages.cloudAccessEnabled"),
                    t("tonies.messages.cloudAccessEnabledDetails", {
                        model: modelTitle,
                        ruid: tonieCard.ruid,
                    }).replace(' "" ', " "),
                );
            }

            await fetchUpdatedTonieCard();
        } catch (error) {
            notifyError(
                t("tonies.messages.couldNotChangeCloudFlag"),
                t("tonies.messages.couldNotChangeCloudFlagDetails", {
                    model: modelTitle,
                    ruid: tonieCard.ruid,
                }).replace(' "" ', ""),
                error,
            );
        }
    };

    const messageArgs = () => ({ model: modelTitle, ruid: tonieCard.ruid });

    // the server streams the TAF from the cloud and caches it; the response body itself is not needed
    const runCloudDownload = async (
        path: string | undefined,
        messages: { loading: string; success: string; error: string },
    ) => {
        if (!path || isBackgroundDownloading) return;

        const key = "loading" + tonieCard.ruid;
        setIsBackgroundDownloading(true);

        try {
            addLoadingNotification(
                key,
                t(`tonies.messages.${messages.loading}`),
                t(`tonies.messages.${messages.loading}Details`, messageArgs()).replace(' "" ', " "),
            );

            const response = await api.apiGetTeddyCloudApiRaw(path);
            await response.blob();
            closeLoadingNotification(key);

            notifySuccess(
                t(`tonies.messages.${messages.success}`),
                t(`tonies.messages.${messages.success}Details`, messageArgs()).replace(' "" ', " "),
            );
            await fetchUpdatedTonieCard();
        } catch (error) {
            closeLoadingNotification(key);
            notifyError(
                t(`tonies.messages.${messages.error}`),
                t(`tonies.messages.${messages.error}Details`, messageArgs()).replace(' "" ', ""),
                error,
            );
        } finally {
            setIsBackgroundDownloading(false);
        }
    };

    const handleBackgroundDownload = () =>
        runCloudDownload(tonieCard.downloadTriggerUrl, {
            loading: "downloading",
            success: "downloadedFile",
            error: "errorDuringDownload",
        });

    // the url can come from a just checked card that is not in the list yet
    const handleRedownload = (redownloadUrl = tonieCard.redownloadUrl) =>
        runCloudDownload(redownloadUrl, {
            loading: "redownloading",
            success: "redownloadedFile",
            error: "errorDuringRedownload",
        });

    const handleVerify = async () => {
        if (isVerifying) return;
        setIsVerifying(true);
        const checkedTonieCard = tonieCard;
        try {
            const verifiedTonieCard = await api.apiGetTagInfo(
                tonieCard.ruid,
                overlay,
                undefined,
                true,
            );
            onVerified(verifiedTonieCard, checkedTonieCard);
            if (verifiedTonieCard.corrupt) {
                notifyError(
                    t("tonies.messages.verifiedCorrupt"),
                    t("tonies.messages.verifiedCorruptDetails", messageArgs()).replace(' "" ', " "),
                );
            } else {
                notifySuccess(
                    t("tonies.messages.verifiedValid"),
                    t("tonies.messages.verifiedValidDetails", messageArgs()).replace(' "" ', " "),
                );
            }
        } catch (error) {
            notifyError(
                t("tonies.messages.errorDuringVerify"),
                t("tonies.messages.errorDuringVerifyDetails", messageArgs()).replace(' "" ', ""),
                error,
            );
        } finally {
            setIsVerifying(false);
        }
    };

    return {
        handleLiveClick,
        handleNoCloudClick,
        handleBackgroundDownload,
        handleRedownload,
        handleVerify,
        isBackgroundDownloading,
        isVerifying,
    };
};
