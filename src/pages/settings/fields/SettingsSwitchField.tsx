import { Switch } from "antd";
import FormItem from "antd/es/form/FormItem";
import { useField } from "formik";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import SettingsDataHandler from "../../../data/SettingsDataHandler";

type SwitchFieldProps = {
    name: string;
    label?: string;
    description?: string;
};

export const SettingsSwitchField = (props: SwitchFieldProps) => {
    const { t } = useTranslation();
    const { name, label, description} = props;
    const [field, meta] = useField(name!);
    
    const [fieldValue, setFieldValue] = useState(SettingsDataHandler.getInstance().getSetting(name)?.value)

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
            <Switch
                {...field}
                checked={fieldValue as boolean}
                onChange={(value) => {
                    SettingsDataHandler.getInstance().changeSetting(name, value)
                    setFieldValue(SettingsDataHandler.getInstance().getSetting(name)?.value)
                }}
            />            
        </FormItem>
    );
};
