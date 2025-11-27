import React from "react";
import { Modal, Divider, Input, Typography, Button, Select, theme } from "antd";
import { useTranslation } from "react-i18next";
import { RollbackOutlined, SaveFilled } from "@ant-design/icons";

import { useTeddyCloud } from "../../../../contexts/TeddyCloudContext";

const { Paragraph, Text } = Typography;
const { useToken } = theme;

interface EditModalProps {
    open: boolean;
    tonieboxName: string;
    tonieboxVersion: string;
    tonieboxIdFormatted: string;
    boxName: string;
    originalBoxName: string;
    selectedModel: string;
    onBoxNameChange: (value: string) => void;
    onSelectedModelChange: (value: string) => void;
    isSaveDisabled: boolean;
    onCancel: () => void;
    onSave: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({
    open,
    tonieboxName,
    tonieboxVersion,
    tonieboxIdFormatted,
    boxName,
    originalBoxName,
    selectedModel,
    onBoxNameChange,
    onSelectedModelChange,
    isSaveDisabled,
    onCancel,
    onSave,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { boxModelImages } = useTeddyCloud();

    const boxModelOptions = [{ label: t("tonieboxes.editModelModal.unsetBoxName"), value: "-1" }].concat(
        boxModelImages.map((v) => {
            return { label: v.name, value: v.id };
        })
    );

    const footer = (
        <Button type="primary" onClick={onSave} disabled={isSaveDisabled}>
            <SaveFilled /> {t("tonies.editModal.save")}
        </Button>
    );

    return (
        <Modal
            title={
                <h3>
                    {t("tonieboxes.editModelModal.editModel", {
                        name: tonieboxName,
                    })}
                    <br />
                    <Text type="secondary">
                        {(tonieboxVersion !== "UNKNOWN" ? tonieboxVersion : "MAC") + ": " + tonieboxIdFormatted}
                    </Text>
                </h3>
            }
            open={open}
            footer={footer}
            onCancel={onCancel}
        >
            <Divider orientation="horizontal" titlePlacement="left">
                {t("tonieboxes.editModelModal.name")}
            </Divider>
            <Paragraph>
                <Input
                    name="boxName"
                    value={boxName}
                    onChange={(e) => onBoxNameChange(e.target.value)}
                    prefix={[
                        <RollbackOutlined
                            key="rollback"
                            className={boxName === originalBoxName ? "disabled" : "enabled"}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => onBoxNameChange(originalBoxName)}
                            style={{
                                color: boxName === originalBoxName ? token.colorTextDisabled : token.colorText,
                                cursor: boxName === originalBoxName ? "default" : "pointer",
                            }}
                        />,
                        <Divider key="divider-source" orientation="vertical" />,
                    ]}
                />
            </Paragraph>
            <Divider orientation="horizontal" titlePlacement="left">
                {t("tonieboxes.editModelModal.model")}
            </Divider>
            <Paragraph>
                <Select
                    options={boxModelOptions}
                    value={selectedModel}
                    onChange={(value) => onSelectedModelChange(value)}
                />
            </Paragraph>
        </Modal>
    );
};
