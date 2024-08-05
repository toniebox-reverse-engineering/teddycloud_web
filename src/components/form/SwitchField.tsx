import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useField } from "formik";
import FormItem from "antd/es/form/FormItem";
import { Switch, SwitchProps, message, Checkbox } from "antd";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

type SwitchFieldProps = {
    name: string;
    label?: string;
    valueConverter?: {
        fromValueToBoolean: (fromValue: any) => boolean | undefined;
        fromBooleanToValue: (booleanValue?: boolean) => any;
    };
    description?: string;
    overlayed?: boolean;
    overlayId?: string;
};

const SwitchField = (props: SwitchFieldProps & SwitchProps) => {
    const { t } = useTranslation();
    const { name, label, valueConverter, description, overlayed: initialOverlayed, overlayId, ...switchProps } = props;
    const [field, meta, { setValue }] = useField(name!);
    const [overlayed, setOverlayed] = useState(initialOverlayed);

    const hasFeedback = !!(meta.touched && meta.error);
    const help = meta.touched && meta.error && t(meta.error);
    const validateStatus = meta.touched && meta.error ? "error" : undefined;

    const isChecked = valueConverter ? valueConverter.fromValueToBoolean(meta.value) : meta.value;

    const api = new TeddyCloudApi(defaultAPIConfig());

    const handleOverlayChange = (checked: boolean) => {
        try {
            api.apiPostTeddyCloudSetting(name, field.value, overlayId, !checked)
                .then(() => {
                    // Trigger write config only if setting was successfully updated
                    triggerWriteConfig();

                    if (!checked) {
                        fetchFieldValue();
                        message.success(t("settings.overlayDisabled"));
                    } else {
                        message.success(t("settings.overlayEnabled"));
                    }
                })
                .catch((error) => {
                    message.error(`Error while ${checked ? "saving" : "resetting"} config: ${error}`);
                });
        } catch (error) {
            message.error(`Error while sending data to server: ${error}`);
        }
    };

    const triggerWriteConfig = async () => {
        try {
            await api.apiTriggerWriteConfigGet();
        } catch (error) {
            message.error("Error while saving config to file.");
        }
    };

    const fetchFieldValue = async () => {
        try {
            const response = await api.apiGetTeddyCloudSettingRaw(name);
            const value = await response.text();
            const newValue = value === "" ? undefined : valueConverter?.fromValueToBoolean(value);
            setValue(newValue);

            // Set the switch value based on the fetched value
            const isChecked = valueConverter ? valueConverter.fromValueToBoolean(value) : value;
            setValue(isChecked);
        } catch (error) {
            message.error(`Error fetching field value: ${error}`);
        }
    };

    return (
        <FormItem
            help={hasFeedback ? help : undefined}
            validateStatus={validateStatus}
            label={label}
            tooltip={description}
        >
            <Switch
                {...switchProps}
                {...field}
                checked={isChecked}
                disabled={!overlayed && overlayed !== undefined}
                onChange={(value: boolean) => {
                    try {
                        api.apiPostTeddyCloudSetting(name, value, overlayId)
                            .then(() => {
                                triggerWriteConfig();
                                message.success(t("settings.saved"));
                            })
                            .catch((e) => {
                                message.error("Error while saving config to file.");
                            });
                    } catch (e) {
                        message.error("Error while sending data to server.");
                    }
                    setValue(value);
                }}
            />
            {overlayed === undefined ? (
                ""
            ) : (
                <Checkbox
                    checked={overlayed}
                    style={{ marginLeft: "16px" }}
                    onChange={(e) => {
                        setOverlayed(e.target.checked);
                        handleOverlayChange(e.target.checked);
                    }}
                >
                    {t("settings.overlayed")}
                </Checkbox>
            )}
        </FormItem>
    );
};

export { SwitchField };
