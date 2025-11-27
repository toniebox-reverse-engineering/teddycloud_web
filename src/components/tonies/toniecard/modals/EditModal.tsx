import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Divider, Form, Input, Modal, theme } from "antd";
import { CloseOutlined, FolderOpenOutlined, RollbackOutlined, SaveFilled } from "@ant-design/icons";

import { ToniesJsonSearch } from "../../common/searchs/ToniesJsonSearch";
import { RadioStreamSearch } from "../search/RadioStreamSearch";

const { useToken } = theme;

type ValidateStatus = "" | "success" | "warning" | "error" | "validating" | undefined;

interface EditModalProps {
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
}

export const EditModal: React.FC<EditModalProps> = ({
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
                            <Divider key="divider-source-1" orientation="vertical" />,
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
                            <Divider key="divider-source-2" orientation="vertical" />,
                        ]}
                        suffix={
                            <FolderOpenOutlined
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={onOpenFileSelectModal}
                            />
                        }
                    />
                    <RadioStreamSearch
                        placeholder={t("tonies.editModal.placeholderSearchForARadioStream")}
                        onChange={onSearchRadioChange}
                        key={keyRadioStreamSearch}
                    />
                </Form.Item>
            </div>

            <Divider orientation="horizontal" titlePlacement="left">
                {t("tonies.editModal.model")}
            </Divider>
            <div>
                <Form.Item validateStatus={inputValidationModel.validateStatus} help={inputValidationModel.help}>
                    <Input
                        key="model"
                        value={selectedModel}
                        width="auto"
                        onChange={(e) => onSelectedModelChange(e.target.value)}
                        prefix={[
                            <CloseOutlined
                                key="close-model"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={handleClearModel}
                            />,
                            <Divider key="divider-model-1" orientation="vertical" />,
                            <RollbackOutlined
                                key="rollback-model"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={handleRollbackModel}
                                style={{
                                    color: isModelUnchanged ? token.colorTextDisabled : token.colorText,
                                    cursor: isModelUnchanged ? "default" : "pointer",
                                }}
                                className={isModelUnchanged ? "disabled" : "enabled"}
                            />,
                            <Divider key="divider-model-2" orientation="vertical" />,
                        ]}
                    />
                    <ToniesJsonSearch
                        placeholder={t("tonies.editModal.placeholderSearchForAModel")}
                        clearInputAfterSelection={false}
                        onChange={onSearchModelChange}
                        key={keyTonieArticleSearch}
                    />
                </Form.Item>
            </div>
        </Modal>
    );
};
