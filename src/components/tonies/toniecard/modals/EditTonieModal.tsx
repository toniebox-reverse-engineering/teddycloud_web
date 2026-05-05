import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Divider, Form, Input, Modal, theme, Tooltip, Typography } from "antd";
import {
    CloseOutlined,
    EditOutlined,
    FolderOpenOutlined,
    InfoCircleOutlined,
    PlusOutlined,
    RollbackOutlined,
    SaveFilled,
    SwapOutlined,
} from "@ant-design/icons";

import { ToniesJsonSearch } from "../../common/searches/ToniesJsonSearch";
import { RadioStreamSearch } from "../search/RadioStreamSearch";
import { toModelKey } from "../../utils/modelKey";

const { useToken } = theme;
const { Text } = Typography;

type ValidateStatus = "" | "success" | "warning" | "error" | "validating" | undefined;

interface EditTonieModalProps {
    open: boolean;
    title: React.ReactNode;
    onCancel: () => void;
    onSave: () => void;

    // Source
    selectedSource: string;
    onSelectedSourceChange: (value: string) => void;
    originalSource: string;
    inputValidationSource: {
        validateStatus: ValidateStatus;
        help: string;
    };
    setInputValidationSource: (state: { validateStatus: ValidateStatus; help: string }) => void;
    keyRadioStreamSearch: number;
    onSearchRadioChange: (value: string) => void;

    // Model
    selectedModel: string;
    onSelectedModelChange: (value: string) => void;
    originalModel: string;
    inputValidationModel: {
        validateStatus: ValidateStatus;
        help: string;
    };
    setInputValidationModel: (state: { validateStatus: ValidateStatus; help: string }) => void;
    keyTonieArticleSearch: number;
    onSearchModelChange: (value: string) => void;

    hasPendingChanges: boolean;

    // File selection
    onOpenFileSelectModal: () => void;

    // Set audio from model (when source differs from model and model audio exists in library)
    modelAudioPath?: string | null;
    modelAudioHasMapping?: boolean;

    // Display text for selected model (e.g. "[01-0013] Sample Series - Episode Title")
    modelDisplayText?: string;

    // Create new model
    onCreateNewModel?: () => void;

    // Edit selected model (opens model edit modal on top). Only shown when isSelectedModelCustom is true.
    onEditModel?: () => void;
    isSelectedModelCustom?: boolean;

    /** When true, model is from tonies.json (original) – display only, no edit/remove. Only audio assignment allowed. */
    modelReadOnly?: boolean;

    // Called when user selects a model from search (to update display text)
    onModelSelectResult?: (result: { value: string; selectionText: string }) => void;
    modelInfoTooltip?: React.ReactNode;
    audioInfoTooltip?: React.ReactNode;
    audioModelForSet?: string;
    onSetModelFromAudio?: () => void;
}

