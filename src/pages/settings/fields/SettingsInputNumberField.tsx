import { InputNumber } from "antd";
import FormItem from "antd/es/form/FormItem";
import { useField } from "formik";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import SettingsDataHandler from "../../../data/SettingsDataHandler";

type InputNumberFieldProps = {
    name: string;
    label?: string;
    description?: string;
};

export const SettingsInputNumberField = (props: InputNumberFieldProps) => {
    const { t } = useTranslation();
    const { name, label, description } = props;
    const [field, meta, helpers] = useField<number | undefined>(name!);
    const [fieldValue, setFieldValue] = useState(SettingsDataHandler.getInstance().getSetting(name)?.value);
    const idListener = () => setFieldValue(SettingsDataHandler.getInstance().getSetting(name)?.value);
    SettingsDataHandler.getInstance().addIdListener(idListener, name);

    const hasFeedback = !!(meta.touched && meta.error);
    const help = meta.touched && meta.error && t(meta.error);
    const validateStatus = meta.touched && meta.error ? "error" : undefined;

    return (
        <FormItem
            help={hasFeedback ? help : undefined}
            validateStatus={validateStatus}
            label={label}
            tooltip={description}
        >
            <InputNumber
                {...field}
                value={fieldValue as number}
                onChange={(value) => {
                    SettingsDataHandler.getInstance().changeSetting(name, value ?? 0);
                    setFieldValue(SettingsDataHandler.getInstance().getSetting(name)?.value);
                }}
                onBlur={() => helpers.setTouched(true)}
            />
        </FormItem>
    );
};
