import { useEffect, useState } from "react";
import { OptionsItem } from "../../api";
import { SwitchField } from "../form/SwitchField";
import { useField } from "formik";
import { InputField } from "../form/InputField";
import { InputNumberField } from "../form/InputNumberField";

type OptionItemProps = {
  option: OptionsItem;
};

export const OptionItem = ({ option }: OptionItemProps) => {
  const { type, iD, description, label} = option;
  const [, setOptionValue] = useState<string>("");
  const [, , { setValue }] = useField(iD);

  useEffect(() => {
    // TODO: fetch option value with API Client generator
    fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/get/${iD}`)
      .then((response) => response.text())
      .then((data) => {
        setOptionValue(data);
        if (type === "bool") {
          setValue(data === "true");
        } else if (type === "int" || type === "uint") {
          setValue(+data);
        } else if (type === "string") {
          setValue(data);
        }
      });
  }, [iD, setValue, type]);

  return (
    <div key={iD}>
      {type === "bool" && <SwitchField name={iD} label={label} description={description} />}
      {type === "int" && <InputNumberField name={iD} label={label} description={description} />}
      {type === "uint" && <InputNumberField name={iD} label={label} description={description} />}
      {type === "string" && <InputField name={iD} label={label} description={description} />}
    </div>
  );
};

export default OptionItem;