export const EditTonieModal: React.FC<EditTonieModalProps> = ({
    open,
    title,
    onCancel,
    onSave,
    selectedSource,
    onSelectedSourceChange,
    originalSource,
    inputValidationSource,
    setInputValidationSource,
    keyRadioStreamSearch,
    onSearchRadioChange,
    selectedModel,
    onSelectedModelChange,
    originalModel,
    inputValidationModel,
    setInputValidationModel,
    keyTonieArticleSearch,
    onSearchModelChange,
    hasPendingChanges,
    onOpenFileSelectModal,
    modelAudioPath,
    modelAudioHasMapping = false,
    modelDisplayText = "",
    onCreateNewModel,
    onEditModel,
    isSelectedModelCustom = false,
    modelReadOnly = false,
    onModelSelectResult,
    modelInfoTooltip,
    audioInfoTooltip,
    audioModelForSet,
    onSetModelFromAudio,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const handleClearSource = () => {
        onSelectedSourceChange("");
        setInputValidationSource({ validateStatus: "", help: "" });
    };

    const handleRollbackSource = () => {
        onSelectedSourceChange(originalSource);
        setInputValidationSource({ validateStatus: "", help: "" });
    };

    const handleClearModel = () => {
        onSelectedModelChange("");
        setInputValidationModel({ validateStatus: "", help: "" });
    };

    const handleRollbackModel = () => {
        onSelectedModelChange(originalModel);
        setInputValidationModel({ validateStatus: "", help: "" });
    };

    const normalized = (value?: string | null) =>
        String(value || "")
            .trim()
            .toLowerCase();
    const isSourceUnchanged = selectedSource === (originalSource || "");
    const isModelUnchanged = selectedModel === (originalModel || "");
    const sourceMatchesModelAudio =
        Boolean(modelAudioPath) && normalized(selectedSource) === normalized(modelAudioPath);
    const showSyncActions = !sourceMatchesModelAudio;
    const normalizedAudioModelForSet = (audioModelForSet || "").trim();
    // Show when model has a tonies.json mapping and source ≠ model audio; enable once library path resolved.
    const showSetAudioFromModelAction =
        showSyncActions && Boolean(selectedModel.trim()) && Boolean(modelAudioHasMapping);
    const showSetModelFromAudioAction =
        showSyncActions &&
        Boolean(normalizedAudioModelForSet) &&
        Boolean(onSetModelFromAudio) &&
        toModelKey(selectedModel) !== toModelKey(normalizedAudioModelForSet);
    const setAudioFromModelDisabled = showSetAudioFromModelAction && !modelAudioPath;
    const setAudioFromModelTooltip = !modelAudioPath
        ? t("tonies.editModal.setAudioFromModelUnavailableInLibrary")
        : undefined;

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            title={title}
            footer={
                <Button type="primary" onClick={onSave} disabled={!hasPendingChanges}>
                    <SaveFilled key="saveClick" /> {t("tonies.editModal.save")}
                </Button>
            }
            width={700}
        >
            <Divider orientation="horizontal" titlePlacement="left">
                {t("tonies.editModal.source")}
            </Divider>
            <div>
                <Form.Item validateStatus={inputValidationSource.validateStatus} help={inputValidationSource.help}>
                    <Input
                        key="source"
                        value={selectedSource}
                        width="auto"
                        onChange={(e) => onSelectedSourceChange(e.target.value)}
                        prefix={[
                            <CloseOutlined
                                key="close-source"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={handleClearSource}
                            />,
                            <Divider key="divider-source-1" orientation="vertical" style={{ marginLeft: 2 }} />,
                            <RollbackOutlined
                                key="rollback-source"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={handleRollbackSource}
                                style={{
                                    color: isSourceUnchanged ? token.colorTextDisabled : token.colorText,
                                    cursor: isSourceUnchanged ? "default" : "pointer",
                                }}
                                className={isSourceUnchanged ? "disabled" : "enabled"}
                            />,
                            <Divider key="divider-source-2" orientation="vertical" style={{ marginLeft: 2 }} />,
                        ]}
                        suffix={[
                            audioInfoTooltip ? (
                                <Tooltip key="audio-info" trigger={["hover", "click"]} title={audioInfoTooltip}>
                                    <InfoCircleOutlined onMouseDown={(e) => e.preventDefault()} />
                                </Tooltip>
                            ) : null,
                            audioInfoTooltip ? (
                                <Divider key="divider-source-info" orientation="vertical" style={{ marginLeft: 2 }} />
                            ) : null,
                            <Divider key="divider-source-3" orientation="vertical" style={{ marginLeft: 2 }} />,
                            <FolderOpenOutlined
                                key="select-file"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={onOpenFileSelectModal}
                            />,
                        ]}
                    />
                    <RadioStreamSearch
                        placeholder={t("tonies.editModal.placeholderSearchForARadioStream")}
                        onChange={onSearchRadioChange}
                        key={keyRadioStreamSearch}
                    />
                    {showSetAudioFromModelAction && (
                        <Form.Item style={{ marginTop: 8, marginBottom: 0 }}>
                            <Tooltip title={setAudioFromModelTooltip}>
                                <Button
                                    type="default"
                                    icon={<SwapOutlined />}
                                    disabled={setAudioFromModelDisabled}
                                    onClick={() => {
                                        if (!modelAudioPath) return;
                                        onSelectedSourceChange(modelAudioPath);
                                        setInputValidationSource({ validateStatus: "", help: "" });
                                    }}
                                >
                                    {t("tonies.editModal.setAudioFromModel")}
                                </Button>
                            </Tooltip>
                        </Form.Item>
                    )}
                </Form.Item>
            </div>

            <Divider orientation="horizontal" titlePlacement="left">
                {t("tonies.editModal.model")}
            </Divider>
            <div>
                {modelReadOnly ? (
                    <Form.Item>
                        <Input
                            value={modelDisplayText || selectedModel || originalModel}
                            readOnly
                            disabled
                            style={{ color: token.colorText, cursor: "default" }}
                            suffix={
                                modelInfoTooltip ? (
                                    <Tooltip trigger={["hover", "click"]} title={modelInfoTooltip}>
                                        <InfoCircleOutlined onMouseDown={(e) => e.preventDefault()} />
                                    </Tooltip>
                                ) : null
                            }
                        />
                        <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
                            {t("tonies.editModal.modelReadOnlyHint")}
                        </Text>
                    </Form.Item>
                ) : (
                    <Form.Item validateStatus={inputValidationModel.validateStatus} help={inputValidationModel.help}>
                        <Input
                            value={selectedModel}
                            onChange={(e) => onSelectedModelChange(e.target.value)}
                            prefix={
                                <>
                                    <CloseOutlined
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={handleClearModel}
                                        style={{ cursor: "pointer" }}
                                    />
                                    <Divider orientation="vertical" style={{ marginLeft: 2 }} />
                                    <RollbackOutlined
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={handleRollbackModel}
                                        style={{
                                            color: isModelUnchanged ? token.colorTextDisabled : token.colorText,
                                            cursor: isModelUnchanged ? "default" : "pointer",
                                        }}
                                    />
                                    <Divider orientation="vertical" style={{ marginLeft: 2 }} />
                                </>
                            }
                            suffix={
                                <>
                                    {modelInfoTooltip ? (
                                        <>
                                            <Tooltip trigger={["hover", "click"]} title={modelInfoTooltip}>
                                                <InfoCircleOutlined onMouseDown={(e) => e.preventDefault()} />
                                            </Tooltip>
                                            <Divider orientation="vertical" style={{ marginLeft: 2, marginRight: 2 }} />
                                        </>
                                    ) : null}
                                    {selectedModel && onEditModel && isSelectedModelCustom ? (
                                        <>
                                            <Tooltip title={t("tonies.editModal.editModelTooltip")}>
                                                <EditOutlined
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={onEditModel}
                                                    style={{ cursor: "pointer" }}
                                                />
                                            </Tooltip>
                                            {onCreateNewModel ? (
                                                <Divider
                                                    orientation="vertical"
                                                    style={{ marginLeft: 2, marginRight: 2 }}
                                                />
                                            ) : null}
                                        </>
                                    ) : null}
                                    {onCreateNewModel ? (
                                        <Tooltip title={t("tonies.editModal.createNewModelTooltip")}>
                                            <PlusOutlined
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={onCreateNewModel}
                                                style={{ cursor: "pointer" }}
                                            />
                                        </Tooltip>
                                    ) : null}
                                </>
                            }
                        />
                        <ToniesJsonSearch
                            placeholder={t("tonies.editModal.placeholderSearchForAModel")}
                            clearInputAfterSelection={true}
                            onChange={onSearchModelChange}
                            onSelectResult={(result) => {
                                onModelSelectResult?.({ value: result.value, selectionText: result.selectionText });
                            }}
                            key={keyTonieArticleSearch}
                            showAddCustomTonieButton={false}
                        />
                        {showSetModelFromAudioAction ? (
                            <Form.Item style={{ marginTop: 8, marginBottom: 0 }}>
                                <Button
                                    type="default"
                                    icon={<SwapOutlined />}
                                    onClick={() => {
                                        onSetModelFromAudio?.();
                                        setInputValidationModel({ validateStatus: "", help: "" });
                                    }}
                                >
                                    {t("tonies.editModal.setModelFromAudio")}
                                </Button>
                            </Form.Item>
                        ) : null}
                    </Form.Item>
                )}
            </div>
        </Modal>
    );
};
