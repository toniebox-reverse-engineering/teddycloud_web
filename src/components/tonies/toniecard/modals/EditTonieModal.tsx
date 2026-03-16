import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Divider, Form, Input, Modal, theme, Tooltip } from "antd";
import { CloseOutlined, FolderOpenOutlined, PlusOutlined, RollbackOutlined, SaveFilled, SwapOutlined } from "@ant-design/icons";

import { ToniesJsonSearch } from "../../common/searches/ToniesJsonSearch";
import { RadioStreamSearch } from "../search/RadioStreamSearch";

const { useToken } = theme;

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

    // Display text for selected model (e.g. "[01-0013] Sample Series - Episode Title")
    modelDisplayText?: string;

    // Create new model
    onCreateNewModel?: () => void;

    // Called when user selects a model from search (to update display text)
    onModelSelectResult?: (result: { value: string; selectionText: string }) => void;
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
    modelDisplayText = "",
    onCreateNewModel,
    onModelSelectResult,
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

    const isSourceUnchanged = selectedSource === (originalSource || "");
    const isModelUnchanged = selectedModel === (originalModel || "");

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
                            <Divider key="divider-source-3" orientation="vertical" style={{ marginLeft: 2 }} />,
                            <FolderOpenOutlined
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
                </Form.Item>
                {modelAudioPath && selectedSource !== modelAudioPath && (
                    <Form.Item>
                        <Button
                            type="default"
                            icon={<SwapOutlined />}
                            onClick={() => {
                                onSelectedSourceChange(modelAudioPath);
                                setInputValidationSource({ validateStatus: "", help: "" });
                            }}
                        >
                            {t("tonies.editModal.setAudioFromModel")}
                        </Button>
                    </Form.Item>
                )}
            </div>

            <Divider orientation="horizontal" titlePlacement="left">
                {t("tonies.editModal.model")}
            </Divider>
            <div>
                <Form.Item validateStatus={inputValidationModel.validateStatus} help={inputValidationModel.help}>
                    <ToniesJsonSearch
                        placeholder={t("tonies.editModal.placeholderSearchForAModel")}
                        clearInputAfterSelection={false}
                        onChange={onSearchModelChange}
                        onSelectResult={(result) => {
                            onModelSelectResult?.({ value: result.value, selectionText: result.selectionText });
                        }}
                        key={keyTonieArticleSearch}
                        showAddCustomTonieButton={false}
                        modelDisplayText={modelDisplayText}
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
                            onCreateNewModel ? (
                                <Tooltip title={t("tonies.editModal.createNewModelTooltip")}>
                                    <PlusOutlined
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={onCreateNewModel}
                                        style={{ cursor: "pointer" }}
                                    />
                                </Tooltip>
                            ) : undefined
                        }
                    />
                </Form.Item>
            </div>
        </Modal>
    );
};
