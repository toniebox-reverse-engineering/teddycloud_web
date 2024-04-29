import { useEffect, useState } from "react";
import { OptionsItem } from "../../api";
import { SwitchField } from "../form/SwitchField";
import { useField } from "formik";
import { InputField } from "../form/InputField";
import { InputNumberField } from "../form/InputNumberField";

type OptionItemProps = {
  option: OptionsItem;
  noOverlay?: boolean;
};

export const OptionItem = ({ option, noOverlay }: OptionItemProps) => {
  const { type, iD, description, label, shortname, value, overlayed } = option;
  const [optionValue, setOptionValue] = useState<string>("");

  const [field, meta, { setValue }] = useField(iD);

  useEffect(() => {
    setOptionValue(value);
    setValue(value);
  }, []);

  const overlayedProp = noOverlay ? undefined : overlayed;


  return (
    <div key={iD}>
      {type === "bool" && <SwitchField name={iD} label={label} description={description} overlayed={overlayedProp}/>}
      {type === "int" && <InputNumberField name={iD} label={label} description={description} overlayed={overlayedProp}/>}
      {type === "uint" && <InputNumberField name={iD} label={label} description={description} overlayed={overlayedProp}/>}
      {type === "string" && <InputField name={iD} label={label} description={description} overlayed={overlayedProp}/>}
    </div>);

};

export default OptionItem;