import { Checkbox, InputNumber } from "antd";
import FormItem from "antd/es/form/FormItem";
import { useField } from "formik";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import SettingsDataHandler from "../../../data/SettingsDataHandler";

type InputNumberFieldProps = {
    name: string;
    label?: string;
    description?: string;
    overlayed?: boolean;
    overlayId?: string;
};

export const SettingsInputNumberField: React.FC<InputNumberFieldProps> = (props) => {
    const { t } = useTranslation();
    const { name, label, description, overlayed: initialOverlayed } = props;
    const [field, meta] = useField<number | undefined>(name!);
    const [overlayed, setOverlayed] = useState<boolean | undefined>(initialOverlayed); // State to track overlayed boolean

    const [fieldValue, setFieldValue] = useState(SettingsDataHandler.getInstance().getSetting(name)?.value);
    const idListener = () => {
        setFieldValue(SettingsDataHandler.getInstance().getSetting(name)?.value);
        setOverlayed(
            overlayed !== undefined ? SettingsDataHandler.getInstance().getSetting(name)?.overlayed : undefined
        );
    };

    SettingsDataHandler.getInstance().addIdListener(idListener, name);

    const hasFeedback = !!(meta.touched && meta.error);
    const help = meta.touched && meta.error && t(meta.error);
    const validateStatus = meta.touched && meta.error ? "error" : undefined;

    let value = fieldValue as number;

    const suffix = [
        overlayed === undefined ? null : (
            <Checkbox
                checked={overlayed}
                onChange={(changeEventHandler) => {
                    SettingsDataHandler.getInstance().changeSettingOverlayed(name, changeEventHandler.target.checked);
                    setOverlayed(SettingsDataHandler.getInstance().getSetting(name)?.overlayed);
                }}
                key="overlayCheckBox"
            >
                {t("settings.overlayed")}
            </Checkbox>
        ),
    ];

    return (
        <FormItem
            help={hasFeedback ? help : undefined}
            validateStatus={validateStatus}
            label={label}
            tooltip={description}
        >
            <InputNumber
                {...field}
                value={value}
                onChange={(value) => {
                    SettingsDataHandler.getInstance().changeSetting(name, value ?? 0, overlayed);
                    setFieldValue(SettingsDataHandler.getInstance().getSetting(name)?.value);
                }}
                {...(overlayed !== undefined ? { suffix } : null)}
                disabled={!overlayed && overlayed !== undefined}
            />
        </FormItem>
    );
};
