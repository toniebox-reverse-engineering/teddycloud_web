import { Input } from "antd";
import FormItem from "antd/es/form/FormItem";
import { useField } from "formik";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import SettingsDataHandler from "../../../data/SettingsDataHandler";

type InputFieldProps = {
    name: string;
    label?: string;
    description?: string;
};

export const SettingsInputField = (props: InputFieldProps) => {
    const { t } = useTranslation();
    const { name, label, description } = props;
    const [field, meta] = useField(name!);
    const [fieldValue, setFieldValue] = useState(SettingsDataHandler.getInstance().getSetting(name)?.value);
    const idListener = () => setFieldValue(SettingsDataHandler.getInstance().getSetting(name)?.value);
    SettingsDataHandler.getInstance().addIdListener(idListener, name);

    const hasFeedback = !!(meta.touched && meta.error);
    const help = meta.touched && meta.error && t(meta.error);
    const validateStatus = meta.touched && meta.error ? "error" : undefined;

    let value = fieldValue?.toString();
    return (
        <FormItem
            help={hasFeedback ? help : undefined}
            validateStatus={validateStatus}
            label={label}
            tooltip={description}
        >
            <Input
                {...field}
                value={value}
                onChange={(changeEventHandler) => {
                    SettingsDataHandler.getInstance().changeSetting(name, changeEventHandler.target.value);
                    setFieldValue(SettingsDataHandler.getInstance().getSetting(name)?.value);
                }}
            />
        </FormItem>
    );
};
