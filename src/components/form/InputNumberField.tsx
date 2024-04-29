import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useField } from "formik";
import FormItem from "antd/es/form/FormItem";
import { InputNumber, InputNumberProps, message, Checkbox } from "antd";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

type InputNumberFieldProps = {
  name: string;
  label?: string;
  description?: string;
  overlayed?: boolean;
  overlayId?: string;
};

const InputNumberField = (props: InputNumberFieldProps & InputNumberProps) => {
  const { t } = useTranslation();
  const { name, label, description, overlayed: initialOverlayed, overlayId, ...inputNumberProps } = props;
  const [field, meta, helpers] = useField<number | undefined>(name!);
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
        body: checked ? (field.value?.toString() || "") : "", // Send value only when setting
        headers: {
          "Content-Type": "text/plain",
        },
      }).then(() => {
        // Trigger write config only if setting was successfully updated
        triggerWriteConfig();
        if (!checked) {
          // Fetch field value if checkbox is unchecked
          fetchFieldValue();
        }
      }).catch((error) => {
        message.error(`Error while ${checked ? "saving" : "resetting"} config: ${error}`);
      });
    } catch (error) {
      message.error(`Error while sending data to server: ${error}`);
    }
  };

  const fetchFieldValue = () => {
    try {
      fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/get/${name}`)
        .then(response => response.text())
        .then(value => {
          helpers.setValue(value === "" ? undefined : Number(value));
        })
        .catch(error => {
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

  return (
    <FormItem
      help={hasFeedback ? help : undefined}
      validateStatus={validateStatus}
      label={label}
      tooltip={description}
    >
      <InputNumber
        {...inputNumberProps}
        {...field}
        addonAfter={addonAfter}
        disabled={!overlayed && overlayed !== undefined} // Disable when overlayed is unset
        onChange={(value: number | undefined | string | null) => {
          const overlayRoute = overlayed ? `?overlay=` + overlayId : ``;

          try {
            fetch(
              `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/set/${name}${overlayRoute}`,
              {
                method: "POST",
                body: value?.toString(),
                headers: {
                  "Content-Type": "text/plain",
                },
              }
            );

            try {
              triggerWriteConfig();
            } catch (e) {
              message.error("Error while saving config to file.");
            }
          } catch (e) {
            message.error("Error while sending data to server.");
          }

          helpers.setValue(value === null ? undefined : Number(value));
        }}
        onBlur={() => helpers.setTouched(true)}
      />
    </FormItem>
  );
};

export { InputNumberField };
