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
  const { type, iD, description, label, shortname, value } = option;
  const [optionValue, setOptionValue] = useState<string>("");

  const [field, meta, { setValue }] = useField(iD);

  useEffect(() => {
    setOptionValue(value);
    setValue(value);
  }, []);

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