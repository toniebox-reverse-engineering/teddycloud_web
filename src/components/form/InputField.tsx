import { SaveOutlined } from "@ant-design/icons";
import { Checkbox, Input, InputProps, message } from "antd";
import FormItem from "antd/es/form/FormItem";
import { useField } from "formik";
import { MouseEventHandler, useState } from "react";
import { useTranslation } from "react-i18next";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import SettingsDataHandler from "../../data/SettingsDataHandler";

type InputFieldProps = {
    name: string;
    label?: string;
    description?: string;
    overlayed?: boolean;
    overlayId?: string;
};

const InputField = (props: InputFieldProps & InputProps) => {
    const { t } = useTranslation();
    const { name, label, description, overlayed: initialOverlayed, overlayId, ...inputProps } = props;
    const [field, meta, helpers] = useField(name!);
    const [overlayed, setOverlayed] = useState(initialOverlayed);
    const [fieldValue, setFieldValue] = useState(SettingsDataHandler.getInstance().getSetting(name)?.value)

    const hasFeedback = !!(meta.touched && meta.error);
    const help = meta.touched && meta.error && t(meta.error);
    const validateStatus = meta.touched && meta.error ? "error" : undefined;

    const api = new TeddyCloudApi(defaultAPIConfig());

    const handleOverlayChange = (checked: boolean) => {
        try {
            api.apiPostTeddyCloudSetting(name, field.value, overlayId, !checked)
                .then(() => {
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

    const handleFieldSave: MouseEventHandler<HTMLSpanElement> = (event) => {
        const triggerWriteConfig = async () => {
            await api.apiTriggerWriteConfigGet();
        };

        try {
            api.apiPostTeddyCloudSetting(name, field.value, overlayId)
                .then(() => {
                    triggerWriteConfig();
                    message.success(t("settings.saved"));
                })
                .catch((e) => {
                    message.error("Error while sending data to file.");
                });
        } catch (e) {
            message.error("Error while sending data to server.");
        }

        helpers.setValue(field.value || "");
    };

    const handleSaveIconClick: MouseEventHandler<HTMLSpanElement> = (event) => {
        handleFieldSave(event);
    };

    const fetchFieldValue = () => {
        try {
            api.apiGetTeddyCloudSettingRaw(name)
                .then((response) => response.text())
                .then((value) => {
                    helpers.setValue(value);
                })
                .catch((error) => {
                    message.error(`Error fetching field value: ${error}`);
                });
        } catch (error) {
            message.error(`Error fetching field value: ${error}`);
        }
    };

    const triggerWriteConfig = async () => {
        try {
            await api.apiTriggerWriteConfigGet();
        } catch (error) {
            message.error("Error while saving config to file.");
        }
    };

    const addonAfter = [
        <SaveOutlined
            disabled={overlayed ? false : true}
            style={{
                cursor: overlayed || overlayed === undefined ? "pointer" : "default",
                margin: overlayed !== undefined ? "0 16px 0 0" : "0",
            }}
            onClick={handleSaveIconClick}
            key="saveIcon"
        />,
        overlayed === undefined ? (
            ""
        ) : (
            <Checkbox
                checked={overlayed}
                onChange={(e) => {
                    setOverlayed(e.target.checked);
                    handleOverlayChange(e.target.checked);
                }}
                key="overlayCheckBox"
            >
                {t("settings.overlayed")}
            </Checkbox>
        ),
    ];
    let value = fieldValue?.toString()
    return (
        <FormItem
            help={hasFeedback ? help : undefined}
            validateStatus={validateStatus}
            label={label}
            tooltip={description}
        >
            <Input
                {...inputProps}
                {...field}
                value={value}
                addonAfter={addonAfter}
                disabled={!overlayed && overlayed !== undefined}
                onChange={(changeEventHandler) => {
                    SettingsDataHandler.getInstance().changeSetting(name, changeEventHandler.target.value)
                    setFieldValue(SettingsDataHandler.getInstance().getSetting(name)?.value)
                    return 
                }}
            />
        </FormItem>
    );
};

export { InputField };

