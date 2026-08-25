import { defaultAPIConfig } from "../../../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../../../api";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";
import { TonieCardProps } from "../../../../types/tonieTypes";
import { toModelKey } from "../../hooks/useCustomModelKeys";
import { showAudioModelMismatchConfirm } from "../modals/AudioModelMismatchConfirmModal";
import { ValidationState } from "../TonieCardTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

type UseTonieCardSaveFlowParams = {
    tonieCard: TonieCardProps;
    overlay: string;
    modelTitle: string;
    selectedModel: string;
    selectedSource: string;
    resolvedAudioModel: string;
    modelAudioPath: string | null;
    fetchUpdatedTonieCard: () => Promise<void>;
    setIsEditModalOpen: (open: boolean) => void;
    setInputValidationModel: (value: ValidationState) => void;
    setInputValidationSource: (value: ValidationState) => void;
    t: (key: string, options?: Record<string, unknown>) => string;
    addNotification: (
        type: NotificationTypeEnum,
        title: string,
        description: string,
        context?: string,
    ) => void;
    handleNoCloudClick: () => Promise<void>;
    handleLiveClick: () => Promise<void>;
};

const notifySuccess = (
    addNotification: UseTonieCardSaveFlowParams["addNotification"],
    t: UseTonieCardSaveFlowParams["t"],
    message: string,
    description: string,
) => {
    addNotification(NotificationTypeEnum.Success, message, description, t("tonies.title"));
};

const notifyError = (
    addNotification: UseTonieCardSaveFlowParams["addNotification"],
    t: UseTonieCardSaveFlowParams["t"],
    message: string,
    description: string,
    error?: unknown,
) => {
    addNotification(
        NotificationTypeEnum.Error,
        message,
        `${description}${error ?? ""}`,
        t("tonies.title"),
    );
};

const validateSelectedModelExists = async (
    modelValue: string,
    overlay: string,
): Promise<boolean> => {
    const trimmedModel = modelValue.trim();
    if (!trimmedModel) {
        return true;
    }

    try {
        const searchValue = encodeURIComponent(trimmedModel);
        const response = await api.apiGetTeddyCloudApiRaw(
            `/api/toniesJsonSearch?searchModel=${searchValue}&searchSeries=&searchEpisode=`,
            overlay,
        );
        const data = await response.json();
        const entries = Array.isArray(data) ? data : [];
        return entries.some(
            (entry: { model?: string }) => toModelKey(entry?.model) === toModelKey(trimmedModel),
        );
    } catch {
        return false;
    }
};

const shouldWarnForModelClear = ({
    tonieCard,
    selectedSource,
    selectedModel,
    resolvedAudioModel,
    needsModelSave,
}: {
    tonieCard: TonieCardProps;
    selectedSource: string;
    selectedModel: string;
    resolvedAudioModel: string;
    needsModelSave: boolean;
}) => {
    const nextSource = (selectedSource || "").trim();
    const audioModel = (resolvedAudioModel || tonieCard.sourceInfo?.model || "").trim();
    const hasAssignedAudio = Boolean(nextSource);
    const isClearingModel = needsModelSave && selectedModel.trim() === "";

    return {
        warn: isClearingModel && hasAssignedAudio && Boolean(audioModel),
        audioModel,
    };
};

