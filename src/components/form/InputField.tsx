import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useField } from "formik";
import FormItem from "antd/es/form/FormItem";
import { Input, InputProps, message, Checkbox } from "antd";
import { ChangeEvent } from "react";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

type InputFieldProps = {
  name: string;
  label?: string;
  description?: string;
  overlayed?: boolean;
  overlayId?: string;
};

export const InputField = (props: InputFieldProps & InputProps) => {
  const { t } = useTranslation();
  const { name, label, description, overlayed: initialOverlayed, overlayId, ...inputProps } = props;
  const [field, meta, helpers] = useField(name!);
  const [overlayed, setOverlayed] = useState(initialOverlayed); // State to track overlayed boolean

  const hasFeedback = !!(meta.touched && meta.error);
  const help = meta.touched && meta.error && t(meta.error);
  const validateStatus = meta.touched && meta.error ? "error" : undefined;

  const addonAfter = overlayed === undefined ? "" : (
    <Checkbox
      checked={overlayed}
      onChange={(e) => {
        setOverlayed(e.target.checked);
        handleOverlayChange(e.target.checked);
      }}
    >
      {t("settings.overlayed")}
    </Checkbox>
  );

  const api = new TeddyCloudApi(defaultAPIConfig());

  const handleOverlayChange = (checked: boolean) => {
    const overlayRoute = `?overlay=${overlayId}`;
    const url = `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/${checked ? "set" : "reset"}/${name}${overlayRoute}`;

    try {
      fetch(url, {
        method: "POST",
        body: checked ? (field.value?.toString() || "") : "",
        headers: {
          "Content-Type": "text/plain",
        },
      }).then(() => {
        triggerWriteConfig();
      }).catch((error) => {
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
        addonAfter={addonAfter}
        disabled={!overlayed && overlayed !== undefined} // Disable if overlayed is false
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const triggerWriteConfig = async () => {
            await api.apiTriggerWriteConfigGet();
          };

          const overlayRoute = overlayed ? `?overlay=` + overlayId : ``;

          try {
            fetch(
              `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/set/${name}${overlayRoute}`,
              {
                method: "POST",
                body: event.target.value,
                headers: {
                  "Content-Type": "text/plain",
                },
              }
            ).then(() => {
              triggerWriteConfig();
            }).catch((e) => {
              message.error("Error while sending data to server.");
            });
          } catch (e) {
            message.error("Error while sending data to server.");
          }

          helpers.setValue(event.target.value);
        }}
      />
    </FormItem>
  );
};
