import { useTranslation } from "react-i18next";
import { useField } from "formik";
import FormItem from "antd/es/form/FormItem";
import { InputNumber, InputNumberProps, message } from "antd";
import { ChangeEvent } from "react";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { TeddyCloudApi } from "../../api";

type InputNumberFieldProps = {
  name: string;
  label?: string;
  description?: string;
};

const InputNumberField = (props: InputNumberFieldProps & InputNumberProps) => {
  const { t } = useTranslation();
  const { name, label, description, ...inputNumberProps } = props;
  const [field, meta, helpers] = useField<number | undefined>(name!);

  const hasFeedback = !!(meta.touched && meta.error);
  const help = meta.touched && meta.error && t(meta.error);
  const validateStatus = meta.touched && meta.error ? "error" : undefined;

  const api = new TeddyCloudApi(defaultAPIConfig());

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
        onChange={(value: number | undefined | string | null) => {
          const triggerWriteConfig = async () => {
            await api.apiTriggerWriteConfigGet();
          };

          try {
            fetch(
              `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/set/${name}`,
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