export const useTonieCardSaveFlow = ({
    tonieCard,
    overlay,
    modelTitle,
    selectedModel,
    selectedSource,
    resolvedAudioModel,
    modelAudioPath,
    fetchUpdatedTonieCard,
    setIsEditModalOpen,
    setInputValidationModel,
    setInputValidationSource,
    t,
    addNotification,
    handleNoCloudClick,
    handleLiveClick,
}: UseTonieCardSaveFlowParams) => {
    const handleModelSave = async () => {
        try {
            await api.apiPostTeddyCloudContentJson(
                tonieCard.ruid,
                "tonie_model=" + encodeURIComponent(selectedModel),
                overlay,
            );

            notifySuccess(
                addNotification,
                t,
                t("tonies.messages.setTonieToModelSuccessful", {
                    selectedModel: selectedModel
                        ? selectedModel
                        : t("tonies.messages.setToEmptyValue"),
                }),
                t("tonies.messages.setTonieToModelSuccessfulDetails", {
                    ruid: tonieCard.ruid,
                    selectedModel: selectedModel
                        ? selectedModel
                        : t("tonies.messages.setToEmptyValue"),
                }),
            );
            setInputValidationModel({ validateStatus: "", help: "" });
        } catch (error) {
            notifyError(
                addNotification,
                t,
                t("tonies.messages.setTonieToModelFailed"),
                t("tonies.messages.setTonieToModelFailedDetails", {
                    ruid: tonieCard.ruid,
                }),
                error,
            );
            setInputValidationModel({
                validateStatus: "error",
                help: t("tonies.messages.setTonieToModelFailed") + String(error ?? ""),
            });
            throw error;
        }
    };

    const handleSourceSave = async () => {
        try {
            await api.apiPostTeddyCloudContentJson(
                tonieCard.ruid,
                "source=" + encodeURIComponent(selectedSource),
                overlay,
            );

            notifySuccess(
                addNotification,
                t,
                t("tonies.messages.setTonieToSourceSuccessful"),
                t("tonies.messages.setTonieToSourceSuccessfulDetails", {
                    ruid: tonieCard.ruid,
                    selectedSource: selectedSource
                        ? selectedSource
                        : t("tonies.messages.setToEmptyValue"),
                }),
            );
            setInputValidationSource({ validateStatus: "", help: "" });
        } catch (error) {
            notifyError(
                addNotification,
                t,
                t("tonies.messages.setTonieToSourceFailed"),
                t("tonies.messages.setTonieToSourceFailedDetails", {
                    ruid: tonieCard.ruid,
                }),
                error,
            );
            setInputValidationSource({
                validateStatus: "error",
                help: t("tonies.messages.setTonieToSourceFailed") + String(error ?? ""),
            });
            throw error;
        }

        if (!tonieCard.nocloud) {
            await handleNoCloudClick();
        }
        const shouldBeLive = selectedSource.startsWith("http");
        if (shouldBeLive !== tonieCard.live) {
            await handleLiveClick();
        }
    };

    const handleSaveChanges = async () => {
        const needsModelSave = (tonieCard.tonieInfo.model || "") !== selectedModel;
        const trimmedSelectedModel = selectedModel.trim();

        if (needsModelSave && trimmedSelectedModel) {
            const modelIsValid = await validateSelectedModelExists(trimmedSelectedModel, overlay);
            if (!modelIsValid) {
                setInputValidationModel({
                    validateStatus: "error",
                    help: t("tonies.editModal.invalidModelError", { model: trimmedSelectedModel }),
                });
                return;
            }
        }

        const { warn: shouldWarnAutoModelReset, audioModel } = shouldWarnForModelClear({
            tonieCard,
            selectedSource,
            selectedModel,
            resolvedAudioModel,
            needsModelSave,
        });
        if (shouldWarnAutoModelReset) {
            const confirmed = await showAudioModelMismatchConfirm(
                t,
                audioModel || t("tonies.confirmAudioModelMismatchModal.unknownModel"),
            );
            if (!confirmed) {
                return;
            }
        }

        try {
            if ((tonieCard.source || "") !== selectedSource) {
                await handleSourceSave();
                // When syncing source from model, always update tonie_model so backend
                // does not show "assigned alternative content" (item vs item2 match).
                if (selectedModel && modelAudioPath && selectedSource === modelAudioPath) {
                    await handleModelSave();
                }
            }
            if (needsModelSave) {
                await handleModelSave();
            }
        } catch {
            await fetchUpdatedTonieCard();
            return;
        }

        setIsEditModalOpen(false);
        await fetchUpdatedTonieCard();
    };

    return {
        handleModelSave,
        handleSourceSave,
        handleSaveChanges,
    };
};
