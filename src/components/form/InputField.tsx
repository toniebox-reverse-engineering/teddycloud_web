import { useTranslation } from "react-i18next";
import { useField } from "formik";
import FormItem from "antd/es/form/FormItem";
import { Input, InputProps, message } from "antd";
import { ChangeEvent } from "react";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";

type InputFieldProps = {
  name: string;
  label?: string;
};

const api = new TeddyCloudApi(defaultAPIConfig());

const InputField = (props: InputFieldProps & InputProps) => {
  const { t } = useTranslation();
  const { name, label, ...inputProps } = props;
  const [field, meta, helpers] = useField(name!);

  const hasFeedback = !!(meta.touched && meta.error);
  const help = meta.touched && meta.error && t(meta.error);
  const validateStatus = meta.touched && meta.error ? "error" : undefined;

  return (
    <FormItem
      help={hasFeedback ? help : undefined}
      validateStatus={validateStatus}
      label={label}
    >
      <Input
        {...inputProps}
        {...field}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const triggerWriteConfig = async () => {
            await api.apiTriggerWriteConfigGet();
          };

          try {
            fetch(
              `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/set/${name}`,
              {
                method: "POST",
                body: event.target.value,
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

          helpers.setValue(event.target.value);
        }}
      />
    </FormItem>
  );
};

export { InputField };
