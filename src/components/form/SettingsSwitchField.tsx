import { Checkbox, Switch } from "antd";
import FormItem from "antd/es/form/FormItem";
import { useField } from "formik";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import SettingsDataHandler from "../../data/SettingsDataHandler";

type SwitchFieldProps = {
    name: string;
    label?: string;
    description?: string;
    overlayed?: boolean;
    overlayId?: string;
};

export const SettingsSwitchField = (props: SwitchFieldProps) => {
    const { t } = useTranslation();
    const { name, label, description, overlayed: initialOverlayed } = props;
    const [field, meta] = useField(name!);
    const [overlayed, setOverlayed] = useState<boolean | undefined>(initialOverlayed); // State to track overlayed boolean

    const [fieldValue, setFieldValue] = useState(SettingsDataHandler.getInstance().getSetting(name)?.value);

    const hasFeedback = !!(meta.touched && meta.error);
    const help = meta.touched && meta.error && t(meta.error);
    const validateStatus = meta.touched && meta.error ? "error" : undefined;
    const idListener = () => {
        setFieldValue(SettingsDataHandler.getInstance().getSetting(name)?.value);
        setOverlayed(
            overlayed !== undefined ? SettingsDataHandler.getInstance().getSetting(name)?.overlayed : undefined
        );
    };

    SettingsDataHandler.getInstance().addIdListener(idListener, name);

    let value = fieldValue as boolean;

    return (
        <FormItem
            help={hasFeedback ? help : undefined}
            validateStatus={validateStatus}
            label={label}
            tooltip={description}
        >
            <Switch
                {...field}
                checked={value}
                onChange={(value) => {
                    SettingsDataHandler.getInstance().changeSetting(name, value, overlayed);
                    setFieldValue(SettingsDataHandler.getInstance().getSetting(name)?.value);
                }}
                disabled={!overlayed && overlayed !== undefined}
            />
            {overlayed === undefined ? (
                ""
            ) : (
                <Checkbox
                    checked={overlayed}
                    style={{ marginLeft: "16px" }}
                    onChange={(changeEventHandler) => {
                        SettingsDataHandler.getInstance().changeSettingOverlayed(
                            name,
                            changeEventHandler.target.checked
                        );
                        setOverlayed(SettingsDataHandler.getInstance().getSetting(name)?.overlayed);
                    }}
                    key="overlayCheckBox"
                >
                    {t("settings.overlayed")}
                </Checkbox>
            )}
        </FormItem>
    );
};
