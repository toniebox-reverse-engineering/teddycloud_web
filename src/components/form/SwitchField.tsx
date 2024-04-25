import { useTranslation } from "react-i18next";
import { useField } from "formik";
import FormItem from "antd/es/form/FormItem";
import { Switch, SwitchProps, message } from "antd";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";

type SwitchFieldProps = {
  name: string;
  label?: string;
  valueConverter?: {
    fromValueToBoolean: (fromValue: any) => boolean | undefined;
    fromBooleanToValue: (booleanValue?: boolean) => any;
  };
  description?: string;
};
const api = new TeddyCloudApi(defaultAPIConfig());

export const SwitchField = (props: SwitchFieldProps & SwitchProps) => {
  const { t } = useTranslation();
  const { name, label, valueConverter, description, ...switchProps } = props;
  const [field, meta, { setValue }] = useField(name!);

  const hasFeedback = !!(meta.touched && meta.error);
  const help = meta.touched && meta.error && t(meta.error);
  const validateStatus = meta.touched && meta.error ? "error" : undefined;

  const isChecked = valueConverter
    ? valueConverter.fromValueToBoolean(meta.value)
    : meta.value;

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
        onChange={(value: boolean) => {
          //TODO: Fix fetch and replace with apiClient
          const triggerWriteConfig = async () => {
            await api.apiTriggerWriteConfigGet();
          };

          try {
            fetch(
              `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/set/${name}`,
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

          setValue(value);
        }}
      />
    </FormItem>
  );
};
